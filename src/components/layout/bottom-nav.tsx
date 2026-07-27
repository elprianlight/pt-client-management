'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Dumbbell,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
} from 'lucide-react'
import type { UserRole } from '@/types'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
}

const PRIMARY_NAV: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Client',
    href: '/clients',
    icon: Users,
    roles: ['super_admin', 'personal_trainer'],
  },
  {
    title: 'Sesi',
    href: '/session',
    icon: Calendar,
    roles: ['client'],
  },
  {
    title: 'Workout',
    href: '/workout',
    icon: Dumbbell,
    roles: ['client'],
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    roles: ['client'],
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'personal_trainer'],
  },
]

const MORE_NAV: NavItem[] = [
  {
    title: 'Paket',
    href: '/packages',
    icon: Package,
    roles: ['client'],
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { role } = useAuthStore()
  const [showMore, setShowMore] = useState(false)

  const filteredPrimary = PRIMARY_NAV.filter(
    (item) => role && item.roles.includes(role as UserRole)
  )
  const filteredMore = MORE_NAV.filter(
    (item) => role && item.roles.includes(role as UserRole)
  )

  const isMoreActive = filteredMore.some(
    (item) =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href))
  )

  return (
    <>
      {/* Backdrop for More menu */}
      {showMore && (
        <div
          className="bottom-nav-backdrop"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* More menu popup */}
      {showMore && filteredMore.length > 0 && (
        <div className="bottom-nav-more-menu animate-slide-up">
          {filteredMore.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('bottom-nav-more-item', isActive && 'active')}
                onClick={() => setShowMore(false)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      )}

      <nav className="bottom-nav" aria-label="Navigasi utama">
        {filteredPrimary.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('bottom-nav-item', isActive && 'active')}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon-wrapper">
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
              </div>
              <span className="bottom-nav-label">{item.title}</span>
            </Link>
          )
        })}

        {/* More button — shown only when there are extra items */}
        {filteredMore.length > 0 && (
          <button
            className={cn('bottom-nav-item', (isMoreActive || showMore) && 'active')}
            onClick={() => setShowMore(!showMore)}
            aria-label="More navigation"
            aria-expanded={showMore}
          >
            <div className="bottom-nav-icon-wrapper">
              <MoreHorizontal
                size={20}
                strokeWidth={(isMoreActive || showMore) ? 2.2 : 1.7}
              />
            </div>
            <span className="bottom-nav-label">Lainnya</span>
          </button>
        )}
      </nav>

      <style jsx>{`
        .bottom-nav-backdrop {
          position: fixed;
          inset: 0;
          z-index: 98;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(2px);
        }
        .bottom-nav-more-menu {
          position: fixed;
          bottom: calc(var(--bottom-nav-height) + 8px);
          right: 12px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          z-index: 99;
          min-width: 160px;
        }
        .bottom-nav-more-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-fast);
          border-bottom: 1px solid var(--border-default);
          min-height: 48px;
        }
        .bottom-nav-more-item:last-child {
          border-bottom: none;
        }
        .bottom-nav-more-item:active,
        .bottom-nav-more-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .bottom-nav-more-item.active {
          color: var(--brand-primary);
          background: rgba(99,102,241,0.08);
        }

        /* Override global min-height for bottom nav button */
        :global(.bottom-nav-item) {
          min-height: unset !important;
        }
      `}</style>
    </>
  )
}
