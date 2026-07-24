'use client'

import { DataTable } from '@/components/ui/data-table'
import { Calendar, Dumbbell, User } from 'lucide-react'

export function ProgramList({ data }: { data: any[] }) {
  const columns = [
    {
      label: 'Program Latihan',
      key: 'name',
      render: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Dumbbell size={14} className="text-brand" />
            {row.name}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Durasi: {row.durationWeeks} Minggu
          </span>
        </div>
      ),
    },
    {
      label: 'Klien',
      key: 'clientName',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <User size={14} />
          {row.clientName || 'Template (Semua)'}
        </div>
      ),
    },
    {
      label: 'Deskripsi',
      key: 'description',
      render: (row: any) => (
        <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
          {row.description || '-'}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={data} searchKey="name" />
}
