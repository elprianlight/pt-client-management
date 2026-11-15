'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { ScenePoster, useTier } from './quality'

const HeroScene = dynamic(() => import('./hero-scene'), { ssr: false, loading: () => null })

/** Pembungkus scene hero dengan tiga tingkat kualitas; Hemat = poster statis. */
export function HeroSceneLazy({ className, aside = false }: { className?: string; aside?: boolean }) {
  const { cfg } = useTier()
  const [wide, setWide] = useState(false)
  useEffect(() => setWide(window.innerWidth >= 900), [])

  if (!cfg) return null
  if (!cfg.webgl) return <ScenePoster className={className} />
  // 'aside': geser barbel ke kiri agar tidak tertutup kartu di tengah layar
  const shifted = aside && wide
  return <HeroScene className={className} offset={shifted ? [-2.7, 0.1] : [0, 0]} scale={shifted ? 0.55 : 1} />
}
