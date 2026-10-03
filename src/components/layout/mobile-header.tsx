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

  // Format role badge
  const roleBadge = role === 'personal_trainer' ? 'PT' : role === 'super_admin' ? 'ROOT' : 'CLIENT'

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

        {/* Profile Squircle Avatar (Konsep 1 & 8) + Dropdown */}
        {user && (
          <div className="dev-hdr-profile" ref={dropdownRef}>
            <button
              className="dev-squircle-avatar-btn font-mono"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Toggle profile menu"
              aria-expanded={showDropdown}
              id="btn-mobile-profile"
            >
              <span className="dev-avatar-letter">{userInitial}</span>
              <span className="dev-avatar-role">{roleBadge}</span>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="dev-dropdown-backdrop"
                  onClick={() => setShowDropdown(false)}
                  aria-hidden="true"
                />

                {/* Developer Dropdown */}
                <div className="dev-dropdown animate-slide-down font-mono">
                  <div className="dev-dropdown-header">
                    <div className="dev-dropdown-avatar-box">
                      {userInitial}
                    </div>
                    <div className="dev-dropdown-user-meta">
                      <p className="dev-dropdown-name">{user.fullName}</p>
                      <p className="dev-dropdown-email">{user.email}</p>
                      <div className="dev-dropdown-role-tag">
                        ROLE: {role?.toUpperCase() || 'USER'} // ACTIVE
                      </div>
                    </div>
                  </div>

                  <div className="dev-dropdown-divider" />

                  <Link
                    href="/settings"
                    className="dev-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                    id="btn-mobile-settings"
                  >
                    <Settings size={14} className="text-indigo-400" />
                    <span>[ CONFIG ] Pengaturan</span>
                  </Link>

                  <div className="dev-dropdown-divider" />

                  <button
                    className="dev-dropdown-item dev-logout-btn"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    id="btn-mobile-logout"
                  >
                    <LogOut size={14} />
                    <span>{isLoggingOut ? 'TERMINATING...' : '[ LOGOUT ] Keluar'}</span>
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
          background: #080c14;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }

        :global([data-theme="light"]) .dev-header {
          background: #ffffff;
          border-bottom-color: #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        :global([data-theme="light"]) .dev-hdr-keycap-btn {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #475569;
        }

        .dev-hdr-keycap-btn:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
          color: #818cf8;
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

        /* Breadcrumb (Konsep 1) */
        .dev-hdr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dev-hdr-org {
          color: #64748b;
          font-weight: 600;
        }

        :global([data-theme="light"]) .dev-hdr-org {
          color: #94a3b8;
        }

        .dev-hdr-slash {
          color: #475569;
          font-weight: 400;
        }

        .dev-hdr-page {
          color: #f1f5f9;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        :global([data-theme="light"]) .dev-hdr-page {
          color: #0f172a;
        }

        .dev-hdr-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1px 6px;
          border-radius: 4px;
          margin-left: 2px;
        }

        .dev-pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: dev-pulse 1.8s infinite;
        }

        @keyframes dev-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .dev-live-text {
          font-size: 9.5px;
          font-weight: 800;
          color: #34d399;
          letter-spacing: 0.05em;
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
          color: #f59e0b;
        }
        .theme-icon-moon {
          color: #818cf8;
        }

        /* Squircle Avatar & Role Pill */
        .dev-hdr-profile {
          position: relative;
        }

        .dev-squircle-avatar-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 7px 3px 4px;
          height: 34px;
          border-radius: 9px;
          background: #0d1322;
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #f1f5f9;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }

        :global([data-theme="light"]) .dev-squircle-avatar-btn {
          background: #f8fafc;
          border-color: #c7d2fe;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        .dev-squircle-avatar-btn:hover {
          border-color: #818cf8;
          background: rgba(99, 102, 241, 0.15);
          box-shadow: 0 0 14px rgba(99, 102, 241, 0.35);
          transform: translateY(-1px);
        }

        .dev-avatar-letter {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          font-size: 12px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dev-avatar-role {
          font-size: 10px;
          font-weight: 800;
          color: #818cf8;
          letter-spacing: 0.05em;
        }

        :global([data-theme="light"]) .dev-avatar-role {
          color: #4f46e5;
        }

        /* ─── DEVELOPER DROPDOWN ─── */
        .dev-dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 150;
        }

        .dev-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: #090d16;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(99, 102, 241, 0.1);
          padding: 8px;
          z-index: 151;
          backdrop-filter: blur(20px);
        }

        :global([data-theme="light"]) .dev-dropdown {
          background: #ffffff;
          border-color: #e2e8f0;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }

        .dev-dropdown-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
        }

        .dev-dropdown-avatar-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #818cf8;
          font-size: 13px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dev-dropdown-user-meta {
          min-width: 0;
          flex: 1;
        }

        .dev-dropdown-name {
          font-size: 12px;
          font-weight: 800;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }

        :global([data-theme="light"]) .dev-dropdown-name {
          color: #0f172a;
        }

        .dev-dropdown-email {
          font-size: 10px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 1px 0 0 0;
        }

        .dev-dropdown-role-tag {
          font-size: 9px;
          color: #34d399;
          margin-top: 3px;
          letter-spacing: 0.04em;
        }

        .dev-dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          margin: 6px 0;
        }

        :global([data-theme="light"]) .dev-dropdown-divider {
          background: #e2e8f0;
        }

        .dev-dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          font-size: 11.5px;
          font-weight: 700;
          color: #cbd5e1;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.12s ease;
          text-align: left;
          box-sizing: border-box;
        }

        :global([data-theme="light"]) .dev-dropdown-item {
          color: #475569;
        }

        .dev-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        :global([data-theme="light"]) .dev-dropdown-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .dev-logout-btn {
          color: #f87171;
        }

        .dev-logout-btn:hover {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
      `}</style>
    </header>
  )
}
