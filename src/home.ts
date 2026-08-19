/**
 * DSH harness-home resolution for the photo-skins plugin. The install-layout
 * walk is the one authority that stays true however the GUI was launched: the
 * literal module path and its realpath are both scanned because profile
 * node_modules entries are commonly symlinks. See THIRD_PARTY_NOTICES.md.
 * @module dsh-photo-skins/home
 */

import { realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join as joinPath } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Derive the running harness home + profile from this package's install
 * location: the first ancestor matching <harnessHome>/profiles/<name>/
 * node_modules wins.
 * @param fromUrl - the module URL to resolve from (injectable for tests).
 * @returns the harness home (already the .dsh dir — no suffix appended) and
 *   the profile name, or null when not installed under a profiles tree.
 */
export function resolveInstallLayout(fromUrl: string = import.meta.url): { harnessHome: string; profile: string } | null {
  const starts = [fileURLToPath(fromUrl)]
  try {
    const real = realpathSync(starts[0])
    if (real !== starts[0]) starts.push(real)
  } catch {
    // Unreadable path: the literal chain alone still has a chance.
  }
  for (const start of starts) {
    let current = dirname(start)
    for (;;) {
      if (basename(current) === 'node_modules') {
        const profileDir = dirname(current)
        const profilesDir = dirname(profileDir)
        const profile = basename(profileDir)
        if (basename(profilesDir) === 'profiles' && profile !== '' && profile !== '.' && profile !== '..' && profile !== 'node_modules') {
          return { harnessHome: dirname(profilesDir), profile }
        }
      }
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
  }
  return null
}

/** First non-blank string in a list of candidate values. */
function firstNonBlank(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed !== '') return trimmed
    }
  }
  return undefined
}

/**
 * Resolve the DSH harness home exactly like the dsh launcher:
 *  - an injected `home` option (tests pass a throwaway HOME) maps to
 *    `<home>/.dsh`;
 *  - otherwise a trimmed non-empty `$DSH_HOME` is the harness home directly;
 *  - otherwise the harness home derived from this package's install layout;
 *  - otherwise `homedir()/.dsh`.
 * @param optsHome - injectable HOME (tests); default resolves from env/homedir.
 * @param env - environment map (defaults to process.env).
 * @param installHome - harness home from resolveInstallLayout (no suffix).
 */
export function resolveHarnessHome(optsHome?: string, env: NodeJS.ProcessEnv = process.env, installHome?: string): string {
  if (optsHome !== undefined) return joinPath(optsHome, '.dsh')
  return firstNonBlank(env.DSH_HOME, installHome) ?? joinPath(homedir(), '.dsh')
}

/** The photo-skins import store root: <harnessHome>/photo-skins. */
export function defaultPhotoSkinsStoreDir(home: string): string {
  return joinPath(home, 'photo-skins')
}
