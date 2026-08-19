/**
 * Host half of the photo-skins plugin: declares the `photo-skins` settings
 * namespace (persistence lives in the settings ledger, the browser half owns
 * application) and mounts the `/api/photo-skins/*` routes the browser half
 * uses for import / list / remove. Photos are stored under
 * <harnessHome>/photo-skins — user files stay on the user's machine.
 *
 * Failure policy: route mounting problems are logged, never thrown — the web
 * shell fails the whole boot when a plugin apply throws, and photo-skins
 * must not take the GUI down.
 * @module dsh-photo-skins
 */

import { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import z from 'schemastery'
// Type-only: pulls the dsh-host-webserver service seat (ctx.webServer).
import type {} from '@deepseek-ai/dsh-host-webserver'
import { defaultPhotoSkinsStoreDir, resolveHarnessHome } from './home.ts'
import { mountOnce } from './mount-once.ts'
import { makePhotoSkinsRoutes, PHOTO_SKINS_API_PREFIX } from './routes.ts'

export { makePhotoSkinsRoutes, PHOTO_SKINS_API_PREFIX } from './routes.ts'

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'photo-skins'

/** Services required before the photo-skins plugin can mount its routes. */
export const inject = ['webServer']

/**
 * Settings namespace for the photo skin, owned by the photo-skins plugin.
 * The browser half spells the same string so it can bind the scope without
 * depending on this Host package.
 */
export const PHOTO_SKINS_NAMESPACE = settingsNamespace('photo-skins')

/** Plugin-configuration fields for the photo skin. */
export interface PhotoSkinsConfig {
  /** Master switch for the photo-skins feature. */
  enabled?: boolean
  /** The applied photo id ('' = none). */
  selection?: string
  /** Backdrop fit mode. */
  fit?: 'cover' | 'contain'
  /** Blur mode: one global value, or split empty/content values. */
  blurMode?: 'global' | 'split'
  /** Global blur radius (blurMode 'global'), 0-100 px. */
  blur?: number
  /** Split blur radius when the conversation has no content, 0-100 px. */
  blurEmpty?: number
  /** Split blur radius when the conversation has content, 0-100 px. */
  blurContent?: number
  /** Darkening scrim over the photo, 0-100 percent. */
  dim?: number
  /** Extract the accent palette from the photo (CSS variables). */
  autoAccent?: boolean
}

/** Runtime schema for PhotoSkinsConfig. */
export const PhotoSkinsConfigSchema: z<PhotoSkinsConfig> = z.object({
  enabled: z.boolean().default(true),
  selection: z.string().default(''),
  fit: z.union(['cover', 'contain'] as const).default('cover'),
  blurMode: z.union(['global', 'split'] as const).default('global'),
  blur: z.number().min(0).max(100).step(1).default(0),
  blurEmpty: z.number().min(0).max(100).step(1).default(0),
  blurContent: z.number().min(0).max(100).step(1).default(0),
  dim: z.number().min(0).max(100).step(5).default(25),
  autoAccent: z.boolean().default(true),
})

/** Apply the host half. */
export const apply = mountOnce('dsh-photo-skins', applyImpl)

function applyImpl(ctx: Context): void {
  // Settings wiring for the photo-skins namespace. The browser half binds the
  // scope and applies the value to the page; this side just declares the
  // namespace + schema so the value persists and re-resolves across reloads.
  installSettingsSection(ctx, PHOTO_SKINS_NAMESPACE, PhotoSkinsConfigSchema, {}, {
    setSource: () => { /* application is browser-side; value is read from the scope */ },
    onChange: () => { /* browser half re-applies on scope publish */ },
  })

  const routes = makePhotoSkinsRoutes({
    storeDir: defaultPhotoSkinsStoreDir(resolveHarnessHome()),
  })
  try {
    ctx.effect(() => {
      const disposers: Array<() => void> = []
      try {
        for (const route of routes) disposers.push(ctx.webServer.register(route))
      } catch (error) {
        // Roll back whatever registered before the failure so a partial
        // mount never leaves half a route family live; the outer catch logs.
        for (const dispose of disposers) dispose()
        throw error
      }
      return () => { for (const dispose of disposers) dispose() }
    }, 'photo-skins: routes')
  } catch (error) {
    console.error('[photo-skins] route registration failed:', error)
  }
}
