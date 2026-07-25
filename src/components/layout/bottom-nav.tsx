'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calendar, Users, Package } from 'lucide-react'
import type { UserRole } from '@/types'

const BOTTOM_NAV_ITEMS = [
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
    title: 'Paket',
    href: '/packages',
    icon: Package,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Sesi',
    href: '/session',
    icon: Calendar,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
]

export function BottomNav() {
  const pathname = usePathname()
  const { role } = useAuthStore()

  const filteredNav = BOTTOM_NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role as UserRole)
  )

  return (
    <nav className="bottom-nav">
      {filteredNav.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn('bottom-nav-item', isActive && 'active')}
          >
            <div className="bottom-nav-icon-wrapper">
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>
            <span className="bottom-nav-label">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
