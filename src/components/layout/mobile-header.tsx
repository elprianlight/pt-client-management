'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { useLayoutStore } from '@/store/layout-store'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, LogOut, Sun, Moon, Menu, Terminal, Activity, ShieldCheck } from 'lucide-react'

const PAGE_CONFIG: Record<string, { title: string; slug: string; tag: string }> = {
  '/dashboard': { title: 'Dashboard', slug: 'dashboard', tag: 'OVERVIEW' },
  '/pt': { title: 'Personal Trainer', slug: 'pt-hub', tag: 'TRAINERS' },
  '/clients': { title: 'Client', slug: 'clients', tag: 'DATABASE' },
  '/jadwal': { title: 'Jadwal', slug: 'jadwal', tag: 'DISPATCH' },
  '/packages': { title: 'Paket Sesi', slug: 'packages', tag: 'QUOTA' },
  '/session': { title: 'Sesi Latihan', slug: 'session', tag: 'LOGS' },
  '/workout': { title: 'Workout', slug: 'workout', tag: 'BUILDER' },
  '/nutrition': { title: 'Nutrisi', slug: 'nutrition', tag: 'MEALS' },
  '/progress': { title: 'Progress', slug: 'progress', tag: 'ANALYTICS' },
  '/reports': { title: 'Laporan', slug: 'reports', tag: 'INSIGHTS' },
  '/settings': { title: 'Pengaturan', slug: 'settings', tag: 'CONFIG' },
}

export function MobileHeader() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user, role, clearAuth } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { toggleSidebar } = useLayoutStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'U'

  const activePage = Object.entries(PAGE_CONFIG).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? { title: 'Dashboard', slug: 'dashboard', tag: 'OVERVIEW' }

  // Format role label & badge
  const roleLabelMap: Record<string, string> = {
    super_admin: 'Super Admin',
    personal_trainer: 'Personal Trainer',
    client: 'Client',
  }
  const formattedRole = (role && roleLabelMap[role]) || 'User'
  const roleBadge = role === 'personal_trainer' ? 'PT' : role === 'super_admin' ? 'Admin' : 'Client'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  return (
    <header className="dev-header">
      {/* ─── LEFT: Keycap Menu + Logo + Breadcrumb (Konsep 1) ─── */}
      <div className="dev-hdr-left">
        <button
          type="button"
          className="dev-hdr-keycap-btn"
          onClick={toggleSidebar}
          aria-label="Buka Menu Navigasi"
          id="btn-hamburger-menu"
        >
          <Menu size={16} strokeWidth={2.2} />
        </button>

        <Link href="/dashboard" className="dev-hdr-logo-link" aria-label="Home">
          <img src="/logo_transparent.png" alt="Strength Lab Logo" className="dev-hdr-logo" />
        </Link>

        {/* Breadcrumb Developer (Konsep 1) */}
        <div className="dev-hdr-breadcrumb font-mono">
          <span className="dev-hdr-org">strength-lab</span>
          <span className="dev-hdr-slash">/</span>
          <span className="dev-hdr-page">{activePage.slug}</span>
          <span className="dev-hdr-live-pill" title="Database Live Synchronized">
            <span className="dev-pulse-dot" />
            <span className="dev-live-text">live</span>
          </span>
        </div>
      </div>

      {/* ─── RIGHT: Theme Toggle + Squircle Avatar ─── */}
      <div className="dev-hdr-right">
        {/* Theme Toggle Keycap */}
        <button
          className="dev-hdr-keycap-btn theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          id="btn-theme-toggle"
        >
          {theme === 'dark' ? (
            <Sun size={15} className="theme-icon-sun" />
          ) : (
            <Moon size={15} className="theme-icon-moon" />
          )}
        </button>

        {/* Profile Avatar + Dropdown */}
        {user && (
          <div className="profile-hdr-container" ref={dropdownRef}>
            <button
              className="profile-avatar-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Menu profil pengguna"
              aria-expanded={showDropdown}
              id="btn-mobile-profile"
            >
              <span className="profile-avatar-circle">{userInitial}</span>
              <span className="profile-avatar-badge">{roleBadge}</span>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="profile-dropdown-backdrop"
                  onClick={() => setShowDropdown(false)}
                  aria-hidden="true"
                />

                {/* Clean & Simple Profile Dropdown */}
                <div className="profile-dropdown animate-slide-down">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {userInitial}
                    </div>
                    <div className="profile-dropdown-info">
                      <p className="profile-dropdown-name">{user.fullName}</p>
                      <p className="profile-dropdown-email">{user.email}</p>
                      <div className="profile-dropdown-role">
                        <span className="profile-role-dot" />
                        <span>{formattedRole}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-dropdown-divider" />

                  <Link
                    href="/settings"
                    className="profile-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                    id="btn-mobile-settings"
                  >
                    <Settings size={16} strokeWidth={1.8} className="profile-dropdown-icon" />
                    <span>Pengaturan Akun</span>
                  </Link>

                  <div className="profile-dropdown-divider" />

                  <button
                    className="profile-dropdown-item profile-logout-item"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    id="btn-mobile-logout"
                  >
                    <LogOut size={16} strokeWidth={1.8} className="profile-dropdown-icon" />
                    <span>{isLoggingOut ? 'Memproses...' : 'Keluar'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .dev-header {
          height: var(--header-height, 56px);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 50;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        /* ─── LEFT ─── */
        .dev-hdr-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .dev-hdr-keycap-btn {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .dev-hdr-keycap-btn:hover {
          background: var(--bg-subtle);
          border-color: var(--border-strong);
          color: var(--text-primary);
        }

        @media (min-width: 1025px) {
          .dev-hdr-keycap-btn:not(.theme-toggle-btn) {
            display: none;
          }
        }

        .dev-hdr-logo-link {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .dev-hdr-logo {
          height: 36px;
          width: auto;
          object-fit: contain;
        }

        /* Breadcrumb — Clean Analog editorial */
        .dev-hdr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-body), 'DM Sans', sans-serif;
        }

        .dev-hdr-org {
          color: var(--text-muted);
          font-weight: 500;
        }

        .dev-hdr-slash {
          color: var(--text-muted);
          font-weight: 400;
        }

        .dev-hdr-page {
          color: var(--text-primary);
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .dev-hdr-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--success-bg);
          border: 1px solid rgba(39,134,74,0.2);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
          margin-left: 2px;
        }

        .dev-pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--success);
          animation: dev-pulse 1.8s infinite;
        }

        @keyframes dev-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .dev-live-text {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--success);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ─── RIGHT ─── */
        .dev-hdr-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .dev-hdr-org {
            display: none;
          }
          .dev-hdr-slash {
            display: none;
          }
        }

        .theme-icon-sun {
          color: var(--warning);
        }
        .theme-icon-moon {
          color: var(--brand-accent);
        }

        /* ─── Profile Avatar & Dropdown (Clean & Simple) ─── */
        .profile-hdr-container {
          position: relative;
        }

        .profile-avatar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px 3px 4px;
          height: 34px;
          border-radius: var(--radius-lg);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .profile-avatar-btn:hover {
          border-color: var(--border-brand);
          background: var(--bg-surface);
        }

        .profile-avatar-circle {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: var(--brand-primary);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .profile-avatar-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* Dropdown Overlay & Container */
        .profile-dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 150;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 250px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 6px;
          z-index: 151;
          font-family: inherit;
        }

        .profile-dropdown-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 10px 10px;
        }

        .profile-dropdown-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--brand-primary);
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .profile-dropdown-info {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .profile-dropdown-name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          line-height: 1.3;
        }

        .profile-dropdown-email {
          font-size: 11.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          line-height: 1.3;
        }

        .profile-dropdown-role {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 4px;
          padding: 2px 7px;
          background: var(--success-bg);
          border: 1px solid rgba(39, 134, 74, 0.2);
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 600;
          color: var(--success);
          width: fit-content;
        }

        .profile-role-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--success);
        }

        .profile-dropdown-divider {
          height: 1px;
          background: var(--border-default);
          margin: 4px 0;
        }

        .profile-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          text-decoration: none;
          transition: all var(--transition-fast);
          text-align: left;
          box-sizing: border-box;
        }

        .profile-dropdown-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        .profile-dropdown-icon {
          color: var(--text-secondary);
          flex-shrink: 0;
          transition: color var(--transition-fast);
        }

        .profile-dropdown-item:hover .profile-dropdown-icon {
          color: var(--brand-primary);
        }

        .profile-logout-item {
          color: var(--error);
        }

        .profile-logout-item .profile-dropdown-icon {
          color: var(--error);
        }

        .profile-logout-item:hover {
          background: var(--error-bg);
          color: var(--error);
        }
      `}</style>
    </header>
  )
}
