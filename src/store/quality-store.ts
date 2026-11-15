'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { lowerTier, type QualityMode, type Tier } from '@/lib/three-quality'

interface QualityState {
  /** Pilihan pengguna: otomatis atau dikunci ke satu tingkat. */
  mode: QualityMode
  /** Hasil deteksi perangkat (diisi di browser). */
  detected: Tier | null
  /** Tingkat setelah penurunan otomatis karena fps rendah. */
  downgraded: Tier | null
  setMode: (m: QualityMode) => void
  setDetected: (t: Tier) => void
  /** Dipanggil monitor fps; hanya berlaku pada mode otomatis. */
  downgrade: () => void
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set, get) => ({
      mode: 'auto',
      detected: null,
      downgraded: null,
      setMode: (mode) => set({ mode, downgraded: null }),
      setDetected: (detected) => set({ detected }),
      downgrade: () => {
        const s = get()
        if (s.mode !== 'auto') return
        const current = s.downgraded ?? s.detected
        if (!current || current === 'low') return
        set({ downgraded: lowerTier(current) })
      },
    }),
    { name: 'elp-3d-quality', partialize: (s) => ({ mode: s.mode }) }
  )
)

/** Tingkat efektif; null selama deteksi belum selesai. */
export function selectTier(s: QualityState): Tier | null {
  if (s.mode !== 'auto') return s.mode
  return s.downgraded ?? s.detected
}
