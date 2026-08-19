/**
 * Photo skin controller for the photo-skins plugin: paints the applied photo
 * as the GUI's backdrop via the BODY background — the canvas-level mechanism
 * that is reliably visible through the shell's translucent panels. A fixed
 * `z-index:-3` layer would sit behind the app surface and vanish, so this
 * controller writes the photo straight onto document.body.
 *
 * Backdrop composition (background-image, top to bottom):
 *   - dim veil   `linear-gradient(rgba(0,0,0,dim/100), ...)`  readability
 *   - tint veil  photo-tinted light/dark gradient (accent-driven)
 *   - the photo  `url(<served image>)`, size cover/contain
 *
 * Blur is a fixed `z-index:-1` element with backdrop-filter, blurring the
 * body backdrop without touching the UI above it. Two blur modes:
 *   - 'global' — one blur value for both conversation states;
 *   - 'split'  — separate blurEmpty (no messages) / blurContent (messages),
 *     switched live by a MutationObserver on the shell's stable message-row
 *     class suffixes (hash prefix varies, suffix is stable).
 *
 * Priority: when the body background is written by another skin, this
 * controller re-asserts its own backdrop via a MutationObserver on the body's
 * inline `style` and `data-ds-dark-theme` (guarded against loops by comparing
 * the last value it wrote). Because it re-applies on every competing write,
 * the photo skin wins over the active skin's backdrop.
 *
 * Accent extraction: while autoAccent is on, the applied photo is downscaled
 * onto a canvas and sampled (accent.ts); the palette is written as CSS custom
 * properties on document.body and a `data-dsh-photo-skin` attribute scopes the
 * card's accent usage. All writes are retracted on clear/dispose.
 * @module dsh-photo-skins/photo-skin
 */

import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-runtime/client'
import { samplePalette, type AccentPalette, type SampledPixels } from './accent.ts'

/** The namespace string the Host registers (mirrors src/index.ts). */
export const PHOTO_SKINS_NS = 'photo-skins'

/** One photo's render contract, as delivered by the /list route. */
export interface PhotoSkinDescriptor {
  id: string
  name: string
  type: 'png' | 'jpeg' | 'webp' | 'gif'
  mime: string
  bytes: number
  importedAt: number
  url: string
}

/** The persisted photo-skins section shape. */
interface PhotoSkinsSection {
  enabled?: boolean
  selection?: string
  fit?: 'cover' | 'contain'
  blurMode?: 'global' | 'split'
  blur?: number
  blurEmpty?: number
  blurContent?: number
  dim?: number
  autoAccent?: boolean
}

/** The face the photo-skins card injects for the panel. */
export interface PhotoSkinHandle {
  enabled(): boolean
  selection(): string
  fit(): 'cover' | 'contain'
  blurMode(): 'global' | 'split'
  /** Global blur (used when blurMode is 'global'). */
  blur(): number
  /** Split blur: no-conversation state. */
  blurEmpty(): number
  /** Split blur: conversation-with-content state. */
  blurContent(): number
  dim(): number
  autoAccent(): boolean
  /** The currently painted photo id (try-on included), or null. */
  activeId(): string | null
  /** True while a try-on preview is up. */
  trying(): boolean
  subscribe(listener: () => void): () => void
  setEnabled(value: boolean): void
  setFit(value: 'cover' | 'contain'): void
  setBlurMode(value: 'global' | 'split'): void
  setBlur(value: number): void
  setBlurEmpty(value: number): void
  setBlurContent(value: number): void
  setDim(value: number): void
  setAutoAccent(value: boolean): void
  /** Persist + render a selection. */
  applySelection(descriptor: PhotoSkinDescriptor): void
  /** Unmount + clear the persisted selection. */
  clearSelection(): void
  /**
   * Reconcile the painted backdrop with the persisted selection: the card
   * resolves the selection id against the inventory and calls this with the
   * descriptor (or null when the photo is gone / none selected).
   */
  sync(descriptor: PhotoSkinDescriptor | null): void
  /** Paint a temporary preview (the applied selection is kept, not lost). */
  tryOn(descriptor: PhotoSkinDescriptor): void
  /** Drop the try-on preview and restore the applied selection, if any. */
  exitTryOn(): void
  dispose(): void
}

/** CSS custom properties written to document.body while a palette is active. */
const ACCENT_VARS = ['--dsw-photo-accent', '--dsw-photo-accent-soft', '--dsw-photo-accent-contrast'] as const

/** Body background properties the controller saves and restores verbatim. */
const BACKDROP_PROPERTIES = [
  'background-image',
  'background-position',
  'background-size',
  'background-attachment',
  'background-repeat',
] as const

/**
 * Selector for a conversation message row inside the shell's center column.
 * The `data-pane="conversation"` attribute is stamped on the center column;
 * the `_userRow` / `_compactionRow` / `_contextRow` / `_turnErrorRow` suffixes
 * are the shell's CSS-module message-row classes (hash prefix varies, suffix
 * is stable).
 */
const CONVERSATION_CONTENT_SELECTOR = [
  '[data-pane="conversation"] [class*="_userRow"]',
  '[data-pane="conversation"] [class*="_compactionRow"]',
  '[data-pane="conversation"] [class*="_contextRow"]',
  '[data-pane="conversation"] [class*="_turnErrorRow"]',
].join(', ')

/** Mark/unmark the body with the photo-skin attribute (idempotent). */
function setBodyMarked(body: HTMLElement, on: boolean): void {
  if (on) {
    body.dataset.dshPhotoSkin = ''
  } else {
    delete body.dataset.dshPhotoSkin
  }
}

/** Max accent-sampling canvas edge: the palette never needs more pixels. */
const SAMPLE_MAX_EDGE = 64

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.round(value)))

/** Neutral (accent-less) light/dark veils — a whisper, not a wash: the dim
 *  slider and translucent panels do the readability work. */
const NEUTRAL_SCIM = {
  dark: 'rgba(4, 8, 16, 0.32)',
  light: 'rgba(250, 250, 252, 0.08)',
} as const

/**
 * Own the photo-skins scope: keep the painted body backdrop in sync with the
 * persisted selection and the card-driven descriptor resolution.
 */
export class PhotoSkinController implements PhotoSkinHandle {
  private enabledValue = true
  private selectionValue = ''
  private fitValue: 'cover' | 'contain' = 'cover'
  private blurModeValue: 'global' | 'split' = 'global'
  private blurValue = 0
  private blurEmptyValue = 0
  private blurContentValue = 0
  private dimValue = 25
  private autoAccentValue = true
  private readonly listeners = new Set<() => void>()
  private readonly scope: SettingsScope<PhotoSkinsSection>

  /** The descriptor of the applied selection, resolved by the card. */
  private applied: PhotoSkinDescriptor | null = null
  /** The try-on descriptor while a preview is up. */
  private previewing: PhotoSkinDescriptor | null = null
  /** The active accent palette (null while none is applied). */
  private palette: AccentPalette | null = null
  /** The photo id the current palette was derived from. */
  private palettePhotoId: string | null = null

  /** Saved original body backdrop properties (restored on clear/dispose). */
  private readonly previous = new Map<string, string>()
  /** The background-image string last written by this controller (loop guard). */
  private lastImage = ''
  /** The fixed backdrop-filter blur element, present only while blur > 0. */
  private blurElement: HTMLDivElement | null = null
  private observer: MutationObserver | null = null
  /** Lazy conversation-content observer for the split blur mode. */
  private conversationObserver: MutationObserver | null = null
  /** Pending rAF id for a coalesced conversation recheck. */
  private conversationRafId: number | null = null
  private disposed = false

  constructor(scope: SettingsScope<PhotoSkinsSection>) {
    this.scope = scope
    this.readAll()
    scope.subscribe(() => {
      this.readAll()
      this.render()
      this.publish()
    })
    // Re-assert the backdrop whenever the body inline style or theme flips:
    // the active skin re-paints its own backdrop on `data-ds-dark-theme`
    // changes, so this observer (registered after the skin's) re-applies the
    // photo on top. The loop guard compares against lastImage.
    this.observer = new MutationObserver(() => this.reassertIfNeeded())
    this.observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-ds-dark-theme'] })
  }

  enabled(): boolean { return this.enabledValue }
  selection(): string { return this.selectionValue }
  fit(): 'cover' | 'contain' { return this.fitValue }
  blurMode(): 'global' | 'split' { return this.blurModeValue }
  blur(): number { return this.blurValue }
  blurEmpty(): number { return this.blurEmptyValue }
  blurContent(): number { return this.blurContentValue }
  dim(): number { return this.dimValue }
  autoAccent(): boolean { return this.autoAccentValue }

  activeId(): string | null {
    const current = this.previewing ?? this.applied
    return current !== null && this.lastImage !== '' ? current.id : null
  }

  trying(): boolean { return this.previewing !== null }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  setEnabled(value: boolean): void {
    this.enabledValue = value
    this.render()
    this.publish()
    void this.scope.set('enabled', value)
  }

  setFit(value: 'cover' | 'contain'): void {
    this.fitValue = value
    this.render()
    this.publish()
    void this.scope.set('fit', value)
  }

  setBlurMode(value: 'global' | 'split'): void {
    this.blurModeValue = value
    this.render()
    this.publish()
    void this.scope.set('blurMode', value)
  }

  setBlur(value: number): void {
    this.blurValue = clamp(value, 0, 100)
    this.render()
    this.publish()
    void this.scope.set('blur', this.blurValue)
  }

  setBlurEmpty(value: number): void {
    this.blurEmptyValue = clamp(value, 0, 100)
    this.render()
    this.publish()
    void this.scope.set('blurEmpty', this.blurEmptyValue)
  }

  setBlurContent(value: number): void {
    this.blurContentValue = clamp(value, 0, 100)
    this.render()
    this.publish()
    void this.scope.set('blurContent', this.blurContentValue)
  }

  setDim(value: number): void {
    this.dimValue = clamp(value, 0, 100)
    this.render()
    this.publish()
    void this.scope.set('dim', this.dimValue)
  }

  setAutoAccent(value: boolean): void {
    this.autoAccentValue = value
    this.render()
    this.publish()
    void this.scope.set('autoAccent', value)
  }

  applySelection(descriptor: PhotoSkinDescriptor): void {
    this.applied = descriptor
    this.previewing = null
    this.selectionValue = descriptor.id
    this.render()
    this.publish()
    void this.scope.set('selection', descriptor.id)
  }

  clearSelection(): void {
    this.applied = null
    this.previewing = null
    this.selectionValue = ''
    this.render()
    this.publish()
    void this.scope.set('selection', '')
  }

  sync(descriptor: PhotoSkinDescriptor | null): void {
    this.applied = descriptor
    this.render()
  }

  tryOn(descriptor: PhotoSkinDescriptor): void {
    this.previewing = descriptor
    this.render()
    this.publish()
  }

  exitTryOn(): void {
    if (this.previewing === null) return
    this.previewing = null
    this.render()
    this.publish()
  }

  dispose(): void {
    this.disposed = true
    this.observer?.disconnect()
    this.observer = null
    this.disconnectConversationObserver()
    this.clearBackdrop()
  }

  // --- internals -----------------------------------------------------------

  private readAll(): void {
    const snapshot: SettingsScopeSnapshot<PhotoSkinsSection> = this.scope.getSnapshot()
    const value = snapshot.value ?? {}
    this.enabledValue = typeof value.enabled === 'boolean' ? value.enabled : true
    this.selectionValue = typeof value.selection === 'string' ? value.selection : ''
    this.fitValue = value.fit === 'contain' ? 'contain' : 'cover'
    this.blurModeValue = value.blurMode === 'split' ? 'split' : 'global'
    this.blurValue = typeof value.blur === 'number' && Number.isFinite(value.blur) ? clamp(value.blur, 0, 100) : 0
    this.blurEmptyValue = typeof value.blurEmpty === 'number' && Number.isFinite(value.blurEmpty) ? clamp(value.blurEmpty, 0, 100) : 0
    this.blurContentValue = typeof value.blurContent === 'number' && Number.isFinite(value.blurContent) ? clamp(value.blurContent, 0, 100) : 0
    this.dimValue = typeof value.dim === 'number' && Number.isFinite(value.dim) ? clamp(value.dim, 0, 100) : 25
    this.autoAccentValue = typeof value.autoAccent === 'boolean' ? value.autoAccent : true
  }

  /** Reconcile the painted backdrop with (enabled, previewing ?? applied). */
  private render(): void {
    if (this.disposed) return
    const current = this.enabledValue ? (this.previewing ?? this.applied) : null
    if (current === null) {
      this.clearBackdrop()
      return
    }
    this.paintBackdrop(current)
  }

  /** The descriptor currently being painted (preview wins over applied). */
  private activeDescriptor(): PhotoSkinDescriptor | null {
    return this.enabledValue ? (this.previewing ?? this.applied) : null
  }

  /** Re-apply the backdrop if a competing write changed the body background. */
  private reassertIfNeeded(): void {
    if (this.disposed) return
    if (this.activeDescriptor() === null) return
    if (document.body.style.getPropertyValue('background-image') === this.lastImage) return
    this.paintBackdrop(this.activeDescriptor()!)
  }

  private paintBackdrop(descriptor: PhotoSkinDescriptor): void {
    const body = document.body
    // Save the original backdrop once, so dispose/clear can restore verbatim.
    if (this.previous.size === 0) {
      for (const prop of BACKDROP_PROPERTIES) {
        this.previous.set(prop, body.style.getPropertyValue(prop))
      }
    }
    const dark = body.dataset.dsDarkTheme !== undefined
    const tint = this.palette !== null
      ? (dark ? this.palette.scrimDark : this.palette.scrimLight)
      : (dark ? NEUTRAL_SCIM.dark : NEUTRAL_SCIM.light)
    const dim = 'rgba(0, 0, 0, ' + String(this.dimValue / 100) + ')'
    const dimGradient = 'linear-gradient(' + dim + ', ' + dim + ')'
    const tintGradient = 'linear-gradient(' + tint + ', ' + tint + ')'
    const photoLayer = 'url("' + descriptor.url + '")'
    this.lastImage = dimGradient + ', ' + tintGradient + ', ' + photoLayer
    setBodyMarked(body, true) // photo skin active: panel translucency CSS keys on this
    body.style.setProperty('background-image', this.lastImage)
    body.style.setProperty('background-size', '100% 100%, 100% 100%, ' + (this.fitValue === 'contain' ? 'contain' : 'cover'))
    body.style.setProperty('background-position', 'center, center, center')
    body.style.setProperty('background-repeat', 'no-repeat')
    body.style.setProperty('background-attachment', 'fixed')
    this.syncBlur()
    if (this.autoAccentValue) {
      if (this.palette === null || this.palettePhotoId !== descriptor.id) this.scheduleAccent(descriptor)
    } else {
      this.clearAccent()
    }
  }

  private scheduleAccent(descriptor: PhotoSkinDescriptor): void {
    const image = new Image()
    const run = (): void => {
      if (this.disposed) return
      const current = this.activeDescriptor()
      if (current === null || current.id !== descriptor.id) return
      try {
        const scale = Math.min(1, SAMPLE_MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (context === null) return
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const data = context.getImageData(0, 0, canvas.width, canvas.height)
        this.palette = samplePalette({ data: data.data, width: data.width, height: data.height } as SampledPixels)
        this.palettePhotoId = descriptor.id
        this.applyPalette()
        this.paintBackdrop(descriptor)
        this.publish()
      } catch {
        // Sampling failed (tainted canvas / jsdom): no accent.
        this.clearAccent()
      }
    }
    if (image.complete && image.naturalWidth > 0) {
      run()
    } else {
      image.addEventListener('load', run, { once: true })
      image.addEventListener('error', () => { this.clearAccent() }, { once: true })
    }
    image.src = descriptor.url
  }

  private applyPalette(): void {
    if (this.palette === null) return
    const style = document.body.style
    style.setProperty('--dsw-photo-accent', this.palette.accent)
    style.setProperty('--dsw-photo-accent-soft', this.palette.accentSoft)
    style.setProperty('--dsw-photo-accent-contrast', this.palette.accentContrast)
  }

  private clearAccent(): void {
    this.palette = null
    this.palettePhotoId = null
    const style = document.body.style
    for (const name of ACCENT_VARS) style.removeProperty(name)
  }

  /** True when the conversation pane hosts at least one message row. */
  private hasConversationContent(): boolean {
    return document.querySelector(CONVERSATION_CONTENT_SELECTOR) !== null
  }

  /** The blur to paint right now, depending on mode and conversation state. */
  private effectiveBlur(): number {
    if (this.blurModeValue === 'split') {
      return this.hasConversationContent() ? this.blurContentValue : this.blurEmptyValue
    }
    return this.blurValue
  }

  /**
   * Create/update the fixed backdrop-filter blur element, or remove it. In
   * split mode it also wires (or tears down) the lazy conversation-content
   * observer so the empty/content blur flips live as messages appear.
   */
  private syncBlur(): void {
    const effective = this.activeDescriptor() !== null ? this.effectiveBlur() : 0
    if (effective <= 0) {
      if (this.blurElement !== null) {
        this.blurElement.remove()
        this.blurElement = null
      }
    } else {
      if (this.blurElement === null) {
        const element = document.createElement('div')
        element.style.position = 'fixed'
        element.style.inset = '0'
        element.style.zIndex = '-1'
        element.style.pointerEvents = 'none'
        element.setAttribute('aria-hidden', 'true')
        element.setAttribute('data-dsh-photo-blur', '')
        this.blurElement = element
        document.body.appendChild(element)
      }
      const blur = 'blur(' + effective + 'px)'
      this.blurElement.style.backdropFilter = blur
      this.blurElement.style.setProperty('-webkit-backdrop-filter', blur)
    }
    if (this.blurModeValue === 'split' && this.activeDescriptor() !== null) {
      this.ensureConversationObserver()
    } else {
      this.disconnectConversationObserver()
    }
  }

  /** Install the conversation-content observer lazily (split mode only). */
  private ensureConversationObserver(): void {
    if (this.disposed || this.conversationObserver !== null) return
    this.conversationObserver = new MutationObserver(() => this.scheduleConversationRecheck())
    this.conversationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    })
  }

  private disconnectConversationObserver(): void {
    if (this.conversationRafId !== null) {
      cancelAnimationFrame(this.conversationRafId)
      this.conversationRafId = null
    }
    this.conversationObserver?.disconnect()
    this.conversationObserver = null
  }

  /** Coalesce burst mutations into one rAF-delayed blur recheck. */
  private scheduleConversationRecheck(): void {
    if (this.disposed || this.conversationRafId !== null) return
    this.conversationRafId = requestAnimationFrame(() => {
      this.conversationRafId = null
      if (this.disposed) return
      this.syncBlur()
      this.publish()
    })
  }

  /** Remove the painted backdrop + blur and restore the original body style. */
  private clearBackdrop(): void {
    const body = document.body
    setBodyMarked(body, false)
    for (const prop of BACKDROP_PROPERTIES) {
      const saved = this.previous.get(prop)
      if (saved !== undefined && saved !== '') {
        body.style.setProperty(prop, saved)
      } else {
        body.style.removeProperty(prop)
      }
    }
    this.previous.clear()
    this.lastImage = ''
    if (this.blurElement !== null) {
      this.blurElement.remove()
      this.blurElement = null
    }
    this.disconnectConversationObserver()
    this.clearAccent()
  }

  private publish(): void {
    for (const listener of this.listeners) listener()
  }
}
