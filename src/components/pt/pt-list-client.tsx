'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCheck, Plus, MoreVertical, Pencil, PowerOff, Power, Eye } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { togglePTStatus } from '@/lib/actions/pt'
import { formatDate } from '@/lib/utils'
import type { listPTs } from '@/lib/actions/pt'

type PT = Awaited<ReturnType<typeof listPTs>>[number]

interface PTListClientProps {
  initialData: PT[]
  totalCount: number
}

export function PTListClient({ initialData, totalCount }: PTListClientProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleToggleStatus = async (pt: PT) => {
    const newStatus = !pt.user?.isActive
    setLoadingId(pt.id)
    try {
      const result = await togglePTStatus(pt.id, newStatus)
      if (result.success) {
        setData(prev => prev.map(p =>
          p.id === pt.id ? { ...p, user: p.user ? { ...p.user, isActive: newStatus } : p.user } : p
        ))
      }
    } finally {
      setLoadingId(null)
      setOpenMenuId(null)
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'Nama',
      render: (row: PT) => (
        <div className="pt-name-cell">
          <div className="avatar-circle">
            {(row.user?.fullName?.[0] ?? 'P').toUpperCase()}
          </div>
          <div>
            <div className="cell-primary">{row.user?.fullName ?? '—'}</div>
            <div className="cell-secondary">@{row.user?.username ?? '—'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'No. HP',
      render: (row: PT) => <span className="cell-secondary">{row.user?.phone ?? '—'}</span>
    },
    {
      key: 'specialization',
      label: 'Spesialisasi',
      render: (row: PT) => <span>{row.specialization ?? '—'}</span>
    },
    {
      key: 'experienceYears',
      label: 'Pengalaman',
      render: (row: PT) => row.experienceYears != null
        ? <span>{row.experienceYears} tahun</span>
        : <span className="cell-secondary">—</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: PT) => (
        <span className={`badge ${row.user?.isActive ? 'badge-success' : 'badge-error'}`}>
          {row.user?.isActive ? 'Aktif' : 'Non-aktif'}
        </span>
      )
    },
    {
      key: 'lastLogin',
      label: 'Login Terakhir',
      render: (row: PT) => (
        <span className="cell-secondary">
          {row.user?.lastLoginAt ? formatDate(row.user.lastLoginAt) : 'Belum pernah'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      width: '60px',
      render: (row: PT) => (
        <div className="action-menu-wrapper">
          <button
            className="action-menu-btn"
            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === row.id ? null : row.id) }}
          >
            <MoreVertical size={15} />
          </button>
          {openMenuId === row.id && (
            <div className="action-menu" onClick={e => e.stopPropagation()}>
              <button className="action-menu-item" onClick={() => router.push(`/pt/${row.id}`)}>
                <Eye size={13} /> Detail
              </button>
              <button className="action-menu-item" onClick={() => router.push(`/pt/${row.id}?edit=true`)}>
                <Pencil size={13} /> Edit
              </button>
              <div className="action-menu-divider" />
              <button
                className={`action-menu-item ${row.user?.isActive ? 'action-menu-danger' : 'action-menu-success'}`}
                onClick={() => handleToggleStatus(row)}
                disabled={loadingId === row.id}
              >
                {row.user?.isActive ? <PowerOff size={13} /> : <Power size={13} />}
                {row.user?.isActive ? 'Non-aktifkan' : 'Aktifkan'}
              </button>
            </div>
          )}
        </div>
      )
    },
  ]

  return (
    <div className="stagger-children">
      <PageHeader
        title="Personal Trainer"
        description={`${totalCount} trainer terdaftar`}
        icon={UserCheck}
        action={{
          label: 'Tambah PT',
          icon: Plus,
          onClick: () => router.push('/pt/new'),
        }}
      />

      <div className="glass-card">
        <DataTable
          data={data.map(pt => ({ ...pt, id: pt.id }))}
          columns={columns}
          searchPlaceholder="Cari nama atau username PT..."
          emptyMessage="Belum ada Personal Trainer. Klik 'Tambah PT' untuk menambahkan."
        />
      </div>

      <style jsx global>{`
        .pt-name-cell { display: flex; align-items: center; gap: 10px; }
        .avatar-circle {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white;
          flex-shrink: 0;
        }
        .cell-primary { font-size: 13.5px; font-weight: 500; color: var(--text-primary); }
        .cell-secondary { font-size: 12.5px; color: var(--text-muted); }

        .action-menu-wrapper { position: relative; }
        .action-menu-btn {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none;
          border-radius: var(--radius-sm);
          color: var(--text-muted); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .action-menu-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .action-menu {
          position: absolute; right: 0; top: calc(100% + 4px); z-index: 50;
          min-width: 160px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 4px;
          animation: fadeIn 0.1s ease;
        }
        .action-menu-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 10px;
          background: none; border: none; border-radius: 6px;
          color: var(--text-secondary); font-size: 13px;
          cursor: pointer; text-align: left;
          transition: all var(--transition-fast);
        }
        .action-menu-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .action-menu-danger { color: var(--error) !important; }
        .action-menu-danger:hover { background: var(--error-bg) !important; }
        .action-menu-success { color: var(--success) !important; }
        .action-menu-success:hover { background: rgba(16,185,129,0.08) !important; }
        .action-menu-divider { height: 1px; background: var(--border-default); margin: 4px 0; }

        .glass-card { padding: 20px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
