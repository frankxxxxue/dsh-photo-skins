import { describe, expect, it } from 'vitest'
import {
  averageColor,
  contrastTextFor,
  dominantColor,
  luminance,
  mix,
  rgbToHex,
  samplePalette,
  type SampledPixels,
} from '../src/client/accent.ts'

/** Build a pixel sample filled with one RGBA color. */
function solid(r: number, g: number, b: number, width = 4, height = 4, alpha = 255): SampledPixels {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = r
    data[i * 4 + 1] = g
    data[i * 4 + 2] = b
    data[i * 4 + 3] = alpha
  }
  return { data, width, height }
}

describe('accent helpers', () => {
  it('rgbToHex formats with padding', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000')
    expect(rgbToHex({ r: 46, g: 155, b: 255 })).toBe('#2e9bff')
  })

  it('luminance ranks dark below light', () => {
    expect(luminance({ r: 0, g: 0, b: 0 })).toBeLessThan(luminance({ r: 255, g: 255, b: 255 }))
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5)
  })

  it('mix blends toward the target', () => {
    expect(mix({ r: 0, g: 0, b: 0 }, { r: 100, g: 100, b: 100 }, 0.5)).toEqual({ r: 50, g: 50, b: 50 })
    expect(mix({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }, 2)).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('contrastTextFor picks white on dark, near-black on light', () => {
    expect(contrastTextFor({ r: 0, g: 0, b: 0 })).toBe('#ffffff')
    expect(contrastTextFor({ r: 255, g: 255, b: 255 })).toBe('#101828')
  })
})

describe('dominantColor / averageColor', () => {
  it('returns the dominant color over a two-tone sample', () => {
    const data = new Uint8ClampedArray(8 * 4 * 4)
    for (let i = 0; i < 8; i += 1) {
      const base = i * 4
      const blue = i < 6 // 6 blue pixels, 2 red pixels
      data[base] = blue ? 20 : 220
      data[base + 1] = blue ? 40 : 30
      data[base + 2] = blue ? 200 : 30
      data[base + 3] = 255
    }
    const dominant = dominantColor({ data, width: 8, height: 1 })
    expect(dominant.r).toBeLessThan(100)
    expect(dominant.b).toBeGreaterThan(100)
  })

  it('skips transparent pixels', () => {
    const transparent = solid(255, 0, 0, 4, 4, 0)
    expect(dominantColor(transparent)).toEqual({ r: 24, g: 24, b: 32 })
    expect(averageColor(transparent)).toEqual({ r: 24, g: 24, b: 32 })
  })

  it('averages a solid sample exactly', () => {
    const pixels = solid(10, 20, 30)
    const average = averageColor(pixels)
    expect(Math.round(average.r)).toBe(10)
    expect(Math.round(average.g)).toBe(20)
    expect(Math.round(average.b)).toBe(30)
  })
})

describe('samplePalette', () => {
  it('derives a full palette for a photo sample', () => {
    const palette = samplePalette(solid(46, 155, 255, 16, 16))
    expect(palette.accent).toMatch(/^#[0-9a-f]{6}$/)
    expect(palette.accentSoft).toMatch(/^rgba\(/)
    // YIQ luminance of this medium blue is above the 0.5 threshold, so the
    // formula picks near-black text (the better contrast on #2e9bff).
    expect(palette.accentContrast).toBe('#101828')
    expect(palette.scrimDark).toMatch(/^rgba\(/)
    expect(palette.scrimLight).toMatch(/^rgba\(/)
  })

  it('picks near-black text on a pale photo', () => {
    const palette = samplePalette(solid(245, 240, 230, 16, 16))
    expect(palette.accentContrast).toBe('#101828')
  })
})
