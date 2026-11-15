'use client'

import dynamic from 'next/dynamic'
import type { GymVariant } from './gym-scene'
import { ScenePoster, useTier } from './quality'

const GymScene = dynamic(() => import('./gym-scene'), { ssr: false, loading: () => null })

/**
 * Pembungkus scene 3D dengan tiga tingkat kualitas (Tinggi/Sedang/Hemat).
 * Hemat = poster statis tanpa WebGL. Kode three.js hanya dimuat bila tingkat butuh WebGL.
 */
export function GymSceneLazy({ className, variant }: { className?: string; variant?: GymVariant }) {
  const { cfg } = useTier()
  if (!cfg) return null
  if (!cfg.webgl) return <ScenePoster className={className} />
  return <GymScene className={className} variant={variant} />
}
