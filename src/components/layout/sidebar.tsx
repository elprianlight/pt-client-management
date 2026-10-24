'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useLayoutStore } from '@/store/layout-store'
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
  Search,
  X,
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
    title: 'Jadwal',
    href: '/jadwal',
    icon: Calendar,
    roles: ['super_admin', 'personal_trainer'],
  },
  {
    title: 'Paket & Sesi',
    href: '/packages',
    icon: Package,
    roles: ['client'],
  },
  {
    title: 'Sesi Latihan',
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
    title: 'Nutrisi',
    href: '/nutrition',
    icon: Apple,
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
  const { isSidebarOpen, closeSidebar } = useLayoutStore()
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
    closeSidebar()
    router.push('/login')
  }

  return (
    <>
      {/* Backdrop for tablet & mobile drawer */}
      <div
        className={cn('sidebar-backdrop', isSidebarOpen && 'visible')}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={cn('sidebar', isSidebarOpen && 'open', className)}
        style={{ width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        {/* Logo & Close Drawer Button */}
        <div
          className="sidebar-logo"
          style={{
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '20px 0 16px' : '20px 18px 16px',
          }}
        >
          <Link href="/dashboard" onClick={closeSidebar} style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={collapsed ? '/icon_square.png' : '/logo_transparent.png'}
              alt="PT Client Management System"
              style={{
                width: collapsed ? 36 : 135,
                height: 'auto',
                maxHeight: 42,
                objectFit: 'contain',
                transition: 'all var(--transition-fast)',
              }}
            />
          </Link>

          {/* Drawer close button on mobile & tablet */}
          <button
            type="button"
            className="sidebar-drawer-close-btn"
            onClick={closeSidebar}
            aria-label="Tutup Menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
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
            {/* Bell notifikasi disembunyikan — belum ada panel notifikasi (lihat audit A5) */}
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

        {/* Navigation List */}
        <nav className="sidebar-nav">
          {!collapsed && <p className="sidebar-nav-label">Menu</p>}
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
                    onClick={closeSidebar}
                    className={cn('sidebar-nav-item', isActive && 'active')}
                    title={collapsed ? item.title : undefined}
                  >
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className="sidebar-nav-icon"
                    />
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
      </aside>

      <style jsx>{`
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--border-default);
          flex-shrink: 0;
          min-height: 70px;
          position: relative;
        }

        .sidebar-drawer-close-btn {
          display: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .sidebar-drawer-close-btn:hover {
          color: var(--text-primary);
          background: var(--bg-overlay);
        }

        @media (max-width: 1024px) {
          .sidebar-drawer-close-btn {
            display: flex;
          }
        }

        .sidebar-collapse-btn {
          position: absolute;
          right: -14px;
          top: 76px;
          width: 28px;
          height: 28px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          cursor: pointer;
          z-index: 60;
          box-shadow: var(--shadow-md);
          transition: all var(--transition-fast);
        }

        .sidebar-collapse-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-brand);
          transform: scale(1.1);
        }

        @media (max-width: 1024px) {
          .sidebar-collapse-btn {
            display: none;
          }
        }

        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          margin: 12px 10px 4px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          flex-shrink: 0;
        }

        .sidebar-user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          font-weight: 700;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .sidebar-user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
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
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .sidebar-notif-btn:hover {
          color: var(--text-primary);
          background: var(--bg-overlay);
        }

        .sidebar-notif-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 6px;
          height: 6px;
          background: var(--error);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--error);
        }

        .sidebar-search-container {
          padding: 8px 10px;
          flex-shrink: 0;
        }

        .sidebar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 7px 10px;
          transition: border-color var(--transition-fast);
        }

        .sidebar-search:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.12);
        }

        .sidebar-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .sidebar-search-input {
          background: transparent;
          border: none;
          outline: none;
          font-size: 12.5px;
          color: var(--text-primary);
          width: 100%;
        }

        .sidebar-search-input::placeholder {
          color: var(--text-muted);
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 8px 10px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-default) transparent;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 4px;
        }

        .sidebar-nav-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 8px 8px 4px;
        }

        .sidebar-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sidebar-nav-icon {
          flex-shrink: 0;
        }

        .sidebar-nav-label-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-badge {
          background: var(--brand-primary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: var(--radius-full);
          margin-left: auto;
        }

        .sidebar-bottom {
          padding: 8px 10px 16px;
          flex-shrink: 0;
        }

        .sidebar-logout {
          color: var(--error) !important;
          width: 100%;
          border: none;
          background: transparent;
        }

        .sidebar-logout:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: var(--error) !important;
        }
      `}</style>
    </>
  )
}
