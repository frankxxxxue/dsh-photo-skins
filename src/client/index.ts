/**
 * Photo-skins browser half: registers the Photo skins card as a first-level
 * settings section and provides the PhotoSkinController to it. The card lists
 * every imported photo, tries it on live inside the GUI, applies it as the
 * photo skin in one click, and removes it. The plugin writes only DOM and the
 * settings ledger — no services, no events, no model access.
 */
import type { ClientContext, SettingsScope, SettingsScopeSpec } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { PhotoSkinsPanel } from './PhotoSkinsPanel.tsx'
import { en, zh, type PhotoSkinsKey } from './locales.ts'
import { PhotoSkinController, PHOTO_SKINS_NS, type PhotoSkinDescriptor, type PhotoSkinHandle } from './photo-skin.ts'

export type { PhotoSkinsComponentProps } from './PhotoSkinsPanel.tsx'
export { PhotoSkinController } from './photo-skin.ts'
export type { PhotoSkinDescriptor, PhotoSkinHandle } from './photo-skin.ts'

/** Locale namespace owned by this plugin. */
export const NS = 'photoSkins'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The photo-skins card's copy. */
    photoSkins: PhotoSkinsKey
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /**
     * Optional settings-scope compatibility binder; absent when the providing
     * plugin is not installed, so callers fall back to the official scope.
     */
    webUiSettings?: { bind<S>(spec: SettingsScopeSpec<S>): SettingsScope<S> }
  }
}

/** Business face the photo-skins apply() injects into the card. */
export interface PhotoSkinsInjected {
  photoSkin: PhotoSkinHandle
}

/** Required services: slots + locale (plugin card) and settingsScope + its transport (photo persistence). */
export const inject = ['slots', 'locale', 'settingsScope', 'connection', 'remote']

/**
 * Register the photo-skins dictionaries, the body scope attribute, and the
 * Photo skins card as a first-level settings section.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'photo-skins: dictionaries')

  // The card's own styles scope under this attribute so they keep applying
  // while other skins are tried on.
  ctx.effect(() => {
    document.body.dataset.dshPhotoSkins = ''
    return () => { delete document.body.dataset.dshPhotoSkins }
  }, 'photo-skins: body scope')

  // Photo layer controller over the photo-skins namespace. The scope is bound
  // to this plugin's fiber, so it is torn down with the card.
  const binder = ctx.get('webUiSettings') ?? ctx.settingsScope
  const scope = binder.bind<{
    enabled?: boolean
    selection?: string
    fit?: 'cover' | 'contain'
    blurMode?: 'global' | 'split'
    blur?: number
    blurEmpty?: number
    blurContent?: number
    dim?: number
    autoAccent?: boolean
  }>({ namespace: PHOTO_SKINS_NS })
  const controller = new PhotoSkinController(scope)
  // Tear the layers, observer and palette down when this plugin's fiber goes away.
  ctx.effect(() => () => controller.dispose(), 'photo-skins: controller dispose')

  // Self-bootstrap: paint the persisted selection on page load without waiting
  // for the settings card to mount. The settings scope may publish its value
  // after apply(), so re-run on every scope publish until a photo is painted.
  let bootstrapping = false
  const bootstrap = (): void => {
    const selectedId = controller.selection()
    if (selectedId === '' || controller.activeId() === selectedId || bootstrapping) return
    bootstrapping = true
    void fetch('/api/photo-skins/list')
      .then(async response => {
        const payload = await response.json().catch(() => null) as { ok?: boolean; photos?: PhotoSkinDescriptor[] } | null
        if (payload?.ok === true && Array.isArray(payload.photos)) {
          controller.sync(payload.photos.find(item => item.id === selectedId) ?? null)
        }
      })
      .catch(() => { /* offline: the card reconciles when it mounts */ })
      .finally(() => { bootstrapping = false })
  }
  bootstrap()
  scope.subscribe(bootstrap)

  const injected = (): PhotoSkinsInjected => ({ photoSkin: controller })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'photo-skins',
    order: 121,
    label: () => ctx.locale.bind('photoSkins')('title'),
    locale: 'photoSkins',
    inject: injected,
  }, PhotoSkinsPanel))
}
