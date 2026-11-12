'use client'

import { useEffect } from 'react'

const TILT_SELECTOR = '.stats-card, .tilt-card'

/**
 * Efek miring 3D saat kursor bergerak di atas kartu.
 * Satu listener untuk seluruh halaman (event delegation), hanya mengatur
 * variabel CSS --rx/--ry. Tidak aktif di layar sentuh atau saat reduced-motion.
 */
export function TiltProvider() {
  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return

    let active: HTMLElement | null = null

    const reset = (el: HTMLElement | null) => {
      if (!el) return
      el.style.setProperty('--rx', '0deg')
      el.style.setProperty('--ry', '0deg')
    }

    const onMove = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(TILT_SELECTOR) as HTMLElement | null
      if (active && active !== target) reset(active)
      active = target
      if (!target) return
      const r = target.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      target.style.setProperty('--ry', `${(px * 7).toFixed(2)}deg`)
      target.style.setProperty('--rx', `${(-py * 7).toFixed(2)}deg`)
    }

    const onLeave = () => {
      reset(active)
      active = null
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return null
}
