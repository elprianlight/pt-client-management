'use client'

import { DataTable } from '@/components/ui/data-table'
import { Calendar, User, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function ProgressList({ data }: { data: any[] }) {
  const columns = [
    {
      label: 'Tanggal Pengukuran',
      key: 'measuredAt',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 500 }}>
          <Calendar size={14} className="text-brand" />
          {format(new Date(row.measuredAt), 'dd MMM yyyy', { locale: id })}
        </div>
      ),
    },
    {
      label: 'Klien',
      key: 'clientName',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <User size={14} />
          {row.clientName}
        </div>
      ),
    },
    {
      label: 'Berat Badan (kg)',
      key: 'weight',
      render: (row: any) => (
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {row.weight} kg
        </span>
      ),
    },
    {
      label: 'Body Fat (%)',
      key: 'bodyFatPercentage',
      render: (row: any) => (
        <span style={{ color: row.bodyFatPercentage ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {row.bodyFatPercentage ? `${row.bodyFatPercentage} %` : '-'}
        </span>
      ),
    },
    {
      label: 'Catatan',
      key: 'notes',
      render: (row: any) => (
        <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
          {row.notes || '-'}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={data} searchKey="clientName" />
}
