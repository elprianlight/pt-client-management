'use client'

import { DataTable } from '@/components/ui/data-table'
import { Calendar, CheckCircle, Clock, MapPin, Loader2, Trash2, Edit, Search } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { listSessions, updateSessionStatus, deleteSession } from '@/lib/actions/session'
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

  const handleStatusChange = async (sessionId: string, status: any) => {
    let msg = `Ubah status sesi?`
    if (status === 'completed') msg = 'Tandai sesi ini sebagai selesai? Ini akan memotong kuota paket client.'
    if (!confirm(msg)) return

    setProcessingId(sessionId)
    const res = await updateSessionStatus(sessionId, status)
    if (res.success) {
      await loadData()
    } else {
      alert(res.error || 'Gagal memperbarui status sesi')
    }
    setProcessingId(null)
  }

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini? Tindakan ini tidak dapat dibatalkan.')) return
    
    setProcessingId(sessionId)
    const res = await deleteSession(sessionId)
    if (res.success) {
      await loadData()
    } else {
      alert(res.error || 'Gagal menghapus sesi')
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
      label: 'Detail Latihan',
      key: 'programType',
      render: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {row.programType ? (
            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '13px' }}>
              {row.programType} {row.rpe ? `(RPE: ${row.rpe})` : ''}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>-</span>
          )}
          {row.location && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={12} /> {row.location}
            </span>
          )}
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
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              className="input" 
              style={{ padding: '4px 8px', fontSize: '12px', width: 'auto', minWidth: '110px' }}
              value={row.status}
              disabled={processingId === row.id}
              onChange={(e) => handleStatusChange(row.id, e.target.value)}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Batal</option>
              <option value="rescheduled">Reschedule</option>
              <option value="no_show">No Show</option>
            </select>
            
            <Link href={`/session/${row.id}/edit`} className="action-btn" title="Edit Sesi">
              <Edit size={16} />
            </Link>

            <button onClick={() => handleDelete(row.id)} disabled={processingId === row.id} className="action-btn action-btn-danger" title="Hapus Sesi">
              {processingId === row.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
            </button>
          </div>
        )
      },
    },
  ]

  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedPackage, setSelectedPackage] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const uniqueClients = useMemo(() => {
    const clients = new Set<string>()
    data.forEach(item => {
      if (item.clientName) {
        clients.add(item.clientName)
      }
    })
    return Array.from(clients).sort()
  }, [data])

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>()
    data.forEach(item => {
      if (item.scheduledAt) {
        months.add(format(new Date(item.scheduledAt), 'yyyy-MM'))
      }
    })
    return Array.from(months).sort().reverse() // Newest first
  }, [data])

  const packageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    data.forEach(item => {
      if (item.packageName) {
        counts[item.packageName] = (counts[item.packageName] || 0) + 1
      }
    })
    // Sort packages by count ascending (sesi paling sedikit)
    return Object.entries(counts).sort((a, b) => a[1] - b[1])
  }, [data])

  const filteredData = useMemo(() => {
    let result = data
    if (searchQuery) {
      const term = searchQuery.toLowerCase()
      result = result.filter(row =>
        Object.values(row).some(val =>
          typeof val === 'string' && val.toLowerCase().includes(term)
        )
      )
    }
    if (selectedMonth) {
      result = result.filter(row => {
        const date = new Date(row.scheduledAt)
        return format(date, 'yyyy-MM') === selectedMonth
      })
    }
    if (selectedClient) {
      result = result.filter(row => row.clientName === selectedClient)
    }
    if (selectedPackage) {
      result = result.filter(row => row.packageName === selectedPackage)
    }
    return result
  }, [data, selectedMonth, selectedPackage, selectedClient, searchQuery])

  if (isLoading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
        <Loader2 size={24} className="spin" style={{ color: 'var(--brand-primary)' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Client</label>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '8px 12px', fontSize: '13px' }}
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="">Semua Client</option>
            {uniqueClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Bulan</label>
          <select 
            className="input-field" 
            style={{ width: '180px', padding: '8px 12px', fontSize: '13px' }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Semua Bulan</option>
            {uniqueMonths.map(m => {
              const [year, month] = m.split('-')
              const date = new Date(parseInt(year), parseInt(month) - 1, 1)
              return <option key={m} value={m}>{format(date, 'MMMM yyyy', { locale: id })}</option>
            })}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Filter Paket (Sesi Terurut)</label>
          <select 
            className="input-field" 
            style={{ width: '240px', padding: '8px 12px', fontSize: '13px' }}
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
          >
            <option value="">Semua Paket</option>
            {packageCounts.map(([pkg, count]) => (
              <option key={pkg} value={pkg}>{pkg} ({count} sesi)</option>
            ))}
          </select>
        </div>
        <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Cari</label>
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Cari client, paket..." 
              style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} searchable={false} />
      <style jsx>{`
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
        }
        .action-btn-danger:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border-color: rgba(239, 68, 68, 0.3);
        }
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
