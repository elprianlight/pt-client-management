'use client'

import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
}

export function PageHeader({ title, description, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="page-header animate-fade-in-up">
      <div className="page-header-left">
        {Icon && (
          <div className="page-header-icon">
            <Icon size={20} strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h2 className="page-header-title">{title}</h2>
          {description && <p className="page-header-desc">{description}</p>}
        </div>
      </div>
      {action && (
        <button className="btn-primary page-header-btn" onClick={action.onClick}>
          {action.icon && <action.icon size={15} strokeWidth={2} />}
          {action.label}
        </button>
      )}

      <style jsx>{`
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .page-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .page-header-icon {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--brand-primary);
          flex-shrink: 0;
        }
        .page-header-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .page-header-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 3px;
        }
        .page-header-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 16px;
          font-size: 13.5px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  )
}
