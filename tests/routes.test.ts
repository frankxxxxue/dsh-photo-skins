import { EventEmitter } from 'node:events'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Writable } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makePhotoSkinsRoutes, PHOTO_SKINS_API_PREFIX, type PhotoSkinsRouteDeps } from '../src/routes.ts'

/** Minimal fake request: emits the body as data events, carries headers. */
class FakeReq extends EventEmitter {
  headers: Record<string, string | undefined> = {
    host: '127.0.0.1:3080',
  }
  method = 'GET'
  url = '/'
  body: Buffer | null = null
  destroyed = false
  constructor(body?: Buffer) {
    super()
    this.body = body ?? null
  }
  destroy(): void {
    this.destroyed = true
  }
}

/** Minimal fake response: a Writable that captures status, headers and body. */
class FakeRes extends Writable {
  statusCode = 200
  headers: Record<string, string | number> = {}
  chunks: Buffer[] = []
  constructor() {
    super({ decodeStrings: true })
  }
  writeHead(status: number, headers?: Record<string, string | number>): this {
    this.statusCode = status
    Object.assign(this.headers, headers ?? {})
    return this
  }
  setHeader(name: string, value: string | number): void {
    this.headers[name] = value
  }
  _write(chunk: Buffer, _encoding: string, callback: () => void): void {
    this.chunks.push(Buffer.from(chunk))
    callback()
  }
  text(): string {
    return Buffer.concat(this.chunks).toString('utf8')
  }
}

interface Outcome {
  status: number
  headers: Record<string, string | number>
  text: string
  raw: Buffer
}

/** Drive one route handler with a fake request/response pair to completion. */
async function run(
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>,
  req: FakeReq,
  res: FakeRes,
): Promise<Outcome> {
  const done = new Promise<void>((resolve) => { res.on('finish', resolve) })
  void handler(req as unknown as IncomingMessage, res as unknown as ServerResponse)
  queueMicrotask(() => {
    if (req.body !== null) {
      const chunk = 256
      for (let i = 0; i < req.body.length; i += chunk) {
        req.emit('data', req.body.subarray(i, Math.min(i + chunk, req.body.length)))
      }
    }
    req.emit('end')
  })
  await done
  return { status: res.statusCode, headers: res.headers, text: res.text(), raw: Buffer.concat(res.chunks) }
}

const SAME_ORIGIN = { 'sec-fetch-site': 'same-origin' }
const CROSS_SITE = { 'sec-fetch-site': 'cross-site' }

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8')

let store: string
let deps: PhotoSkinsRouteDeps
let routes: ReturnType<typeof makePhotoSkinsRoutes>
beforeEach(() => {
  store = mkdtempSync(join(tmpdir(), 'photo-skins-routes-'))
  deps = {
    storeDir: store,
    now: () => 1700000000000,
    random: () => 'abc123',
    maxBytes: 4096,
  }
  routes = makePhotoSkinsRoutes(deps)
})
afterEach(() => {
  rmSync(store, { recursive: true, force: true })
})

const routeFor = (path: string) => {
  const exact = routes.find(r => r.kind === 'exact' && r.path === path)
  if (exact !== undefined) return exact.handler
  throw new Error('route not found: ' + path)
}

describe('photo-skins routes', () => {
  it('GET /list answers the store contents', async () => {
    const req = new FakeReq()
    req.headers = { ...req.headers, ...SAME_ORIGIN }
    const res = new FakeRes()
    const outcome = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/list'), req, res)
    expect(outcome.status).toBe(200)
    expect(JSON.parse(outcome.text)).toEqual({ ok: true, photos: [] })
  })

  it('rejects cross-site requests with 403', async () => {
    const req = new FakeReq()
    req.headers = { ...req.headers, ...CROSS_SITE }
    const res = new FakeRes()
    const outcome = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/list'), req, res)
    expect(outcome.status).toBe(403)
    expect(JSON.parse(outcome.text).error).toBe('cross-site-request-rejected')
  })

  it('rejects an Origin that does not match the Host', async () => {
    const req = new FakeReq()
    req.headers = { ...req.headers, origin: 'https://evil.example' }
    const res = new FakeRes()
    const outcome = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/list'), req, res)
    expect(outcome.status).toBe(403)
  })

  it('imports a valid PNG and serves it back with mime + etag', async () => {
    const importReq = new FakeReq(PNG)
    importReq.method = 'POST'
    importReq.headers = {
      ...importReq.headers,
      ...SAME_ORIGIN,
      'content-type': 'image/png',
      'x-photo-skin-name': encodeURIComponent('海边.png'),
    }
    const importRes = new FakeRes()
    const imported = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/import'), importReq, importRes)
    expect(imported.status).toBe(200)
    const payload = JSON.parse(imported.text)
    expect(payload.ok).toBe(true)
    expect(payload.photo.name).toBe('海边.png')
    expect(payload.photo.type).toBe('png')
    const id: string = payload.photo.id

    const imageReq = new FakeReq()
    imageReq.url = PHOTO_SKINS_API_PREFIX + '/image/' + id
    imageReq.headers = { ...imageReq.headers, ...SAME_ORIGIN }
    const imageRes = new FakeRes()
    const served = await run(routes.find(r => r.kind === 'prefix')!.handler, imageReq, imageRes)
    expect(served.status).toBe(200)
    expect(served.headers['content-type']).toBe('image/png')
    expect(served.raw).toEqual(PNG)
    expect(typeof served.headers.etag).toBe('string')

    // 304 on matching etag.
    const againReq = new FakeReq()
    againReq.url = PHOTO_SKINS_API_PREFIX + '/image/' + id
    againReq.headers = { ...againReq.headers, ...SAME_ORIGIN, 'if-none-match': String(served.headers.etag) }
    const againRes = new FakeRes()
    const again = await run(routes.find(r => r.kind === 'prefix')!.handler, againReq, againRes)
    expect(again.status).toBe(304)
  })

  it('rejects a renamed SVG by content (415), not by name', async () => {
    const req = new FakeReq(SVG)
    req.method = 'POST'
    req.headers = { ...req.headers, ...SAME_ORIGIN, 'content-type': 'image/png' }
    const res = new FakeRes()
    const outcome = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/import'), req, res)
    expect(outcome.status).toBe(415)
    expect(JSON.parse(outcome.text).error).toBe('unsupported-image-type')
  })

  it('rejects a body over the cap with 413 and destroys the request', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(8192, 7)])
    const req = new FakeReq(big)
    req.method = 'POST'
    req.headers = { ...req.headers, ...SAME_ORIGIN, 'content-type': 'image/png' }
    const res = new FakeRes()
    const outcome = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/import'), req, res)
    expect(outcome.status).toBe(413)
    expect(JSON.parse(outcome.text).error).toBe('photo-too-large')
    expect(req.destroyed).toBe(true)
  })

  it('removes an imported photo idempotently', async () => {
    const importReq = new FakeReq(PNG)
    importReq.method = 'POST'
    importReq.headers = { ...importReq.headers, ...SAME_ORIGIN, 'content-type': 'image/png' }
    const importRes = new FakeRes()
    const imported = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/import'), importReq, importRes)
    const id: string = JSON.parse(imported.text).photo.id

    const remove = async (target: unknown): Promise<Outcome> => {
      const req = new FakeReq(Buffer.from(JSON.stringify({ id: target })))
      req.method = 'POST'
      req.headers = { ...req.headers, ...SAME_ORIGIN, 'content-type': 'application/json' }
      const res = new FakeRes()
      return await run(routeFor(PHOTO_SKINS_API_PREFIX + '/remove'), req, res)
    }

    expect((await remove(id)).status).toBe(200)
    expect((await remove(id)).status).toBe(200) // idempotent
    const listReq = new FakeReq()
    listReq.headers = { ...listReq.headers, ...SAME_ORIGIN }
    const listRes = new FakeRes()
    const list = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/list'), listReq, listRes)
    expect(JSON.parse(list.text).photos).toEqual([])
  })

  it('rejects invalid ids on remove and image routes', async () => {
    const removeReq = new FakeReq(Buffer.from(JSON.stringify({ id: '../../../etc' })))
    removeReq.method = 'POST'
    removeReq.headers = { ...removeReq.headers, ...SAME_ORIGIN, 'content-type': 'application/json' }
    const removeRes = new FakeRes()
    const removed = await run(routeFor(PHOTO_SKINS_API_PREFIX + '/remove'), removeReq, removeRes)
    expect(removed.status).toBe(400)

    const imageReq = new FakeReq()
    imageReq.url = PHOTO_SKINS_API_PREFIX + '/image/..%2F..%2Fetc'
    imageReq.headers = { ...imageReq.headers, ...SAME_ORIGIN }
    const imageRes = new FakeRes()
    const served = await run(routes.find(r => r.kind === 'prefix')!.handler, imageReq, imageRes)
    expect(served.status).toBe(400)

    const missingReq = new FakeReq()
    missingReq.url = PHOTO_SKINS_API_PREFIX + '/image/unknown-photo-01'
    missingReq.headers = { ...missingReq.headers, ...SAME_ORIGIN }
    const missingRes = new FakeRes()
    const missing = await run(routes.find(r => r.kind === 'prefix')!.handler, missingReq, missingRes)
    expect(missing.status).toBe(404)
  })
})
