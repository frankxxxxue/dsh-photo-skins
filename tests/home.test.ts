import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultPhotoSkinsStoreDir, resolveHarnessHome, resolveInstallLayout } from '../src/home.ts'

let root: string
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'photo-skins-home-'))
})
afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('resolveHarnessHome', () => {
  it('maps an injected home to <home>/.dsh', () => {
    expect(resolveHarnessHome(root)).toBe(join(root, '.dsh'))
  })

  it('prefers a trimmed non-blank DSH_HOME over install home', () => {
    const dshHome = join(root, 'custom')
    expect(resolveHarnessHome(undefined, { DSH_HOME: dshHome }, join(root, 'install'))).toBe(dshHome)
    expect(resolveHarnessHome(undefined, { DSH_HOME: '   ' }, join(root, 'install'))).toBe(join(root, 'install'))
  })

  it('falls back to homedir()/.dsh when nothing else matches', () => {
    expect(resolveHarnessHome(undefined, {}, undefined)).toBe(join(homedir(), '.dsh'))
  })
})

describe('resolveInstallLayout', () => {
  it('finds the profiles/<name>/node_modules ancestor', () => {
    const profiles = join(root, 'profiles')
    const webModules = join(profiles, 'web', 'node_modules')
    const fake = join(webModules, 'dsh-photo-skins', 'lib', 'index.js')
    mkdirSync(join(fake, '..'), { recursive: true })
    writeFileSync(fake, '')
    const layout = resolveInstallLayout(pathToFileURL(fake).href)
    expect(layout).toEqual({ harnessHome: root, profile: 'web' })
  })

  it('follows symlinked install locations via realpath', () => {
    const real = join(root, 'real-store', 'profiles', 'web', 'node_modules', 'dsh-photo-skins', 'lib')
    mkdirSync(real, { recursive: true })
    writeFileSync(join(real, 'index.js'), '')
    const linkDir = join(root, 'linked', 'profiles', 'web', 'node_modules')
    mkdirSync(linkDir, { recursive: true })
    symlinkSync(real, join(linkDir, 'dsh-photo-skins'), 'junction')
    const layout = resolveInstallLayout(pathToFileURL(join(linkDir, 'dsh-photo-skins', 'lib', 'index.js')).href)
    expect(layout?.profile).toBe('web')
    expect(layout?.harnessHome).toBe(join(root, 'linked'))
  })

  it('returns null outside a profiles tree', () => {
    const elsewhere = join(root, 'somewhere', 'node_modules', 'pkg', 'lib')
    mkdirSync(elsewhere, { recursive: true })
    expect(resolveInstallLayout(pathToFileURL(join(elsewhere, 'index.js')).href)).toBeNull()
  })
})

describe('defaultPhotoSkinsStoreDir', () => {
  it('points at <home>/photo-skins', () => {
    expect(defaultPhotoSkinsStoreDir(join(root, '.dsh'))).toBe(join(root, '.dsh', 'photo-skins'))
  })
})
