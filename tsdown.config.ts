/**
 * Standalone tsdown config for the photo-skins plugin — a self-contained
 * build preset that emits two artifacts (see THIRD_PARTY_NOTICES.md):
 *
 *  - lib/ (node half): src/index.ts compiled to ESM; @deepseek-ai/* runtime
 *    deps stay external (the dsh host resolves them from the profile tree).
 *  - lib/client.js (browser half): a closure-factory artifact — the bundle
 *    calls window.__ModuleLoader__.load({id, factory}) and resolves externals
 *    through the injected require (loader module table, no globals). CSS
 *    Modules are compiled by lightningcss inline: importing x.module.css
 *    yields the hashed class map and the css text auto-injects a
 *    <style data-plugin> tag at factory execution.
 *
 * The platform module list mirrors the shell's shared seed table. The purity
 * gate rejects @deepseek-ai/* value imports that are not platform modules /
 * inline-safe wire layers.
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { basename, dirname, isAbsolute, relative, resolve as resolvePath, sep } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

/** The browser platform module specifiers shared by the shell module table. */
export const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/**
 * Runtime exemption: the snapshot-store engine lives in runtime and is
 * answered natively by the lazy CJS table at runtime.
 */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/** Externals resolved from the loader module table. */
export const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

/** Wire/type layers a client bundle may inline (no shared runtime identity). */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

/** Generated descriptor/codec contribution with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

/** Virtual-id wrapper keeping module CSS away from tsdown's css pipeline. */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/** Repository root: tsdown runs with the package dir as cwd. */
const REPOSITORY_ROOT = process.cwd()

/** Rebase an absolute path onto a repo-relative id so the emitted bundle does
 *  not embed a machine path (a rebuilt artifact would otherwise differ on
 *  every checkout). */
function repositoryRelativePath(physical: string): string {
  if (!isAbsolute(physical)) return physical
  const repositoryPath = relative(REPOSITORY_ROOT, physical).split(sep).join('/')
  return repositoryPath.startsWith('../') ? physical : repositoryPath
}

/** Resolve an emitted JS asset import against its source-tree counterpart. */
function sourceAssetPath(source: string, importer: string): string {
  const emitted = resolvePath(dirname(importer), source)
  if (existsSync(emitted)) return emitted
  const marker = 'lib/types/'
  const boundary = emitted.indexOf(marker)
  if (boundary < 0) return emitted
  return resolvePath(emitted.slice(0, boundary), 'src', emitted.slice(boundary + marker.length))
}

/** The node-half library config (external cordis + host-side runtime deps). */
function clientLibraryConfig(id: string, libEntry: readonly string[]): UserConfig {
  return {
    name: id,
    entry: [...libEntry],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    // The cordis framework and the dsh host services resolve at runtime from
    // the dsh profile tree, never from this repo's install; keep them
    // external (same stance as the host-side runtime deps above).
    external: ['@deepseek-ai/cordis', '@deepseek-ai/dsh-settings', 'schemastery'],
  }
}

/** The browser-half closure-factory config. */
function clientConfig(id: string, entry: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: entry },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    // Sourcemaps are build-only and roughly double the published payload
    // (the .map is larger than client.js itself); the shipped bundle carries
    // no runtime need for them, so they stay off.
    sourcemap: false,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    // Bundled node-idiom deps probe these; the substitutions mirror the
    // shell's Vite seed path.
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    // tsdown auto-externalizes package dependencies; anything NOT in the
    // loader module table must inline instead.
    noExternal: (id: string) => (CLIENT_EXTERNALS.includes(id) ? undefined : true),
    plugins: [{
      // Bundle purity gate: platform seed entries stay external, inline-safe
      // wire layers inline, and every other @deepseek-ai value import is a
      // build error. Cross-plugin collaboration goes through cordis services.
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null
        if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
        throw new Error(
          `client bundle purity: "${source}" is not a platform module (CLIENT_EXTERNALS), an inline-safe wire layer, or a generated /remote contribution — `
          + 'cross-plugin value imports are forbidden; collaborate through cordis services (type-only imports are erased and never reach this gate)',
        )
      },
    }, {
      name: 'dsh-css-modules-inline',
      resolveId(source: string, importer: string | undefined) {
        if (!source.endsWith('.module.css')) return null
        const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
        return CSS_VIRTUAL_PREFIX + repositoryRelativePath(abs) + CSS_VIRTUAL_SUFFIX
      },
      async load(virtualId: string) {
        if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
        const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
        const physical = isAbsolute(fileId) ? fileId : resolvePath(REPOSITORY_ROOT, fileId)
        this.addWatchFile(physical)
        const source = await readFile(physical)
        const { code, exports: cssExports } = transform({
          filename: fileId, // repo-relative: keeps emitted class hashes machine-independent
          code: source,
          cssModules: { pattern: '[hash]_[local]' },
          minify: true,
        })
        const classMap: Record<string, string> = {}
        for (const [local, exp] of Object.entries(cssExports ?? {}).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
          classMap[local] = exp.name
        }
        return [
          `const css = ${JSON.stringify(code.toString())};`,
          `const tagId = ${JSON.stringify(`${id}/${basename(physical)}`)};`,
          'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
          '  const tag = document.createElement(\'style\');',
          `  tag.dataset.plugin = ${JSON.stringify(id)};`,
          '  tag.dataset.pluginCss = tagId;',
          '  tag.textContent = css;',
          '  document.head.appendChild(tag);',
          '}',
          `export default ${JSON.stringify(classMap)};`,
        ].join('\n')
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

function photoSkinsBundle(id: string, libEntry: readonly string[]): UserConfig[] {
  const hasClient = existsSync(resolvePath(REPOSITORY_ROOT, 'src/client/index.ts'))
  const configs: UserConfig[] = [clientLibraryConfig(id, libEntry)]
  if (hasClient) configs.push(clientConfig(id, 'src/client/index.ts'))
  return configs
}

export default photoSkinsBundle('dsh-photo-skins', ['src/index.ts'])
