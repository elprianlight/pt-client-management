'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Calendar,
  Users,
  User,
  Package,
  Dumbbell,
  TrendingUp,
  BarChart3,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react'
import type { UserRole } from '@/types'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  isCenter?: boolean
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
    title: 'Paket',
    href: '/packages',
    icon: Package,
    roles: ['client'],
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    roles: ['client'],
  },
  {
    title: 'Akun',
    href: '/settings',
    icon: User,
    roles: ['client'],
  },
  {
    title: 'Check-In',
    href: '/jadwal',
    icon: CheckCircle2,
    roles: ['super_admin', 'personal_trainer'],
    isCenter: true,
  },
  {
    title: 'Jadwal',
    href: '/jadwal',
    icon: Calendar,
    roles: ['super_admin', 'personal_trainer'],
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'personal_trainer'],
  },
]

const MORE_NAV: NavItem[] = []

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { role } = useAuthStore()
  const { isSessionModalOpen, openSessionModal } = useLayoutStore()
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

          if (item.isCenter) {
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => {
                  openSessionModal()
                  if (pathname !== '/jadwal') {
                    router.push('/jadwal')
                  }
                }}
                className={cn(
                  'bottom-nav-item bottom-nav-center-item',
                  pathname === '/jadwal' && isSessionModalOpen && 'active'
                )}
                title="Input / Check-In Sesi Latihan"
                id="btn-bottom-checkin"
              >
                <div className="bottom-nav-center-btn">
                  <CheckCircle2 size={24} strokeWidth={2.4} />
                </div>
                <span className="bottom-nav-label bottom-nav-center-label">{item.title}</span>
              </button>
            )
          }

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
        :global(.bottom-nav-center-item) {
          position: relative;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .bottom-nav-center-btn {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-top: -24px;
          box-shadow: var(--shadow-brand);
          border: 3px solid var(--bg-surface);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }

        :global(.bottom-nav-center-item:active) .bottom-nav-center-btn {
          transform: scale(0.92);
        }

        :global(.bottom-nav-center-item:hover) .bottom-nav-center-btn {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 6px 20px rgba(192, 57, 43, 0.35);
        }

        .bottom-nav-center-label {
          color: var(--brand-primary);
          font-weight: 800 !important;
          margin-top: 2px;
        }

        .bottom-nav-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 98;
        }

        .bottom-nav-more-menu {
          position: fixed;
          bottom: calc(var(--bottom-nav-height) + 12px);
          right: 16px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 99;
          min-width: 180px;
          box-shadow: var(--shadow-xl);
          backdrop-filter: blur(20px);
        }

        :global(.bottom-nav-more-item) {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          border-radius: var(--radius-md);
          transition: background-color 0.15s ease, color 0.15s ease;
        }

        :global(.bottom-nav-more-item:hover) {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        :global(.bottom-nav-more-item.active) {
          background: rgba(192, 57, 43, 0.08);
          color: var(--brand-primary);
          font-weight: 700;
        }
      `}</style>
    </>
  )
}
