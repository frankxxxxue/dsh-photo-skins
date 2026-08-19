import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  detectPhotoType,
  findPhoto,
  listPhotos,
  newPhotoId,
  PHOTO_ID_RE,
  readPhotoManifest,
  removePhoto,
  writePhoto,
} from '../src/library.ts'

let store: string
beforeEach(() => {
  store = mkdtempSync(join(tmpdir(), 'photo-skins-test-'))
})
afterEach(() => {
  rmSync(store, { recursive: true, force: true })
})

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const GIF89 = Buffer.from('GIF89a....', 'ascii')
const WEBP = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP', 'ascii')])
const SVG = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8')

describe('detectPhotoType', () => {
  it('matches png / jpeg / webp / gif magic bytes', () => {
    expect(detectPhotoType(PNG.subarray(0, 16))).toBe('png')
    expect(detectPhotoType(JPEG.subarray(0, 16))).toBe('jpeg')
    expect(detectPhotoType(WEBP.subarray(0, 16))).toBe('webp')
    expect(detectPhotoType(GIF89.subarray(0, 16))).toBe('gif')
  })

  it('rejects svg and arbitrary bytes', () => {
    expect(detectPhotoType(SVG.subarray(0, 16))).toBeNull()
    expect(detectPhotoType(Buffer.from([1, 2, 3, 4]))).toBeNull()
    expect(detectPhotoType(Buffer.alloc(0))).toBeNull()
  })
})

describe('photo store', () => {
  it('writes, reads, finds and removes one photo atomically', () => {
    const id = newPhotoId(1700000000000, () => 'abc123')
    expect(PHOTO_ID_RE.test(id)).toBe(true)
    const entry = writePhoto(store, id, 'png', PNG, '我的照片.png')
    expect(entry.bytes).toBe(PNG.length)
    expect(findPhoto(store, id)?.name).toBe('我的照片.png')
    expect(readPhotoManifest(join(store, id))?.type).toBe('png')
    const listed = listPhotos(store)
    expect(listed.map(p => p.id)).toEqual([id])
    removePhoto(store, id)
    expect(listPhotos(store)).toEqual([])
  })

  it('skips broken dirs and invalid ids on list', () => {
    writePhoto(store, newPhotoId(1, () => 'aaaaaa'), 'jpeg', JPEG, 'ok.jpg')
    writeFileSync(join(store, 'not-an-id-dir'), 'x') // stray file
    rmSync(join(store, 'broken'), { recursive: true, force: true })
    writeFileSync(join(store, 'broken'), 'not a manifest') // file where a dir should be
    const listed = listPhotos(store)
    expect(listed).toHaveLength(1)
    expect(listed[0].name).toBe('ok.jpg')
  })

  it('skips entries whose original file is gone', () => {
    const id = newPhotoId(2, () => 'bbbbbb')
    writePhoto(store, id, 'gif', GIF89, 'gone.gif')
    rmSync(join(store, id, 'original.gif'))
    expect(listPhotos(store)).toEqual([])
  })

  it('remove is idempotent and rejects invalid ids', () => {
    removePhoto(store, 'missing-id-1234')
    removePhoto(store, '../../../etc')
    expect(listPhotos(store)).toEqual([])
  })
})
