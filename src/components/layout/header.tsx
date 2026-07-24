'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Bell, Search, Menu, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

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

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname.startsWith(key)
  )?.[1] ?? 'Dashboard'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    router.push('/login')
  }

  return (
    <header className={cn('header', className)}>
      {/* Left */}
      <div className="header-left">
        <button
          className="header-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="header-title">{pageTitle}</h1>
          <p className="header-greeting">
            {getGreeting()}, {user?.fullName?.split(' ')[0] ?? 'User'} 👋
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="header-right">
        {/* Search */}
        <div className="header-search">
          <Search size={14} className="header-search-icon" />
          <input
            type="text"
            placeholder="Cari client, sesi..."
            className="header-search-input"
            id="header-search"
            aria-label="Pencarian global"
          />
          <kbd className="header-search-kbd">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button
          className="header-icon-btn"
          aria-label="Notifikasi"
          id="btn-notifications"
        >
          <Bell size={18} />
          <span className="header-notif-dot" aria-hidden="true" />
        </button>

        {/* Avatar & Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-avatar"
            aria-label="Profil pengguna"
            id="btn-user-menu"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </button>
          
          {dropdownOpen && (
            <div className="header-dropdown animate-fade-in">
              <div className="header-dropdown-header">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <div className="divider" style={{ margin: '4px 0' }} />
              <button className="header-dropdown-item text-error" onClick={handleLogout}>
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header {
          height: var(--header-height);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-menu-btn {
          display: none;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .header-menu-btn:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .header-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .header-greeting {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Search */
        .header-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 7px 12px;
          width: 220px;
          transition: all var(--transition-fast);
        }
        .header-search:focus-within {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
        }
        .header-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .header-search-input {
          background: none;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--text-primary);
          width: 100%;
          font-family: 'Inter', sans-serif;
        }
        .header-search-input::placeholder {
          color: var(--text-muted);
        }
        .header-search-kbd {
          font-size: 10px;
          color: var(--text-muted);
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: 4px;
          padding: 1px 5px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Icon Buttons */
        .header-icon-btn {
          position: relative;
          width: 36px;
          height: 36px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .header-icon-btn:hover {
          background: var(--bg-overlay);
          color: var(--text-primary);
          border-color: var(--border-strong);
        }
        .header-notif-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 7px;
          height: 7px;
          background: var(--brand-primary);
          border-radius: 50%;
          border: 2px solid var(--bg-elevated);
        }

        /* Avatar */
        .header-avatar {
          width: 36px;
          height: 36px;
          background: var(--gradient-brand);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          color: white;
          cursor: pointer;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
        }
        .header-avatar:hover {
          opacity: 0.85;
          transform: scale(1.05);
        }
        
        .header-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          min-width: 180px;
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          padding: 8px;
          z-index: 100;
        }
        .header-dropdown-header {
          padding: 8px;
        }
        .header-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 13px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
        }
        .header-dropdown-item:hover {
          background: var(--bg-overlay);
          color: var(--text-primary);
        }
        .text-error {
          color: var(--error) !important;
        }
        .text-error:hover {
          background: var(--error-bg) !important;
        }

        @media (max-width: 1024px) {
          .header-menu-btn { display: flex; }
          .header-search { display: none; }
        }
        @media (max-width: 640px) {
          .header { padding: 0 16px; }
          .header-greeting { display: none; }
        }
      `}</style>
    </header>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}
