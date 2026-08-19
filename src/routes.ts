/**
 * Photo-skins HTTP routes — the browser half talks to the host through plain
 * same-origin endpoints under /api/photo-skins:
 *
 *   GET  /list           → JSON photo list (the import store)
 *   GET  /image/<id>     → the photo file (mime from manifest, ETag cached)
 *   POST /import         → raw binary photo upload (magic-byte validated,
 *                          size-capped, atomically stored)
 *   POST /remove         → delete one imported photo (JSON {id})
 *
 * Compliance: photos are the user's own files — nothing is downloaded,
 * uploaded or redistributed; the import only ever writes inside
 * <harnessHome>/photo-skins. Every route rejects cross-site requests
 * (Sec-Fetch-Site / Origin fence) because a malicious webpage must not be
 * able to read or delete the user's photos through a localhost CSRF post.
 * The JSON envelope, method checks and same-origin fence helpers are
 * self-contained; see THIRD_PARTY_NOTICES.md.
 * @module dsh-photo-skins/routes
 */

import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import {
  detectPhotoType,
  findPhoto,
  listPhotos,
  newPhotoId,
  PHOTO_ID_RE,
  photoTypeRecord,
  removePhoto,
  writePhoto,
  type PhotoEntry,
  type PhotoJson,
  type PhotoType,
} from './library.ts'

/** Browser-facing base path of the photo-skins API. */
export const PHOTO_SKINS_API_PREFIX = '/api/photo-skins'

/** Max accepted photo size (bytes): 25 MiB. */
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024

/** Max display-name length (chars). */
const MAX_NAME_LENGTH = 120

/** One JSON response. */
export function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/** Require the method or answer 405. */
function requireMethod(req: IncomingMessage, res: ServerResponse, method: string): boolean {
  if (req.method === method) return true
  json(res, 405, { ok: false, error: 'method-not-allowed' })
  return false
}

/**
 * Same-origin fence. Browsers send `Sec-Fetch-Site` on every fetch: same-site
 * and cross-site pages both resolve their `Origin` here, so the checks are:
 * a `cross-site` fetch is always rejected, and an `Origin` that does not
 * match the request `Host` is rejected. Requests without either header
 * (curl, node http, old browsers) pass — this is a local single-user tool,
 * and the fence only targets the cross-site browser vector.
 */
function isSameOriginRequest(req: IncomingMessage): boolean {
  const site = req.headers['sec-fetch-site']
  if (typeof site === 'string' && site === 'cross-site') return false
  const origin = req.headers.origin
  if (typeof origin === 'string' && origin !== '' && origin !== 'null') {
    const host = req.headers.host
    if (typeof host !== 'string' || host === '') return false
    try {
      if (new URL(origin).host !== host) return false
    } catch {
      return false
    }
  }
  return true
}

/** Reject cross-site requests with 403. */
export function requireSameOrigin(req: IncomingMessage, res: ServerResponse): boolean {
  if (isSameOriginRequest(req)) return true
  json(res, 403, { ok: false, error: 'cross-site-request-rejected' })
  return false
}

/**
 * Read a JSON request body (bounded to 64KB).
 */
export function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > 64 * 1024) {
        reject(new Error('body-too-large'))
        queueMicrotask(() => req.destroy())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new Error('invalid-json'))
      }
    })
    req.on('error', reject)
  })
}

/** One accepted photo upload, after validation. */
interface RawUpload {
  bytes: Buffer
  type: PhotoType
  name: string
}

/**
 * Read a raw binary photo upload. Rejects with the HTTP status to answer:
 *  - 413 when the body exceeds the byte cap (connection destroyed);
 *  - 415 when the magic bytes match no supported raster format;
 *  - 400 on an unreadable/empty body.
 * SVG is deliberately unsupported (script risk) — the magic probe never
 * matches it, so a renamed .svg is rejected on content, not on name.
 * @param req - the incoming request.
 * @param requestedType - the declared content-type (informational only; the
 *   magic probe is the source of truth).
 * @param maxBytes - the accepted body cap (injectable for tests).
 */
function readPhotoUpload(req: IncomingMessage, requestedType: string | undefined, maxBytes: number): Promise<RawUpload> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    let settled = false
    const fail = (status: number, error: string): void => {
      if (settled) return
      settled = true
      reject({ status, error })
      queueMicrotask(() => req.destroy())
    }
    req.on('data', (chunk: Buffer) => {
      if (settled) return
      size += chunk.length
      if (size > maxBytes) {
        fail(413, 'photo-too-large')
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (settled) return
      settled = true
      if (chunks.length === 0) {
        reject({ status: 400, error: 'empty-body' })
        return
      }
      const bytes = Buffer.concat(chunks)
      // Content magic is the source of truth: the browser's declared
      // content-type may lie, the file signature cannot.
      const type = detectPhotoType(bytes.subarray(0, 16))
      if (type === null) {
        reject({ status: 415, error: 'unsupported-image-type' })
        return
      }
      // A declared type that contradicts the probe is tolerated (the probe
      // wins) — but a request declaring a non-image is rejected outright.
      if (requestedType !== undefined && !requestedType.startsWith('image/') && requestedType !== 'application/octet-stream') {
        reject({ status: 415, error: 'unsupported-image-type' })
        return
      }
      const rawName = req.headers['x-photo-skin-name']
      let name = typeof rawName === 'string' ? rawName.trim() : ''
      try {
        // The browser half URL-encodes the display name (file names are
        // arbitrary unicode); a malformed sequence degrades to the raw text.
        name = decodeURIComponent(name)
      } catch {
        // Keep the raw (trimmed) value.
      }
      name = name.slice(0, MAX_NAME_LENGTH)
      resolve({ bytes, type, name })
    })
    req.on('error', () => {
      if (!settled) {
        settled = true
        reject({ status: 400, error: 'unreadable-body' })
      }
    })
  })
}

/** Serialize one photo entry for the browser. */
function photoToJson(entry: PhotoEntry): PhotoJson {
  const record = photoTypeRecord(entry.type)
  return {
    id: entry.id,
    name: entry.name,
    type: entry.type,
    mime: record.mime,
    bytes: entry.bytes,
    importedAt: entry.importedAt,
    url: PHOTO_SKINS_API_PREFIX + '/image/' + entry.id,
  }
}

/** Dependencies the route family needs. */
export interface PhotoSkinsRouteDeps {
  /** Import-store root (<harnessHome>/photo-skins). */
  storeDir: string
  /** Injectable now/random for tests (defaults to the real ones). */
  now?: () => number
  random?: () => string
  /** Accepted upload cap (defaults to MAX_PHOTO_BYTES; injectable for tests). */
  maxBytes?: number
}

/** Build the photo-skins route family. */
export function makePhotoSkinsRoutes(deps: PhotoSkinsRouteDeps): WebRoute[] {
  const now = deps.now ?? (() => Date.now())
  const random = deps.random ?? (() => Math.random().toString(36).slice(2, 8))
  const storeDir = deps.storeDir
  const maxBytes = deps.maxBytes ?? MAX_PHOTO_BYTES
  const ensureStore = (): void => {
    mkdirSync(storeDir, { recursive: true })
  }
  const routes: WebRoute[] = []

  // GET /list — the photo list.
  routes.push({
    kind: 'exact',
    path: PHOTO_SKINS_API_PREFIX + '/list',
    handler: (req, res) => {
      if (!requireMethod(req, res, 'GET')) return
      if (!requireSameOrigin(req, res)) return
      try {
        json(res, 200, { ok: true, photos: listPhotos(storeDir).map(photoToJson) })
      } catch (error) {
        json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    },
  })

  // GET /image/<id> — the photo file (mime from manifest, ETag from mtime+size).
  const imagePrefix = PHOTO_SKINS_API_PREFIX + '/image/'
  routes.push({
    kind: 'prefix',
    path: PHOTO_SKINS_API_PREFIX + '/image',
    handler: (req, res) => {
      if (!requireMethod(req, res, 'GET')) return
      if (!requireSameOrigin(req, res)) return
      let id: string
      try {
        id = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname.slice(imagePrefix.length))
      } catch {
        json(res, 400, { ok: false, error: 'invalid-photo-id' })
        return
      }
      if (!PHOTO_ID_RE.test(id)) {
        json(res, 400, { ok: false, error: 'invalid-photo-id' })
        return
      }
      try {
        const entry = findPhoto(storeDir, id)
        if (entry === null) {
          json(res, 404, { ok: false, error: 'photo-not-found' })
          return
        }
        const record = photoTypeRecord(entry.type)
        const stat = statSync(entry.fileAbs)
        const etag = '"' + Math.round(stat.mtimeMs).toString(36) + '-' + stat.size.toString(36) + '"'
        if (req.headers['if-none-match'] === etag) {
          res.writeHead(304, { etag })
          res.end()
          return
        }
        res.writeHead(200, {
          'content-type': record.mime,
          'content-length': String(stat.size),
          'cache-control': 'private, max-age=3600',
          etag,
        })
        createReadStream(entry.fileAbs).pipe(res)
      } catch (error) {
        json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
      }
    },
  })

  // POST /import — raw binary photo upload.
  routes.push({
    kind: 'exact',
    path: PHOTO_SKINS_API_PREFIX + '/import',
    handler: (req, res) => {
      if (!requireMethod(req, res, 'POST')) return
      if (!requireSameOrigin(req, res)) return
      readPhotoUpload(req, req.headers['content-type'], maxBytes).then(
        (upload) => {
          try {
            ensureStore()
            const id = newPhotoId(now(), random)
            const name = upload.name === '' ? 'photo-' + id.slice(0, 10) : upload.name
            const entry = writePhoto(storeDir, id, upload.type, upload.bytes, name, now())
            json(res, 200, { ok: true, photo: photoToJson(entry) })
          } catch (error) {
            json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
          }
        },
        (failure: { status: number; error: string }) => {
          json(res, failure.status, { ok: false, error: failure.error })
        },
      )
    },
  })

  // POST /remove — delete one imported photo (JSON {id}).
  routes.push({
    kind: 'exact',
    path: PHOTO_SKINS_API_PREFIX + '/remove',
    handler: (req, res) => {
      if (!requireMethod(req, res, 'POST')) return
      if (!requireSameOrigin(req, res)) return
      readJsonBody(req).then(
        (body) => {
          const record = (typeof body === 'object' && body !== null) ? body as Record<string, unknown> : {}
          const id = record.id
          if (typeof id !== 'string' || !PHOTO_ID_RE.test(id)) {
            json(res, 400, { ok: false, error: 'invalid-photo-id' })
            return
          }
          try {
            // Idempotent: removing an already-gone photo is success.
            removePhoto(storeDir, id)
            json(res, 200, { ok: true })
          } catch (error) {
            json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
          }
        },
        (error: unknown) => {
          json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) })
        },
      )
    },
  })

  return routes
}
