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
export function HeroSceneLazy({ className, aside = false }: { className?: string; aside?: boolean }) {
  const [enabled, setEnabled] = useState(false)
  const [wide, setWide] = useState(false)

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
    setWide(window.innerWidth >= 900)
  }, [])

  if (!enabled) return null
  // 'aside': geser barbel ke kiri agar tidak tertutup kartu di tengah layar
  const shifted = aside && wide
  return <HeroScene className={className} offset={shifted ? [-2.7, 0.1] : [0, 0]} scale={shifted ? 0.55 : 1} />
}
