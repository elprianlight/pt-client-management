'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  gradient?: string
  className?: string
  isLoading?: boolean
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = '#6366f1',
  trend,
  gradient,
  className,
  isLoading = false,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <div className={cn('stats-card', className)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="skeleton" style={{ height: 14, width: '60%' }} />
          <div className="skeleton" style={{ height: 32, width: '40%' }} />
          <div className="skeleton" style={{ height: 12, width: '80%' }} />
        </div>
      </div>
    )
  }

  const trendIcon =
    trend?.direction === 'up' ? TrendingUp :
    trend?.direction === 'down' ? TrendingDown :
    Minus

  const trendColor =
    trend?.direction === 'up' ? 'var(--success)' :
    trend?.direction === 'down' ? 'var(--error)' :
    'var(--text-muted)'

  return (
    <div className={cn('stats-card animate-fade-in-up', className)}>
      {/* Top row */}
      <div className="stats-top">
        <p className="stats-title">{title}</p>
        <div
          className="stats-icon-wrapper"
          style={{
            background: gradient ?? `${iconColor}18`,
            boxShadow: `0 0 12px ${iconColor}22`,
          }}
        >
          <Icon
            size={20}
            strokeWidth={1.8}
            style={{ color: iconColor }}
          />
        </div>
      </div>

      {/* Value */}
      <div className="stats-value">{value}</div>

      {/* Subtitle / Trend */}
      <div className="stats-bottom">
        {trend ? (
          <div className="stats-trend" style={{ color: trendColor }}>
            {(() => {
              const TrendIcon = trendIcon
              return <TrendIcon size={13} strokeWidth={2} />
            })()}
            <span className="stats-trend-value">
              {trend.direction !== 'neutral' && (trend.direction === 'up' ? '+' : '-')}
              {Math.abs(trend.value)}%
            </span>
            <span className="stats-trend-label">{trend.label}</span>
          </div>
        ) : null}
        {subtitle && (
          <p className="stats-subtitle">{subtitle}</p>
        )}
      </div>

      <style jsx>{`
        .stats-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .stats-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        .stats-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform var(--transition-fast);
        }
        .stats-card:hover .stats-icon-wrapper {
          transform: scale(1.1);
        }
        .stats-value {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 10px;
          letter-spacing: -0.02em;
        }
        .stats-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .stats-trend {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 12px;
          font-weight: 600;
        }
        .stats-trend-value {
          font-weight: 700;
        }
        .stats-trend-label {
          color: var(--text-muted);
          font-weight: 400;
        }
        .stats-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }
        @media (max-width: 640px) {
          .stats-top {
            margin-bottom: 8px;
          }
          .stats-title {
            font-size: 12px;
          }
          .stats-icon-wrapper {
            width: 32px;
            height: 32px;
          }
          .stats-value {
            font-size: 22px;
            margin-bottom: 6px;
          }
          .stats-subtitle {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}
