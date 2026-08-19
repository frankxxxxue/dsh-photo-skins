// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import { PhotoSkinController, type PhotoSkinDescriptor } from '../src/client/photo-skin.ts'

/** Minimal in-memory settings scope with the surface the controller uses. */
class FakeScope<T> {
  value: T
  private readonly listeners = new Set<() => void>()
  constructor(initial: T) {
    this.value = initial
  }
  getSnapshot(): { value: T } {
    return { value: { ...this.value } }
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  set<K extends keyof T>(_key: K, value: T[K]): Promise<void> {
    this.value[_key] = value
    for (const listener of this.listeners) listener()
    return Promise.resolve()
  }
}

const photo = (id: string): PhotoSkinDescriptor => ({
  id,
  name: id + '.jpg',
  type: 'jpeg',
  mime: 'image/jpeg',
  bytes: 1234,
  importedAt: 1700000000000,
  url: '/api/photo-skins/image/' + id,
})

type Section = {
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

const controller = (): { scope: FakeScope<Section>; ctrl: PhotoSkinController } => {
  const scope = new FakeScope<Section>({})
  return { scope, ctrl: new PhotoSkinController(scope as unknown as SettingsScope<Section>) }
}

afterEach(() => {
  document.body.replaceChildren()
  document.body.removeAttribute('style')
  delete document.body.dataset.dshPhotoSkin
  delete document.body.dataset.dsDarkTheme
})

describe('PhotoSkinController', () => {
  it('applySelection paints the body background and persists the id', () => {
    const { scope, ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    const bg = document.body.style.getPropertyValue('background-image')
    expect(bg).toContain('url("/api/photo-skins/image/p-one")')
    expect(bg).toContain('linear-gradient') // dim + tint veils above the photo
    expect(document.body.style.getPropertyValue('background-size')).toContain('cover')
    expect(ctrl.selection()).toBe('p-one')
    expect(ctrl.activeId()).toBe('p-one')
    expect(scope.value.selection).toBe('p-one')
    ctrl.dispose()
  })

  it('tryOn previews without touching the applied selection', () => {
    const { ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.tryOn(photo('p-two'))
    expect(ctrl.activeId()).toBe('p-two')
    expect(ctrl.trying()).toBe(true)
    expect(ctrl.selection()).toBe('p-one')
    expect(document.body.style.getPropertyValue('background-image')).toContain('p-two')
    ctrl.exitTryOn()
    expect(ctrl.activeId()).toBe('p-one')
    expect(ctrl.trying()).toBe(false)
    expect(document.body.style.getPropertyValue('background-image')).toContain('p-one')
    ctrl.dispose()
  })

  it('clearSelection removes the backdrop and clears the persisted id', () => {
    const { scope, ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.clearSelection()
    expect(ctrl.selection()).toBe('')
    expect(ctrl.activeId()).toBeNull()
    expect(document.body.style.getPropertyValue('background-image')).toBe('')
    expect(scope.value.selection).toBe('')
    ctrl.dispose()
  })

  it('sync(null) drops a vanished applied photo', () => {
    const { ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.sync(null)
    expect(ctrl.activeId()).toBeNull()
    expect(document.body.style.getPropertyValue('background-image')).toBe('')
    ctrl.dispose()
  })

  it('fit / blur / dim setters clamp and persist, blur creates a backdrop-filter layer', () => {
    const { scope, ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.setFit('contain')
    ctrl.setBlur(150)
    ctrl.setDim(120)
    expect(ctrl.fit()).toBe('contain')
    expect(ctrl.blur()).toBe(100)
    expect(ctrl.dim()).toBe(100)
    expect(scope.value.fit).toBe('contain')
    expect(scope.value.blur).toBe(100)
    expect(scope.value.dim).toBe(100)
    expect(document.body.style.getPropertyValue('background-size')).toContain('contain')
    const blur = document.body.querySelector('[data-dsh-photo-blur]') as HTMLElement | null
    expect(blur).not.toBeNull()
    expect(blur?.style.backdropFilter).toContain('blur(100px)')
    ctrl.setBlur(0)
    expect(document.body.querySelector('[data-dsh-photo-blur]')).toBeNull()
    ctrl.dispose()
  })

  it('split blur mode applies empty/content values and flips live with content', async () => {
    const { scope, ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.setBlurMode('split')
    ctrl.setBlurEmpty(30)
    ctrl.setBlurContent(70)
    expect(ctrl.blurMode()).toBe('split')
    expect(scope.value.blurMode).toBe('split')
    expect(scope.value.blurEmpty).toBe(30)
    expect(scope.value.blurContent).toBe(70)

    // Empty state (no conversation content): empty blur applies.
    const blur = () => document.body.querySelector('[data-dsh-photo-blur]') as HTMLElement | null
    expect(blur()?.style.backdropFilter).toContain('blur(30px)')

    // Add a conversation message row; the observer flips to the content blur.
    const pane = document.createElement('div')
    pane.setAttribute('data-pane', 'conversation')
    const row = document.createElement('div')
    row.className = 'x9_userRow'
    pane.appendChild(row)
    document.body.appendChild(pane)
    await new Promise((r) => setTimeout(r, 50))
    expect(blur()?.style.backdropFilter).toContain('blur(70px)')

    // Remove it; back to the empty blur.
    pane.remove()
    await new Promise((r) => setTimeout(r, 50))
    expect(blur()?.style.backdropFilter).toContain('blur(30px)')
    ctrl.dispose()
  })

  it('reads the persisted section on construction and renders it via sync', () => {
    const scope = new FakeScope<Section>({ selection: 'p-one', blur: 10, dim: 40, fit: 'contain' })
    const ctrl = new PhotoSkinController(scope as unknown as SettingsScope<Section>)
    expect(ctrl.selection()).toBe('p-one')
    expect(ctrl.blur()).toBe(10)
    expect(ctrl.dim()).toBe(40)
    expect(ctrl.fit()).toBe('contain')
    ctrl.sync(photo('p-one'))
    expect(ctrl.activeId()).toBe('p-one')
    ctrl.dispose()
  })

  it('re-asserts the backdrop when another skin overwrites the body background', () => {
    const { ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    // Simulate the active skin re-painting its own backdrop (theme flip).
    document.body.style.setProperty('background-image', 'url("/plugins/skin-art.png")')
    // The observer re-applies ours asynchronously; flush via a timeout.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(document.body.style.getPropertyValue('background-image')).toContain('p-one')
        ctrl.dispose()
        resolve()
      }, 0)
    })
  })

  it('dispose restores the original body backdrop and removes everything it wrote', () => {
    document.body.style.setProperty('background-image', 'url("/original.png")')
    const { ctrl } = controller()
    ctrl.applySelection(photo('p-one'))
    ctrl.setBlur(5)
    ctrl.dispose()
    expect(document.body.style.getPropertyValue('background-image')).toBe('url("/original.png")')
    expect(document.body.querySelector('[data-dsh-photo-blur]')).toBeNull()
    expect(document.body.dataset.dshPhotoSkin).toBeUndefined()
    expect(document.body.style.getPropertyValue('--dsw-photo-accent')).toBe('')
  })
})
