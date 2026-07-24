'use client'

import { DataTable } from '@/components/ui/data-table'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Kita ambil server action secara dinamis di dalam komponen client ini
// Atau bisa saja menggunakan Server Component untuk fetch dan pass ke Client Component
// Namun untuk kesederhanaan re-render, kita fetch di useEffect untuk saat ini.
import { listPackages } from '@/lib/actions/package'

export function PackageList() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listPackages().then(res => {
      setData(res)
      setLoading(false)
    })
  }, [])

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
    </div>
  )
}
