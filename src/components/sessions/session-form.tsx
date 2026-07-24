'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { scheduleSession } from '@/lib/actions/session'
import { Loader2, Calendar, Clock, MapPin } from 'lucide-react'

const formSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket'),
  scheduledAt: z.string().min(1, 'Tanggal & jam wajib diisi'),
  duration: z.coerce.number().min(15, 'Minimal 15 menit'),
  location: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export function SessionForm({ packages }: { packages: { id: string; name: string; clientName: string, remaining: number }[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      duration: 60,
    }
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const res = await scheduleSession(data)
    if (res.success) {
      router.push('/session')
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
        <h3 className="detail-section-title">Detail Jadwal Sesi</h3>
        
        <div className="detail-grid">
          {/* Paket & Client */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Paket & Client</label>
            <select className="input-field" {...register('packageId')}>
              <option value="">Pilih Paket (Sisa Kuota)</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {p.name} (Sisa {p.remaining} sesi)
                </option>
              ))}
            </select>
            {errors.packageId && <span className="form-error">{errors.packageId.message}</span>}
          </div>

          {/* Waktu */}
          <div className="form-group">
            <label className="form-label">Tanggal & Jam</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="datetime-local" className="input-field" style={{ paddingLeft: '36px' }} {...register('scheduledAt')} />
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.scheduledAt && <span className="form-error">{errors.scheduledAt.message}</span>}
          </div>

          {/* Durasi */}
          <div className="form-group">
            <label className="form-label">Durasi (Menit)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="number" className="input-field" style={{ paddingLeft: '36px' }} {...register('duration')} />
              <Clock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.duration && <span className="form-error">{errors.duration.message}</span>}
          </div>

          {/* Lokasi */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Lokasi (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="text" placeholder="Misal: Gym Utama, Area Functional" className="input-field" style={{ paddingLeft: '36px' }} {...register('location')} />
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
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
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : 'Jadwalkan Sesi'}
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
