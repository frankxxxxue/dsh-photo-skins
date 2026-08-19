/**
 * Accent extraction for photo skins — pure functions over pixel data so the
 * sampling logic is testable without a canvas. The browser half downscales
 * the applied photo onto a small canvas and hands the ImageData here; the
 * result is a palette of CSS values: the dominant color as the accent, a
 * soft translucent accent for chips, a contrast text color, and light/dark
 * scrim tints so the readability veils pick up the photo's own tone.
 * @module dsh-photo-skins/accent
 */

/** One RGBA pixel sample set. */
export interface SampledPixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** The derived palette (all values ready for CSS). */
export interface AccentPalette {
  /** Dominant color, hex like `#2e9bff`. */
  accent: string
  /** Translucent accent for chips/highlights, rgba. */
  accentSoft: string
  /** Text color readable on the accent, `#ffffff` or `#101828`. */
  accentContrast: string
  /** Photo-tinted dark veil (for the dark-theme scrim). */
  scrimDark: string
  /** Photo-tinted light veil (for the light-theme scrim). */
  scrimLight: string
}

/** One RGB color. */
export interface Rgb {
  r: number
  g: number
  b: number
}

const hex2 = (value: number): string => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')

/** `#rrggbb` from an RGB color. */
export function rgbToHex(rgb: Rgb): string {
  return '#' + hex2(rgb.r) + hex2(rgb.g) + hex2(rgb.b)
}

/** Relative luminance (0-1), Rec. 601 weights. */
export function luminance(rgb: Rgb): number {
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
}

/** Mix two RGB colors (t 0-1: 0 = a, 1 = b). */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  const clamped = Math.max(0, Math.min(1, t))
  return {
    r: a.r + (b.r - a.r) * clamped,
    g: a.g + (b.g - a.g) * clamped,
    b: a.b + (b.b - a.b) * clamped,
  }
}

/** The dominant RGB color from a pixel sample (bucket histogram + average). */
export function dominantColor(pixels: SampledPixels): Rgb {
  const { data, width, height } = pixels
  const buckets = new Map<number, { count: number; r: number; g: number; b: number }>()
  const step = Math.max(1, Math.floor((width * height) / 4096))
  for (let i = 0; i < data.length; i += 4 * step) {
    const alpha = data[i + 3] ?? 255
    if (alpha < 128) continue // skip transparent pixels
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0
    // 4-bit buckets: nearby shades merge before the count comparison.
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    const bucket = buckets.get(key)
    if (bucket === undefined) {
      buckets.set(key, { count: 1, r, g, b })
    } else {
      bucket.count += 1
      bucket.r += r
      bucket.g += g
      bucket.b += b
    }
  }
  let best: { count: number; r: number; g: number; b: number } | null = null
  for (const bucket of buckets.values()) {
    if (best === null || bucket.count > best.count) best = bucket
  }
  if (best === null) return { r: 24, g: 24, b: 32 }
  return {
    r: best.r / best.count,
    g: best.g / best.count,
    b: best.b / best.count,
  }
}

/** Average (luminance-weighted) RGB over the sample. */
export function averageColor(pixels: SampledPixels): Rgb {
  const { data, width, height } = pixels
  const step = Math.max(1, Math.floor((width * height) / 4096))
  let count = 0
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < data.length; i += 4 * step) {
    if ((data[i + 3] ?? 255) < 128) continue
    r += data[i] ?? 0
    g += data[i + 1] ?? 0
    b += data[i + 2] ?? 0
    count += 1
  }
  if (count === 0) return { r: 24, g: 24, b: 32 }
  return { r: r / count, g: g / count, b: b / count }
}

/** Readable text color on a given background: white on dark, near-black on light. */
export function contrastTextFor(rgb: Rgb): string {
  return luminance(rgb) > 0.5 ? '#101828' : '#ffffff'
}

/**
 * Derive the full accent palette from a pixel sample. The accent is the
 * dominant color nudged toward the sample average (a third of the way) so a
 * tiny saturated detail cannot hijack the whole palette; the scrims mix the
 * accent with black (dark theme) and white (light theme).
 * @param pixels - the downscaled photo sample.
 * @returns the palette.
 */
export function samplePalette(pixels: SampledPixels): AccentPalette {
  const dominant = dominantColor(pixels)
  const average = averageColor(pixels)
  const accent = mix(dominant, average, 1 / 3)
  // Keep the tint veils light so the photo stays visible at dim 0: the veils
  // only add a whisper of the photo's tone, the readability comes from the
  // dim slider and the translucent panels.
  const scrimDark = mix(accent, { r: 0, g: 0, b: 0 }, 0.82)
  const scrimLight = mix(accent, { r: 255, g: 255, b: 255 }, 0.9)
  return {
    accent: rgbToHex(accent),
    accentSoft: 'rgba(' + Math.round(accent.r) + ', ' + Math.round(accent.g) + ', ' + Math.round(accent.b) + ', 0.18)',
    accentContrast: contrastTextFor(accent),
    scrimDark: 'rgba(' + Math.round(scrimDark.r) + ', ' + Math.round(scrimDark.g) + ', ' + Math.round(scrimDark.b) + ', 0.34)',
    scrimLight: 'rgba(' + Math.round(scrimLight.r) + ', ' + Math.round(scrimLight.g) + ', ' + Math.round(scrimLight.b) + ', 0.10)',
  }
}
