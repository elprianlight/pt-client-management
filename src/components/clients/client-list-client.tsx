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
          <div className="avatar-circle avatar-client">
            {(row.user?.fullName?.[0] ?? 'C').toUpperCase()}
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
      label: '',
      width: '60px',
      render: (row: Client) => (
        <div className="action-menu-wrapper">
          <button
            className="action-menu-btn"
            onClick={e => { e.stopPropagation(); setOpenMenuId(openMenuId === row.id ? null : row.id) }}
          >
            <MoreVertical size={15} />
          </button>
          {openMenuId === row.id && (
            <div className="action-menu" onClick={e => e.stopPropagation()}>
              <button className="action-menu-item" onClick={() => router.push(`/clients/${row.id}`)}>
                <Eye size={13} /> Detail
              </button>
              <button className="action-menu-item" onClick={() => router.push(`/clients/${row.id}?edit=true`)}>
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
        .avatar-client {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4) !important;
        }
      `}</style>
    </div>
  )
}
