'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createProgram } from '@/lib/actions/workout'
import { Loader2, Dumbbell, AlignLeft, Calendar, User } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2, 'Nama program wajib diisi'),
  description: z.string().optional(),
  durationWeeks: z.coerce.number().min(1, 'Minimal 1 minggu'),
  clientId: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof formSchema>

export function ProgramForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      durationWeeks: 4,
    }
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const res = await createProgram(data)
    if (res.success) {
      router.push('/workout?tab=programs')
    } else {
      setError(res.error || 'Terjadi kesalahan')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="detail-view">
      {error && (
        <div className="login-error animate-fade-in" style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}

      <div className="detail-section">
        <h3 className="detail-section-title">Detail Program Latihan</h3>
        
        <div className="detail-grid">
          {/* Nama Program */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Nama Program</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="text" placeholder="Misal: Hypertrophy 4 Weeks" className="input-field" style={{ paddingLeft: '36px' }} {...register('name')} />
              <Dumbbell size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          {/* Klien (Opsional) */}
          <div className="form-group">
            <label className="form-label">Klien (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '36px' }} {...register('clientId')}>
                <option value="">Jadikan Template Umum</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Durasi */}
          <div className="form-group">
            <label className="form-label">Durasi (Minggu)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="number" min="1" className="input-field" style={{ paddingLeft: '36px' }} {...register('durationWeeks')} />
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.durationWeeks && <span className="form-error">{errors.durationWeeks.message}</span>}
          </div>

          {/* Deskripsi */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Deskripsi & Tujuan</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <textarea placeholder="Tujuan dari program ini..." className="input-field" style={{ paddingLeft: '36px', minHeight: '80px', paddingTop: '12px' }} {...register('description')} />
              <AlignLeft size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="divider" style={{ margin: '24px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Batal
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : 'Simpan Program'}
        </button>
      </div>

      <style jsx>{`
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        .form-error { font-size: 12px; color: var(--error); }
      `}</style>
    </form>
  )
}
