'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useThemeStore } from '@/store/theme-store'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, LogOut, Sun, Moon } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pt': 'Personal Trainer',
  '/clients': 'Client',
  '/packages': 'Paket Sesi',
  '/session': 'Sesi Latihan',
  '/workout': 'Workout',
  '/nutrition': 'Nutrisi',
  '/progress': 'Progress',
  '/reports': 'Laporan',
  '/settings': 'Pengaturan',
}

export function MobileHeader() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { user, clearAuth } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'U'

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? 'Dashboard'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  return (
    <div className="mobile-header">
      {/* Left: Logo + Page Title */}
      <div className="mh-left">
        <Link href="/dashboard" className="mh-logo-link" aria-label="Home">
          <img src="/logo_transparent.png" alt="PT Client Management Logo" className="mh-logo" />
        </Link>
        <div className="mh-title-wrap">
          <span className="mh-page-title">{pageTitle}</span>
        </div>
      </div>

      {/* Right: Theme Toggle + Avatar */}
      <div className="mh-right">
        {/* Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          id="btn-theme-toggle"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-icon theme-icon-sun" />
          ) : (
            <Moon size={18} className="theme-icon theme-icon-moon" />
          )}
        </button>

        {/* Profile Avatar + Dropdown */}
        {user && (
          <div className="mh-profile" ref={dropdownRef}>
            <button
              className="mh-avatar-btn"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="Toggle profile menu"
              aria-expanded={showDropdown}
              id="btn-mobile-profile"
            >
              {userInitial}
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="mh-dropdown-backdrop"
                  onClick={() => setShowDropdown(false)}
                  aria-hidden="true"
                />

                {/* Dropdown */}
                <div className="mh-dropdown animate-slide-down">
                  <div className="mh-dropdown-header">
                    <div className="mh-dropdown-avatar">{userInitial}</div>
                    <div>
                      <p className="mh-dropdown-name">{user.fullName}</p>
                      <p className="mh-dropdown-email">{user.email}</p>
                    </div>
                  </div>

                  <div className="mh-dropdown-divider" />

                  <Link
                    href="/settings"
                    className="mh-dropdown-item"
                    onClick={() => setShowDropdown(false)}
                    id="btn-mobile-settings"
                  >
                    <Settings size={15} />
                    <span>Pengaturan</span>
                  </Link>

                  <div className="mh-dropdown-divider" />

                  <button
                    className="mh-dropdown-item mh-logout-btn"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    id="btn-mobile-logout"
                  >
                    <LogOut size={15} />
                    <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Mobile header is shown via globals.css at max-width: 768px */
        .mh-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .mh-logo-link {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          min-height: 44px;
        }
        .mh-logo {
          height: 46px;
          width: auto;
          object-fit: contain;
        }
        .mh-title-wrap {
          min-width: 0;
        }
        .mh-page-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mh-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        /* Theme toggle override min-height from global */
        :global(.theme-toggle-btn) {
          min-height: unset !important;
        }

        /* Theme icon animations */
        .theme-icon {
          transition: transform 0.3s ease, opacity 0.2s ease;
        }
        .theme-icon-sun {
          color: #f59e0b;
        }
        .theme-icon-moon {
          color: #818cf8;
        }

        /* Profile */
        .mh-profile {
          position: relative;
        }
        .mh-avatar-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          border: 2px solid rgba(99,102,241,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
          min-height: unset;
        }
        .mh-avatar-btn:active {
          transform: scale(0.93);
        }

        /* Dropdown Backdrop */
        .mh-dropdown-backdrop {
          position: fixed;
          inset: 0;
          z-index: 48;
        }

        /* Dropdown */
        .mh-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          z-index: 60;
        }
        .mh-dropdown-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 14px 12px;
          background: var(--bg-elevated);
        }
        .mh-dropdown-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .mh-dropdown-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .mh-dropdown-email {
          font-size: 11px;
          color: var(--text-muted);
          margin: 1px 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .mh-dropdown-divider {
          height: 1px;
          background: var(--border-default);
          width: 100%;
        }
        .mh-dropdown-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background var(--transition-fast), color var(--transition-fast);
          min-height: 48px;
        }
        .mh-dropdown-item:active,
        .mh-dropdown-item:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .mh-logout-btn {
          color: var(--error);
        }
        .mh-logout-btn:active,
        .mh-logout-btn:hover {
          background: var(--error-bg);
          color: var(--error);
        }
        .mh-logout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
