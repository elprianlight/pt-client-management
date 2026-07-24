'use client'

import { DataTable } from '@/components/ui/data-table'
import { Dumbbell, ExternalLink } from 'lucide-react'

export function ExerciseList({ data }: { data: any[] }) {
  const columns = [
    {
      label: 'Nama Gerakan',
      key: 'name',
      render: (row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: 'var(--text-primary)' }}>
          <Dumbbell size={14} className="text-muted" />
          {row.name}
        </div>
      ),
    },
    {
      label: 'Tingkat Kesulitan',
      key: 'difficulty',
      render: (row: any) => {
        let badgeClass = 'badge-brand'
        let label = 'Beginner'
        
        if (row.difficulty === 'intermediate') { badgeClass = 'badge-warning'; label = 'Intermediate' }
        if (row.difficulty === 'advanced') { badgeClass = 'badge-error'; label = 'Advanced' }

        return <span className={`badge ${badgeClass}`}>{label}</span>
      },
    },
    {
      label: 'Instruksi',
      key: 'instructions',
      render: (row: any) => (
        <div style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
          {row.instructions || '-'}
        </div>
      ),
    },
    {
      label: 'Video',
      key: 'videoUrl',
      render: (row: any) => {
        if (row.videoUrl) {
          return (
            <a href={row.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', gap: '4px' }}>
              <ExternalLink size={12} /> Tonton
            </a>
          )
        }
        return <span style={{ color: 'var(--text-muted)' }}>-</span>
      },
    },
  ]

  return <DataTable columns={columns} data={data} searchKey="name" />
}
