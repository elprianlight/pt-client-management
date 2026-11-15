'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { FPS_FLOOR, TIERS, detectTier, type TierConfig } from '@/lib/three-quality'
import { selectTier, useQualityStore } from '@/store/quality-store'

/** Tingkat efektif + konfigurasinya; mendeteksi perangkat sekali per sesi. */
export function useTier() {
  const tier = useQualityStore(selectTier)
  const detected = useQualityStore((s) => s.detected)
  const setDetected = useQualityStore((s) => s.setDetected)
  useEffect(() => {
    if (!detected) setDetected(detectTier())
  }, [detected, setDetected])
  return { tier, cfg: tier ? TIERS[tier] : null }
}

/** Konfigurasi tingkat aktif untuk komponen di dalam Canvas (tanpa bergantung pada context). */
export function useTierConfig(): TierConfig {
  const tier = useQualityStore(selectTier)
  return TIERS[tier ?? 'medium']
}

/** Material: fisik (clearcoat) di tingkat Tinggi, standar di tingkat lain. */
export function Phys({ clearcoat, clearcoatRoughness, ...rest }: any) {
  const { physical } = useTierConfig()
  return physical ? (
    <meshPhysicalMaterial clearcoat={clearcoat} clearcoatRoughness={clearcoatRoughness} {...rest} />
  ) : (
    <meshStandardMaterial {...rest} />
  )
}

/**
 * Mengukur fps di dalam Canvas. Jendela 2 detik; dua jendela berturut-turut
 * di bawah ambang → turun satu tingkat (hanya pada mode otomatis).
 */
export function PerfMonitor() {
  const downgrade = useQualityStore((s) => s.downgrade)
  const acc = useRef({ frames: 0, t: 0, slow: 0, warm: 0 })
  useFrame((_, delta) => {
    if (delta > 0.25) return // lonjakan (tab baru aktif / jeda) bukan beban render
    const a = acc.current
    a.frames += 1
    a.t += delta
    if (a.t < 2) return
    const fps = a.frames / a.t
    a.frames = 0
    a.t = 0
    if (a.warm < 1) {
      a.warm += 1 // jendela pertama = pemanasan shader
      return
    }
    a.slow = fps < FPS_FLOOR ? a.slow + 1 : 0
    if (a.slow >= 2) {
      a.slow = 0
      downgrade()
    }
  })
  return null
}

/**
 * Menentukan apakah scene boleh dirender: berhenti saat di luar layar
 * atau tab tersembunyi.
 */
export function useSceneActive<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [visible, setVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  useEffect(() => {
    const on = () => setTabVisible(!document.hidden)
    on()
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible && tabVisible
}

/** Poster statis untuk tingkat Hemat / tanpa WebGL: tidak ada canvas sama sekali. */
export function ScenePoster({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(circle at 50% 55%, rgba(255,77,58,0.38) 0%, rgba(176,42,28,0.18) 32%, transparent 62%)',
      }}
    />
  )
}
