'use client'

import { DataTable } from '@/components/ui/data-table'
import { Calendar, CheckCircle, Clock, MapPin, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { listSessions, completeSession } from '@/lib/actions/session'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function SessionList() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const res = await listSessions()
    setData(res)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleComplete = async (sessionId: string) => {
    if (!confirm('Tandai sesi ini sebagai selesai? Ini akan memotong kuota paket client.')) return

    setProcessingId(sessionId)
    const res = await completeSession(sessionId)
    if (res.success) {
      await loadData()
    } else {
      alert(res.error || 'Gagal menyelesaikan sesi')
    }
    setProcessingId(null)
  }

  const columns = [
    {
      label: 'Jadwal',
      key: 'scheduledAt',
      render: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {format(new Date(row.scheduledAt), 'dd MMM yyyy', { locale: id })}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> {format(new Date(row.scheduledAt), 'HH:mm')} ({row.duration} mnt)
          </span>
        </div>
      ),
    },
    {
      label: 'Client',
      key: 'clientName',
      render: (row: any) => (
        <div>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.clientName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.packageName}</div>
        </div>
      ),
    },
    {
      label: 'Lokasi',
      key: 'location',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
          <MapPin size={14} />
          {row.location || '-'}
        </div>
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (row: any) => {
        let badgeClass = 'badge-brand'
        let label = 'Scheduled'
        
        if (row.status === 'completed') { badgeClass = 'badge-success'; label = 'Selesai' }
        if (row.status === 'cancelled') { badgeClass = 'badge-error'; label = 'Batal' }
        if (row.status === 'rescheduled') { badgeClass = 'badge-warning'; label = 'Reschedule' }
        if (row.status === 'no_show') { badgeClass = 'badge-error'; label = 'No Show' }

        return <span className={`badge ${badgeClass}`}>{label}</span>
      },
    },
    {
      label: 'Aksi',
      key: 'actions',
      render: (row: any) => {
        if (row.status === 'scheduled') {
          return (
            <button
              onClick={() => handleComplete(row.id)}
              disabled={processingId === row.id}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {processingId === row.id ? <Loader2 size={14} className="spin" /> : <><CheckCircle size={14} /> Selesaikan</>}
            </button>
          )
        }
        return <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
      },
    },
  ]

  if (isLoading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={24} className="spin" style={{ color: 'var(--brand-primary)' }} />
      </div>
    )
  }

  return <DataTable columns={columns} data={data} searchKey="clientName" />
}
