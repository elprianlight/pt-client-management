'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const HeroScene = dynamic(() => import('./hero-scene'), {
  ssr: false,
  loading: () => null,
})

/**
 * Pembungkus aman untuk scene 3D:
 * - dimuat hanya di browser (tanpa SSR)
 * - dilewati bila pengguna memilih "kurangi gerakan"
 * - dilewati bila WebGL tidak tersedia (UI tetap tampil normal)
 */
export function HeroSceneLazy({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let webgl = false
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
    setEnabled(!reduce && webgl)
  }, [])

  if (!enabled) return null
  return <HeroScene className={className} />
}
