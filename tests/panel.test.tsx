// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react-dom/test-utils'
import { createRoot, type Root } from 'react-dom/client'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import { PhotoSkinsPanel } from '../src/client/PhotoSkinsPanel.tsx'
import { zh, type PhotoSkinsKey } from '../src/client/locales.ts'
import type { PhotoSkinDescriptor, PhotoSkinHandle } from '../src/client/photo-skin.ts'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Minimal handle stub for the smoke mount. */
class StubHandle implements PhotoSkinHandle {
  private readonly listeners = new Set<() => void>()
  private selectionValue = ''
  enabled(): boolean { return true }
  selection(): string { return this.selectionValue }
  fit(): 'cover' | 'contain' { return 'cover' }
  blurMode(): 'global' | 'split' { return 'global' }
  blur(): number { return 0 }
  blurEmpty(): number { return 0 }
  blurContent(): number { return 0 }
  dim(): number { return 25 }
  autoAccent(): boolean { return true }
  activeId(): string | null { return null }
  trying(): boolean { return false }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }
  setEnabled(): void {}
  setFit(): void {}
  setBlurMode(): void {}
  setBlur(): void {}
  setBlurEmpty(): void {}
  setBlurContent(): void {}
  setDim(): void {}
  setAutoAccent(): void {}
  applySelection(_descriptor: PhotoSkinDescriptor): void {}
  clearSelection(): void {}
  sync(_descriptor: PhotoSkinDescriptor | null): void {}
  tryOn(_descriptor: PhotoSkinDescriptor): void {}
  exitTryOn(): void {}
  dispose(): void {}
}

const t = ((key: PhotoSkinsKey) => zh[key]) as unknown as PropsLocale<'photoSkins'>['t']

let root: Root | null = null
let container: HTMLDivElement | null = null

afterEach(() => {
  if (root !== null) {
    act(() => { root!.unmount() })
    root = null
  }
  container?.remove()
  container = null
  vi.restoreAllMocks()
})

describe('PhotoSkinsPanel smoke', () => {
  it('mounts with the empty state after a successful list fetch', async () => {
    const list = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, photos: [] }),
    })
    globalThis.fetch = list as unknown as typeof fetch

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(<PhotoSkinsPanel t={t} photoSkin={new StubHandle()} />)
    })

    expect(list).toHaveBeenCalledWith('/api/photo-skins/list')
    expect(container.textContent).toContain(zh.empty)
    expect(container.querySelector('input[type=file]')).not.toBeNull()
    expect(container.textContent).toContain(zh.import)
  })

  it('shows a load error when the list request fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => {
      root!.render(<PhotoSkinsPanel t={t} photoSkin={new StubHandle()} />)
    })

    expect(container.textContent).toContain(zh.loadError)
  })
})
