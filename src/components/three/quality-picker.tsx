'use client'

import { useEffect, useState } from 'react'
import { MODE_LABEL, TIER_LABEL, type QualityMode } from '@/lib/three-quality'
import { selectTier, useQualityStore } from '@/store/quality-store'
import { useTier } from './quality'

const MODES: QualityMode[] = ['auto', 'high', 'medium', 'low']
const HINT: Record<QualityMode, string> = {
  auto: 'Menyesuaikan perangkat dan turun sendiri bila terasa berat.',
  high: 'Efek penuh: kilap logam, partikel, anti-aliasing.',
  medium: 'Lebih ringan: efek disederhanakan, hemat baterai.',
  low: 'Tanpa WebGL: gambar statis, paling hemat baterai dan kuota.',
}

/** Pemilih kualitas 3D: Otomatis / Tinggi / Sedang / Hemat. */
export function QualityPicker() {
  useTier() // memastikan deteksi perangkat berjalan
  const mode = useQualityStore((s) => s.mode)
  const setMode = useQualityStore((s) => s.setMode)
  const tier = useQualityStore(selectTier)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
      <div role="radiogroup" aria-label="Kualitas 3D" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => setMode(m)}
            style={{
              minHeight: 40,
              padding: '0 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-default)',
              background: mode === m ? 'var(--brand-primary)' : 'var(--bg-surface)',
              color: mode === m ? '#fff' : 'var(--text-primary)',
            }}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
        {HINT[mode]}
        {mode === 'auto' && tier ? ` Saat ini: ${TIER_LABEL[tier]}.` : ''}
      </span>
    </div>
  )
}
