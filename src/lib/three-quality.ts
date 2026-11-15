/**
 * Tiga tingkat kualitas 3D (PRD v2): Tinggi, Sedang, Hemat.
 * Dipilih otomatis dari kemampuan perangkat, dan turun satu tingkat
 * bila fps terukur terus di bawah ambang batas.
 */
export type Tier = 'high' | 'medium' | 'low'
export type QualityMode = 'auto' | Tier

export interface TierConfig {
  /** Rentang devicePixelRatio untuk canvas. */
  dpr: [number, number]
  antialias: boolean
  /** Jumlah partikel Sparkles. */
  sparkles: number
  /** Pengali kehalusan geometri (1 = penuh). */
  detail: number
  /** Material fisik (clearcoat) hanya di tingkat Tinggi. */
  physical: boolean
  /** Elemen dekoratif tambahan (orbit, daun, dumbbell mini). */
  extras: boolean
  /** Hemat = tanpa WebGL sama sekali (poster statis). */
  webgl: boolean
}

export const TIERS: Record<Tier, TierConfig> = {
  high: { dpr: [1, 1.75], antialias: true, sparkles: 50, detail: 1, physical: true, extras: true, webgl: true },
  medium: { dpr: [1, 1.25], antialias: false, sparkles: 16, detail: 0.5, physical: false, extras: true, webgl: true },
  low: { dpr: [1, 1], antialias: false, sparkles: 0, detail: 0.35, physical: false, extras: false, webgl: false },
}

export const TIER_LABEL: Record<Tier, string> = { high: 'Tinggi', medium: 'Sedang', low: 'Hemat' }
export const MODE_LABEL: Record<QualityMode, string> = { auto: 'Otomatis', ...TIER_LABEL }

/** Ambang fps: di bawah ini selama 2 jendela berturut-turut → turun satu tingkat. */
export const FPS_FLOOR = 40

export function lowerTier(t: Tier): Tier {
  return t === 'high' ? 'medium' : 'low'
}

/** Deteksi awal (hanya di browser). */
export function detectTier(): Tier {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'low'
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if (nav.connection?.saveData) return 'low'

    const c = document.createElement('canvas')
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null
    if (!gl) return 'low'
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    // Rendering perangkat lunak (tanpa GPU) = terlalu lambat untuk 3D.
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return 'low'

    const cores = nav.hardwareConcurrency ?? 4
    const mem = nav.deviceMemory ?? 4
    const coarse = window.matchMedia('(pointer: coarse)').matches
    let score = 0
    if (cores >= 8) score += 1
    if (mem >= 8) score += 1
    if (!coarse) score += 1
    if (cores >= 6) score += 1
    if (score >= 3) return 'high'
    if (score >= 1 && cores >= 4) return 'medium'
    return 'low'
  } catch {
    return 'low'
  }
}
