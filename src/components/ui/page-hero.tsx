'use client'

import { GymSceneLazy } from '@/components/three/gym-scene-lazy'
import type { GymVariant } from '@/components/three/gym-scene'

interface PageHeroProps {
  eyebrow: string
  title: string
  subtitle?: string
  chips?: string[]
  variant?: GymVariant
}

/**
 * Banner halaman bergaya Urban PT: eyebrow, judul besar, subjudul,
 * chip metrik, dan visual 3D gym/wellness interaktif di sisi kanan.
 */
export function PageHero({ eyebrow, title, subtitle, chips, variant }: PageHeroProps) {
  return (
    <section className="page-hero animate-fade-in-up">
      <GymSceneLazy className="page-hero-stage" variant={variant} />
      <div className="page-hero-body">
        <span className="page-hero-eyebrow">{eyebrow}</span>
        <h1 className="page-hero-title">{title}</h1>
        {subtitle && <p className="page-hero-sub">{subtitle}</p>}
        {chips && chips.length > 0 && (
          <div className="page-hero-chips">
            {chips.map((c) => (
              <span key={c} className="metric-pill">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-hero {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          min-height: 210px;
          margin-bottom: 18px;
          padding: 26px 24px;
          border-radius: 32px;
          color: #fff;
          background:
            radial-gradient(520px 260px at 88% 10%, rgba(255, 138, 92, 0.32), transparent 60%),
            radial-gradient(520px 300px at 0% 110%, rgba(231, 76, 60, 0.32), transparent 60%),
            linear-gradient(135deg, #1a0f0d 0%, #4a1511 50%, #c0392b 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }
        .page-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: -1;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse at 75% 40%, #000 0%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at 75% 40%, #000 0%, transparent 72%);
        }
        .page-hero-body {
          position: relative;
          z-index: 1;
          max-width: 520px;
          pointer-events: none;
        }
        .page-hero-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #ffb4a6;
        }
        .page-hero-title {
          font-family: var(--font-heading), 'Sora', sans-serif;
          font-size: clamp(26px, 5vw, 38px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 8px 0 8px;
          color: #fff;
        }
        .page-hero-sub {
          font-size: 13.5px;
          color: rgba(255, 236, 230, 0.85);
          max-width: 420px;
        }
        .page-hero-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          .page-hero {
            padding: 22px 18px;
            min-height: 200px;
          }
        }
      `}</style>
    </section>
  )
}
