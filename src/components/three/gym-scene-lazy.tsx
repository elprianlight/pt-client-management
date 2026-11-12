'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { GymVariant } from './gym-scene'

const GymScene = dynamic(() => import('./gym-scene'), { ssr: false, loading: () => null })

/** Pembungkus aman: tanpa SSR, dilewati bila reduced-motion atau tanpa WebGL. */
export function GymSceneLazy({ className, variant }: { className?: string; variant?: GymVariant }) {
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
  return <GymScene className={className} variant={variant} />
}
