/**
 * Photo import store for the photo-skins plugin (host half). Each imported
 * photo lives in <store>/<id>/ as `original.<ext>` plus a manifest.json
 * recording the display name, detected image type, size and import time.
 * The id is generated here and validated against a whitelist regex before
 * any path use, so a crafted request can never walk outside the store tree.
 * Everything is plain data and pure filesystem reads — injectable for tests.
 * @module dsh-photo-skins/library
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join as joinPath } from 'node:path'

/** Legal stored-photo id shape. */
export const PHOTO_ID_RE = /^[a-z0-9][a-z0-9-]{6,38}$/

/** One supported raster image type. */
export type PhotoType = 'png' | 'jpeg' | 'webp' | 'gif'

/** Supported raster types: mime, file extension and magic-byte probe. */
export const PHOTO_TYPES: ReadonlyArray<{
  type: PhotoType
  mime: string
  ext: string
  /** True when the file head carries this format's signature. */
  isHead(head: Buffer): boolean
}> = [
  {
    type: 'png',
    mime: 'image/png',
    ext: 'png',
    isHead: (head) => head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 && head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a,
  },
  {
    type: 'jpeg',
    mime: 'image/jpeg',
    ext: 'jpg',
    isHead: (head) => head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff,
  },
  {
    type: 'webp',
    mime: 'image/webp',
    ext: 'webp',
    isHead: (head) => head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP',
  },
  {
    type: 'gif',
    mime: 'image/gif',
    ext: 'gif',
    isHead: (head) => head.length >= 6 && (head.toString('ascii', 0, 6) === 'GIF87a' || head.toString('ascii', 0, 6) === 'GIF89a'),
  },
]

/** Detect the raster type from a file head, or null when unsupported. */
export function detectPhotoType(head: Buffer): PhotoType | null {
  for (const entry of PHOTO_TYPES) {
    if (entry.isHead(head)) return entry.type
  }
  return null
}

/** Look up a photo type's static record. */
export function photoTypeRecord(type: PhotoType): (typeof PHOTO_TYPES)[number] {
  const record = PHOTO_TYPES.find((entry) => entry.type === type)
  if (record === undefined) throw new Error(`unknown photo type: ${type}`)
  return record
}

/** The per-photo manifest persisted next to the original file. */
export interface PhotoManifest {
  id: string
  name: string
  type: PhotoType
  bytes: number
  importedAt: number
}

/** One photo entry as served to the browser (url assigned by the routes). */
export interface PhotoEntry extends PhotoManifest {
  fileAbs: string
}

/** One photo entry serialized for the /list route. */
export interface PhotoJson {
  id: string
  name: string
  type: PhotoType
  mime: string
  bytes: number
  importedAt: number
  url: string
}

/** Read a photo dir's manifest.json; null when missing or malformed. */
export function readPhotoManifest(dir: string): PhotoManifest | null {
  let raw: string
  try {
    raw = readFileSync(joinPath(dir, 'manifest.json'), 'utf8')
  } catch {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    if (typeof record.id !== 'string' || !PHOTO_ID_RE.test(record.id)) return null
    if (typeof record.name !== 'string') return null
    if (record.type !== 'png' && record.type !== 'jpeg' && record.type !== 'webp' && record.type !== 'gif') return null
    if (typeof record.bytes !== 'number' || !Number.isFinite(record.bytes)) return null
    if (typeof record.importedAt !== 'number' || !Number.isFinite(record.importedAt)) return null
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      bytes: record.bytes,
      importedAt: record.importedAt,
    }
  } catch {
    return null
  }
}

/**
 * Enumerate the import store. Directories without a valid manifest.json
 * (or whose original file is gone) are skipped — never thrown over.
 * @param storeDir - the import-store root.
 * @returns entries ordered by import time (oldest first).
 */
export function listPhotos(storeDir: string): PhotoEntry[] {
  let entries: string[]
  try {
    entries = readdirSync(storeDir)
  } catch {
    return []
  }
  const out: PhotoEntry[] = []
  for (const name of entries) {
    if (!PHOTO_ID_RE.test(name)) continue
    const dir = joinPath(storeDir, name)
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue
    const manifest = readPhotoManifest(dir)
    if (manifest === null || manifest.id !== name) continue
    const record = photoTypeRecord(manifest.type)
    const fileAbs = joinPath(dir, 'original.' + record.ext)
    if (!existsSync(fileAbs)) continue
    out.push({ ...manifest, fileAbs })
  }
  out.sort((a, b) => a.importedAt - b.importedAt)
  return out
}

/** Resolve a stored photo by id; null when unknown or unreadable. */
export function findPhoto(storeDir: string, id: string): PhotoEntry | null {
  if (!PHOTO_ID_RE.test(id)) return null
  const dir = joinPath(storeDir, id)
  const manifest = readPhotoManifest(dir)
  if (manifest === null || manifest.id !== id) return null
  const record = photoTypeRecord(manifest.type)
  const fileAbs = joinPath(dir, 'original.' + record.ext)
  if (!existsSync(fileAbs)) return null
  return { ...manifest, fileAbs }
}

/** Generate a fresh store id (timestamp base36 + random base36). */
export function newPhotoId(now: number = Date.now(), random: () => string = () => Math.random().toString(36).slice(2, 8)): string {
  return now.toString(36) + '-' + random()
}

/** Persist one imported photo into <store>/<id>/, atomically (tmp + rename). */
export function writePhoto(storeDir: string, id: string, type: PhotoType, bytes: Buffer, name: string, importedAt: number = Date.now()): PhotoEntry {
  const record = photoTypeRecord(type)
  const dir = joinPath(storeDir, id)
  mkdirSync(dir, { recursive: true })
  const tmp = joinPath(dir, 'original.' + record.ext + '.tmp')
  writeFileSync(tmp, bytes)
  renameSync(tmp, joinPath(dir, 'original.' + record.ext))
  const manifest: PhotoManifest = { id, name, type, bytes: bytes.length, importedAt }
  const manifestTmp = joinPath(dir, 'manifest.json.tmp')
  writeFileSync(manifestTmp, JSON.stringify(manifest, null, 2), 'utf8')
  renameSync(manifestTmp, joinPath(dir, 'manifest.json'))
  return { ...manifest, fileAbs: joinPath(dir, 'original.' + record.ext) }
}

/** Delete one stored photo dir (idempotent: a missing dir is success). */
export function removePhoto(storeDir: string, id: string): void {
  if (!PHOTO_ID_RE.test(id)) return
  rmSync(joinPath(storeDir, id), { recursive: true, force: true })
}
