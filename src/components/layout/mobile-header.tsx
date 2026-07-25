'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/client'
import { User, Settings, LogOut } from 'lucide-react'

export function MobileHeader() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const userInitial = user?.fullName?.charAt(0).toUpperCase() || 'U'

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
      <Link href="/dashboard" className="mobile-header-logo">
        <img src="/logo.png" alt="Logo" style={{ height: '60px', width: 'auto', objectFit: 'contain' }} />
      </Link>

      {user && (
        <div className="mobile-header-profile" ref={dropdownRef}>
          <button 
            className="profile-avatar-btn" 
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Toggle profile menu"
          >
            {userInitial}
          </button>

          {showDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <p className="user-name">{user.fullName}</p>
              </div>
              <div className="dropdown-divider" />
              <Link href="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <User size={14} />
                <span>Profile</span>
              </Link>
              <Link href="/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                <Settings size={14} />
                <span>Pengaturan</span>
              </Link>
              <div className="dropdown-divider" />
              <button 
                className="dropdown-item logout-btn" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={14} />
                <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0px 16px;
            position: sticky;
            top: 0;
            z-index: 40;
            background: var(--bg-surface);
            border-bottom: 1px solid var(--border-default);
          }
        }
        
        .mobile-header-profile {
          position: relative;
        }
        
        .profile-avatar-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: transform var(--transition-fast);
        }
        .profile-avatar-btn:active {
          transform: scale(0.95);
        }
        
        .profile-dropdown {
          position: absolute;
          top: 44px;
          right: 0;
          width: 160px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideDown 0.2s ease-out;
          z-index: 50;
        }
        
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .dropdown-header {
          padding: 8px 12px;
          background: rgba(0,0,0,0.02);
        }
        
        .user-name {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dropdown-divider {
          height: 1px;
          background: var(--border-default);
          width: 100%;
        }
        
        .dropdown-item {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          padding: 10px 12px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .dropdown-item:active {
          background: var(--bg-overlay);
        }
        
        .logout-btn {
          color: var(--error);
        }
      `}</style>
    </div>
  )
}
