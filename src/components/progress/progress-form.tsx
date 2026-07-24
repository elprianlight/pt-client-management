'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { logMeasurement } from '@/lib/actions/progress'
import { Loader2, Calendar, User, AlignLeft, Activity } from 'lucide-react'

const formSchema = z.object({
  clientId: z.string().min(1, 'Pilih client'),
  measuredAt: z.string().min(1, 'Tanggal wajib diisi'),
  weight: z.coerce.number().min(20, 'Berat tidak valid').max(300, 'Berat tidak valid'),
  bodyFatPercentage: z.coerce.number().min(1).max(70).optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function ProgressForm({ clients }: { clients: { id: string; name: string }[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      measuredAt: new Date().toISOString().split('T')[0],
    }
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const res = await logMeasurement(data)
    if (res.success) {
      router.push('/progress')
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
        <h3 className="detail-section-title">Data Pengukuran</h3>
        
        <div className="detail-grid">
          {/* Client */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Klien</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '36px' }} {...register('clientId')}>
                <option value="">Pilih Client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.clientId && <span className="form-error">{errors.clientId.message}</span>}
          </div>

          {/* Tanggal */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Tanggal Pengukuran</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="date" className="input-field" style={{ paddingLeft: '36px' }} {...register('measuredAt')} />
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.measuredAt && <span className="form-error">{errors.measuredAt.message}</span>}
          </div>

          {/* Berat Badan */}
          <div className="form-group">
            <label className="form-label">Berat Badan (kg)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="number" step="0.1" className="input-field" style={{ paddingLeft: '36px' }} {...register('weight')} />
              <Activity size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.weight && <span className="form-error">{errors.weight.message}</span>}
          </div>

          {/* Body Fat */}
          <div className="form-group">
            <label className="form-label">Body Fat % (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="number" step="0.1" className="input-field" style={{ paddingLeft: '36px' }} {...register('bodyFatPercentage')} />
              <Activity size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.bodyFatPercentage && <span className="form-error">{errors.bodyFatPercentage.message}</span>}
          </div>

          {/* Deskripsi */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Catatan</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <textarea placeholder="Catatan tambahan seputar progress..." className="input-field" style={{ paddingLeft: '36px', minHeight: '80px', paddingTop: '12px' }} {...register('notes')} />
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
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : 'Simpan Progress'}
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
