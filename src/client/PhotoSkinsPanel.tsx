/**
 * The photo-skins card: rendered as the content of a first-level settings
 * section, listing every imported photo with live try-on, one-click apply,
 * removal, and render tuning (fit / blur / dim / accent). Rendering and
 * persistence ride the PhotoSkinController (photo-skin.ts); the photo bytes
 * come from and go to the host's /api/photo-skins routes.
 *
 * Compliance: photos are the user's own files. The card only uploads them to
 * the local host store (<harnessHome>/photo-skins) and never shares content;
 * removal deletes the local copy.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import type { PhotoSkinDescriptor, PhotoSkinHandle } from './photo-skin.ts'
import css from './photo-skins.module.css'

/** Host base path of the photo-skins API (mirrors src/routes.ts). */
const PHOTO_API = '/api/photo-skins'

/** One photo entry as served by the /list route. */
type PhotoItem = PhotoSkinDescriptor

/** List payload shape. */
interface ListPayload {
  ok?: boolean
  photos?: PhotoItem[]
  error?: string
}

/** Import payload shape. */
interface ImportPayload {
  ok?: boolean
  photo?: PhotoItem
  error?: string
}

/** Post one photo removal and return whether it succeeded. */
async function postRemove(id: string): Promise<string | null> {
  try {
    const response = await fetch(PHOTO_API + '/remove', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const payload = await response.json().catch(() => null) as { ok?: boolean; error?: string } | null
    if (!response.ok || payload?.ok !== true) return payload?.error ?? 'HTTP ' + String(response.status)
    return null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/** Upload one file as a raw binary body; the name rides a dedicated header. */
async function postImport(file: File): Promise<{ error: string | null; photo: PhotoItem | null }> {
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    const response = await fetch(PHOTO_API + '/import', {
      method: 'POST',
      headers: {
        'content-type': file.type !== '' ? file.type : 'application/octet-stream',
        'x-photo-skin-name': encodeURIComponent(file.name),
      },
      body: bytes as unknown as BodyInit,
    })
    const payload = await response.json().catch(() => null) as ImportPayload | null
    if (!response.ok || payload?.ok !== true || payload?.photo === undefined) {
      return { error: payload?.error ?? 'HTTP ' + String(response.status), photo: null }
    }
    return { error: null, photo: payload.photo }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error), photo: null }
  }
}

/** Human-readable byte size. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return String(bytes) + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

/** Map a host error code to localized copy, falling back to the raw text. */
function errorText(t: PropsLocale<'photoSkins'>['t'], error: string): string {
  switch (error) {
    case 'photo-too-large': return t('errorTooLarge')
    case 'unsupported-image-type': return t('errorBadType')
    case 'empty-body': return t('errorBadType')
    default: return error
  }
}

/** Plugin-card component props: locale seat + injected face. */
export type PhotoSkinsComponentProps = PropsLocale<'photoSkins'> & { photoSkin: PhotoSkinHandle }

/** Render the photo-skins section of the settings surface. */
export function PhotoSkinsPanel({ t, photoSkin }: PhotoSkinsComponentProps): ReactNode {
  const enabled = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.enabled())
  const selection = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.selection())
  const fit = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.fit())
  const blurMode = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.blurMode())
  const blur = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.blur())
  const blurEmpty = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.blurEmpty())
  const blurContent = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.blurContent())
  const dim = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.dim())
  const autoAccent = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.autoAccent())
  const activeId = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.activeId())
  const trying = useSyncExternalStore((listener) => photoSkin.subscribe(listener), () => photoSkin.trying())

  const [items, setItems] = useState<PhotoItem[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  /** Fetch the list and reconcile the mounted layer with the selection. */
  const load = useCallback((): void => {
    void fetch(PHOTO_API + '/list')
      .then(async response => {
        const payload = await response.json().catch(() => null) as ListPayload | null
        if (!mounted.current) return
        if (!response.ok || payload?.ok !== true || !Array.isArray(payload.photos)) {
          setLoadError(payload?.error ?? 'HTTP ' + String(response.status))
          setItems([])
          return
        }
        setLoadError(null)
        setItems(payload.photos)
        const selected = photoSkin.selection()
        photoSkin.sync(payload.photos.find(w => w.id === selected) ?? null)
      })
      .catch((error: unknown) => {
        if (!mounted.current) return
        setLoadError(error instanceof Error ? error.message : String(error))
        setItems([])
      })
  }, [photoSkin])

  useEffect(load, [load])

  /** Import a set of files, sequentially, feeding errors to the error row. */
  const importFiles = useCallback((files: File[]): void => {
    const images = files.filter(file => file.type === '' || file.type.startsWith('image/') || file.type === 'application/octet-stream')
    if (images.length === 0) {
      setActionError(t('errorBadType'))
      return
    }
    setActionError(null)
    setImporting(true)
    void (async () => {
      let firstError: string | null = null
      for (const file of images) {
        if (!mounted.current) break
        const result = await postImport(file)
        if (!mounted.current) break
        if (result.error !== null) {
          firstError = firstError ?? errorText(t, result.error)
        }
      }
      if (!mounted.current) return
      setImporting(false)
      setActionError(firstError)
      load()
    })()
  }, [load, t])

  /** Paste handler: images pasted from the clipboard import directly. */
  useEffect(() => {
    const onPaste = (event: ClipboardEvent): void => {
      const files = Array.from(event.clipboardData?.files ?? [])
      if (files.length > 0) {
        event.preventDefault()
        importFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => { window.removeEventListener('paste', onPaste) }
  }, [importFiles])

  const runRemove = (id: string): void => {
    setActionError(null)
    setWorkingId(id)
    void postRemove(id).then(error => {
      if (!mounted.current) return
      setWorkingId(null)
      if (error !== null) {
        setActionError(error)
        return
      }
      if (photoSkin.selection() === id) photoSkin.clearSelection()
      load()
    })
  }

  const appliedId = selection
  const busy = importing || workingId !== null

  return (
    <div className={css.photoSection}>
      <div className={css.enableRow}>
        <span className={css.enableLabel} title={t('enable')}>{t('title')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t('enable')}
          className={enabled ? css.switch + ' ' + css.switchOn : css.switch}
          onClick={() => { photoSkin.setEnabled(!enabled) }}
        >
          <span className={css.switchThumb} />
        </button>
        <p className={css.enableHint}>{t('hint')}</p>
      </div>

      {enabled && (
        <>
          <div className={css.statusRow}>
            {loadError !== null
              ? <span className={css.statusError}>{t('loadError')}: {loadError}</span>
              : items === null
                ? <span>{t('loading')}</span>
                : <span>{items.length}</span>}
            <button type="button" className={css.button} onClick={load} disabled={busy}>{t('refresh')}</button>
          </div>

          {appliedId !== '' && (
            <div className={css.controls}>
              <div className={css.themeRow}>
                <span className={css.themeLabel}>{t('fit')}</span>
                <button
                  type="button"
                  className={css.themeButton + (fit === 'cover' ? ' ' + css.themeButtonActive : '')}
                  onClick={() => { photoSkin.setFit('cover') }}
                >
                  {t('fitCover')}
                </button>
                <button
                  type="button"
                  className={css.themeButton + (fit === 'contain' ? ' ' + css.themeButtonActive : '')}
                  onClick={() => { photoSkin.setFit('contain') }}
                >
                  {t('fitContain')}
                </button>
                <button
                  type="button"
                  className={css.button + ' ' + css.buttonGhost}
                  onClick={() => { photoSkin.clearSelection() }}
                >
                  {t('clear')}
                </button>
              </div>
              <div className={css.themeRow}>
                <span className={css.themeLabel}>{t('blurMode')}</span>
                <button
                  type="button"
                  className={css.themeButton + (blurMode === 'global' ? ' ' + css.themeButtonActive : '')}
                  onClick={() => { photoSkin.setBlurMode('global') }}
                >
                  {t('blurModeGlobal')}
                </button>
                <button
                  type="button"
                  className={css.themeButton + (blurMode === 'split' ? ' ' + css.themeButtonActive : '')}
                  onClick={() => { photoSkin.setBlurMode('split') }}
                >
                  {t('blurModeSplit')}
                </button>
              </div>
              <div className={css.backgroundRow}>
                {blurMode === 'global' ? (
                  <>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('blur')}</span>
                      <span className={css.backgroundValue} aria-hidden="true">{blur}px</span>
                    </div>
                    <input
                      className={css.backgroundRange}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={blur}
                      aria-label={t('blur')}
                      onChange={(event) => { photoSkin.setBlur(Number(event.target.value)) }}
                    />
                  </>
                ) : (
                  <>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('blurEmpty')}</span>
                      <span className={css.backgroundValue} aria-hidden="true">{blurEmpty}px</span>
                    </div>
                    <input
                      className={css.backgroundRange}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={blurEmpty}
                      aria-label={t('blurEmpty')}
                      onChange={(event) => { photoSkin.setBlurEmpty(Number(event.target.value)) }}
                    />
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('blurContent')}</span>
                      <span className={css.backgroundValue} aria-hidden="true">{blurContent}px</span>
                    </div>
                    <input
                      className={css.backgroundRange}
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={blurContent}
                      aria-label={t('blurContent')}
                      onChange={(event) => { photoSkin.setBlurContent(Number(event.target.value)) }}
                    />
                  </>
                )}
                <div className={css.backgroundHead}>
                  <span className={css.backgroundLabel}>{t('dim')}</span>
                  <span className={css.backgroundValue} aria-hidden="true">{dim}%</span>
                </div>
                <input
                  className={css.backgroundRange}
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={dim}
                  aria-label={t('dim')}
                  onChange={(event) => { photoSkin.setDim(Number(event.target.value)) }}
                />
              </div>
              <div className={css.enableRow}>
                <span className={css.enableLabel} title={t('autoAccentHint')}>{t('autoAccent')}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAccent}
                  aria-label={t('autoAccent')}
                  className={autoAccent ? css.switch + ' ' + css.switchOn : css.switch}
                  onClick={() => { photoSkin.setAutoAccent(!autoAccent) }}
                >
                  <span className={css.switchThumb} />
                </button>
                <p className={css.enableHint}>{t('autoAccentHint')}</p>
              </div>
            </div>
          )}

          <div
            className={dragOver ? css.dropZone + ' ' + css.dropZoneOver : css.dropZone}
            onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
            onDragLeave={() => { setDragOver(false) }}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              importFiles(Array.from(event.dataTransfer.files))
            }}
          >
            <input
              ref={fileInput}
              className={css.fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? [])
                if (event.target) event.target.value = ''
                importFiles(files)
              }}
            />
            <button
              type="button"
              className={css.button + ' ' + css.buttonPrimary}
              disabled={busy}
              onClick={() => { fileInput.current?.click() }}
            >
              {importing ? t('loading') : t('import')}
            </button>
            <span className={css.dropHint}>{dragOver ? t('dropHint') : t('importHint')}</span>
          </div>

          {actionError !== null && <div className={css.error}>{actionError}</div>}

          {items !== null && items.length > 0 && (
            <div className={css.photoGrid}>
              {items.map(item => {
                const isApplied = item.id === appliedId
                const isMounted = item.id === activeId
                const busyId = workingId === item.id
                return (
                  <div className={css.photoCard} key={item.id}>
                    <div className={css.photoThumbWrap}>
                      {item.url !== null
                        ? <img className={css.photoThumb} src={item.url} alt="" loading="lazy" />
                        : <div className={css.photoThumbEmpty} aria-hidden="true" />}
                      {isMounted && (
                        <span className={css.badge + ' ' + (trying ? css.badgeTrying : css.badgeActive)}>
                          {trying ? t('tryOn') : t('active')}
                        </span>
                      )}
                    </div>
                    <div className={css.photoName} title={item.name}>{item.name}</div>
                    <div className={css.photoMeta}>{formatBytes(item.bytes)}</div>
                    <div className={css.photoActions}>
                      {isMounted && trying ? (
                        <button type="button" className={css.button + ' ' + css.buttonPrimary} onClick={() => { photoSkin.exitTryOn() }}>
                          {t('exitTryOn')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={css.button + ' ' + css.buttonPrimary}
                          disabled={isApplied || busy}
                          onClick={() => { photoSkin.tryOn(item) }}
                        >
                          {t('tryOn')}
                        </button>
                      )}
                      <button
                        type="button"
                        className={css.button}
                        disabled={isApplied || busy}
                        onClick={() => { photoSkin.applySelection(item) }}
                      >
                        {isApplied ? t('active') : t('apply')}
                      </button>
                      <button
                        type="button"
                        className={css.button + ' ' + css.buttonGhost}
                        disabled={busy}
                        onClick={() => { runRemove(item.id) }}
                      >
                        {busyId ? t('loading') : t('remove')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {items !== null && items.length === 0 && loadError === null && (
            <p className={css.hintMuted}>{t('empty')}</p>
          )}
          <p className={css.hintMuted}>{t('legal')}</p>
        </>
      )}
    </div>
  )
}
