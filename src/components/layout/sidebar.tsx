'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Dumbbell,
  Calendar,
  Apple,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Dumbbell as LogoIcon,
  Activity,
  BookOpen,
  Search,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  roles: UserRole[]
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Personal Trainer',
    href: '/pt',
    icon: UserCheck,
    roles: ['super_admin'],
  },
  {
    title: 'Client',
    href: '/clients',
    icon: Users,
    roles: ['super_admin', 'personal_trainer'],
  },
  {
    title: 'Paket & Sesi',
    href: '/packages',
    icon: Package,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Sesi Latihan',
    href: '/session',
    icon: Calendar,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Workout',
    href: '/workout',
    icon: Dumbbell,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Nutrisi',
    href: '/nutrition',
    icon: Apple,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Progress',
    href: '/progress',
    icon: TrendingUp,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Laporan',
    href: '/reports',
    icon: BarChart3,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
  {
    title: 'Pengaturan',
    href: '/settings',
    icon: Settings,
    roles: ['super_admin', 'personal_trainer', 'client'],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const filteredNav = NAV_ITEMS.filter(
    (item) => role && item.roles.includes(role)
  )

  const roleLabel: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    personal_trainer: 'Personal Trainer',
    client: 'Client',
  }

  const roleBadgeClass: Record<UserRole, string> = {
    super_admin: 'badge-error',
    personal_trainer: 'badge-brand',
    client: 'badge-success',
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  return (
    <aside
      className={cn('sidebar', className)}
      style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div className="sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '20px 0 16px' : '20px 18px 16px' }}>
        <img 
          src="/logo.png" 
          alt="Strength Lab Logo" 
          style={{ 
            width: collapsed ? 36 : 120, 
            height: 'auto', 
            objectFit: 'contain', 
            borderRadius: 8,
            transition: 'width var(--transition-fast)' 
          }} 
        />
      </div>

      {/* Collapse Toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* User Info & Notifications */}
      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.fullName}</p>
            <span className={cn('badge', role && roleBadgeClass[role])}>
              {role && roleLabel[role]}
            </span>
          </div>
          <button className="sidebar-notif-btn" aria-label="Notifikasi">
            <Bell size={16} />
            <span className="sidebar-notif-dot" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      {!collapsed && (
        <div className="sidebar-search-container">
          <div className="sidebar-search">
            <Search size={14} className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Cari client, sesi..."
              className="sidebar-search-input"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {!collapsed && (
          <p className="sidebar-nav-label">Menu</p>
        )}
        <ul className="sidebar-nav-list">
          {filteredNav.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn('sidebar-nav-item', isActive && 'active')}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} className="sidebar-nav-icon" />
                  {!collapsed && (
                    <span className="sidebar-nav-label-text">{item.title}</span>
                  )}
                  {!collapsed && item.badge != null && item.badge > 0 && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="sidebar-bottom">
        <div className="divider" />
        <button
          className="sidebar-nav-item sidebar-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>

      <style jsx>{`
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 18px 16px;
          border-bottom: 1px solid var(--border-default);
          flex-shrink: 0;
          min-height: 72px;
          overflow: hidden;
        }
        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--gradient-brand);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 0 16px rgba(99,102,241,0.3);
        }
        .sidebar-logo-text {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .sidebar-logo-name {
          font-weight: 700;
          font-size: 15px;
          color: var(--text-primary);
          white-space: nowrap;
        }
        .sidebar-logo-version {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sidebar-collapse-btn {
          position: absolute;
          top: 24px;
          right: -13px;
          width: 26px;
          height: 26px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          z-index: 10;
          transition: all var(--transition-fast);
        }
        .sidebar-collapse-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-strong);
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid var(--border-default);
          flex-shrink: 0;
        }
        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: white;
          flex-shrink: 0;
        }
        .sidebar-user-info {
          overflow: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-notif-btn {
          position: relative;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sidebar-notif-btn:hover {
          background: var(--bg-overlay);
          color: var(--text-primary);
        }
        .sidebar-notif-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 6px;
          height: 6px;
          background: var(--brand-primary);
          border-radius: 50%;
          border: 1px solid var(--bg-elevated);
        }

        .sidebar-search-container {
          padding: 12px 18px 0;
        }
        .sidebar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 6px 10px;
          transition: all var(--transition-fast);
        }
        .sidebar-search:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px rgba(99,102,241,0.1);
        }
        .sidebar-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .sidebar-search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 12px;
          color: var(--text-primary);
          width: 100%;
          font-family: 'Inter', sans-serif;
        }
        .sidebar-search-input::placeholder {
          color: var(--text-muted);
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 10px;
        }
        .sidebar-nav-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 8px;
          margin-bottom: 6px;
          margin-top: 4px;
        }
        .sidebar-nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-nav-icon {
          flex-shrink: 0;
          min-width: 18px;
        }
        .sidebar-nav-label-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sidebar-badge {
          background: var(--brand-primary);
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 100px;
          min-width: 18px;
          text-align: center;
        }

        .sidebar-bottom {
          padding: 0 10px 16px;
          flex-shrink: 0;
        }
        .sidebar-logout {
          width: 100%;
          color: var(--text-muted);
        }
        .sidebar-logout:hover {
          background: var(--error-bg) !important;
          color: var(--error) !important;
        }
        .sidebar-logout:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </aside>
  )
}
