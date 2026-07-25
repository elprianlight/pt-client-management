'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, MoreVertical, Pencil, PowerOff, Power, Eye } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader } from '@/components/ui/page-header'
import { toggleClientStatus } from '@/lib/actions/client'
import { formatDate, calculateAge } from '@/lib/utils'
import type { listClients } from '@/lib/actions/client'

type Client = Awaited<ReturnType<typeof listClients>>[number]

interface ClientListClientProps {
  initialData: Client[]
  totalCount: number
}

export function ClientListClient({ initialData, totalCount }: ClientListClientProps) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const handleToggleStatus = async (client: Client) => {
    const newStatus = !client.user?.isActive
    setLoadingId(client.id)
    try {
      const result = await toggleClientStatus(client.id, newStatus)
      if (result.success) {
        setData(prev => prev.map(c =>
          c.id === client.id ? { ...c, user: c.user ? { ...c.user, isActive: newStatus } : c.user } : c
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
      render: (row: Client) => (
        <div className="pt-name-cell">
          <div className="cell-primary font-medium">{row.user?.fullName ?? '—'}</div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'No. HP',
      render: (row: Client) => <span className="cell-secondary">{row.user?.phone ?? '—'}</span>
    },
    {
      key: 'gender',
      label: 'L/P',
      render: (row: Client) => {
        const genderMap: Record<string, string> = { male: 'Laki-laki', female: 'Perempuan', other: 'Lainnya' }
        return <span>{row.gender ? genderMap[row.gender] ?? '—' : '—'}</span>
      }
    },
    {
      key: 'age',
      label: 'Usia',
      render: (row: Client) => (
        <span>{row.dateOfBirth ? `${calculateAge(row.dateOfBirth)} th` : '—'}</span>
      )
    },
    {
      key: 'weight',
      label: 'BB/TB',
      render: (row: Client) => (
        <span>
          {row.weightKg ? `${row.weightKg} kg` : '—'}
          {row.heightCm ? ` / ${row.heightCm} cm` : ''}
        </span>
      )
    },
    {
      key: 'joinedAt',
      label: 'Bergabung',
      render: (row: Client) => (
        <span className="cell-secondary">{row.joinedAt ? formatDate(row.joinedAt) : '—'}</span>
      )
    },
    {
      key: 'sessions_total',
      label: 'Sesi Dibeli',
      render: (row: Client) => <span>{row.packageStats?.total ?? 0}</span>
    },
    {
      key: 'sessions_used',
      label: 'Sesi Terpakai',
      render: (row: Client) => <span>{row.packageStats?.used ?? 0}</span>
    },
    {
      key: 'sessions_remaining',
      label: 'Sisa Sesi',
      render: (row: Client) => <span>{(row.packageStats?.total ?? 0) - (row.packageStats?.used ?? 0)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Client) => (
        <span className={`badge ${row.user?.isActive ? 'badge-success' : 'badge-error'}`}>
          {row.user?.isActive ? 'Aktif' : 'Non-aktif'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (row: Client) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            className="action-btn" 
            title="Detail Client"
            onClick={() => router.push(`/clients/${row.id}`)}
          >
            <Eye size={16} />
          </button>
          <button 
            className="action-btn" 
            title="Edit Client"
            onClick={() => router.push(`/clients/${row.id}?edit=true`)}
          >
            <Pencil size={16} />
          </button>
          <button
            className={`action-btn ${row.user?.isActive ? 'action-btn-danger' : 'action-btn-success'}`}
            title={row.user?.isActive ? 'Non-aktifkan' : 'Aktifkan'}
            onClick={() => handleToggleStatus(row)}
            disabled={loadingId === row.id}
          >
            {loadingId === row.id ? <Loader2 size={16} className="spin" /> : (row.user?.isActive ? <PowerOff size={16} /> : <Power size={16} />)}
          </button>
        </div>
      )
    },
  ]

  return (
    <div className="stagger-children">
      <PageHeader
        title="Client"
        description={`${totalCount} client terdaftar`}
        icon={Users}
        action={{
          label: 'Tambah Client',
          icon: Plus,
          onClick: () => router.push('/clients/new'),
        }}
      />

      <div className="glass-card">
        <DataTable
          data={data}
          columns={columns}
          searchPlaceholder="Cari nama, username, atau nomor HP..."
          emptyMessage="Belum ada client. Klik 'Tambah Client' untuk menambahkan."
        />
      </div>

      <style jsx global>{`
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-default);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn:hover:not(:disabled) {
          background: rgba(139, 92, 246, 0.1);
          color: var(--brand-primary);
          border-color: rgba(139, 92, 246, 0.3);
        }
        .action-btn-danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .action-btn-success:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
