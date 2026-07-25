'use client'

import Link from 'next/link'

export function MobileHeader() {
  return (
    <div className="mobile-header">
      <Link href="/dashboard" className="mobile-header-logo">
        <img src="/logo.png" alt="Logo" style={{ height: '77px', width: 'auto', objectFit: 'contain' }} />
      </Link>

      <style jsx>{`
        .mobile-header {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
            align-items: center;
            padding: 0px 16px;
            position: sticky;
            top: 0;
            z-index: 40;
            background: var(--bg-surface);
            border-bottom: 1px solid var(--border-default);
          }
        }
      `}</style>
    </div>
  )
}
