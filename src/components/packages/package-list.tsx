'use client'

import { DataTable } from '@/components/ui/data-table'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Kita ambil server action secara dinamis di dalam komponen client ini
// Atau bisa saja menggunakan Server Component untuk fetch dan pass ke Client Component
// Namun untuk kesederhanaan re-render, kita fetch di useEffect untuk saat ini.
import { listPackages, deletePackage } from '@/lib/actions/package'

export function PackageList() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    listPackages().then(res => {
      setData(res)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (id: string, packageName: string) => {
    if (!confirm(`Yakin ingin menghapus paket "${packageName}"? Semua sesi yang terhubung dengan paket ini juga akan ikut terhapus.`)) return
    
    setDeletingId(id)
    try {
      const res = await deletePackage(id)
      if (res.success) {
        fetchData()
      } else {
        alert(res.error || 'Gagal menghapus paket')
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  const columns = [
    { key: 'packageName', label: 'Nama Paket' },
    { key: 'clientName', label: 'Client' },
    { 
      key: 'sessions', 
      label: 'Sesi',
      render: (row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{row.usedSessions} / {row.totalSessions} Terpakai</span>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${(row.usedSessions / row.totalSessions) * 100}%`, height: '100%', background: 'var(--brand-primary)', borderRadius: '2px' }} />
          </div>
        </div>
      )
    },
    { 
      key: 'totalPrice', 
      label: 'Total Harga',
      render: (row: any) => `Rp ${new Intl.NumberFormat('id-ID').format(Number(row.totalPrice))}`
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (row: any) => {
        const isExpired = new Date(row.expiresAt) < new Date()
        const isFinished = row.usedSessions >= row.totalSessions
        if (isFinished) return <span className="badge badge-error">Selesai</span>
        if (isExpired) return <span className="badge badge-error">Kedaluwarsa</span>
        return <span className="badge badge-success">Aktif</span>
      }
    },
    { 
      key: 'actions', 
      label: 'Aksi',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link href={`/packages/${row.id}/edit`} className="action-btn" title="Edit Paket">
            <Edit size={16} />
          </Link>
          <button 
            onClick={() => handleDelete(row.id, row.packageName)}
            className="action-btn action-btn-danger"
            disabled={deletingId === row.id}
            title="Hapus Paket"
          >
            {deletingId === row.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="package-list">
      <DataTable 
        data={data} 
        columns={columns} 
        isLoading={loading}
        searchPlaceholder="Cari paket atau client..."
      />
      <style jsx>{`
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
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
