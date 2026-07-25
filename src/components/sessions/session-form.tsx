'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { scheduleSession, updateSessionData } from '@/lib/actions/session'
import { Loader2, Calendar, MapPin, Activity, PenLine } from 'lucide-react'

const formSchema = z.object({
  packageId: z.string().min(1, 'Pilih paket'),
  scheduledAt: z.string().min(1, 'Tanggal & jam wajib diisi'),
  programType: z.string().min(1, 'Pilih program latihan'),
  rpe: z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  sessionNotes: z.string().optional(),
  location: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

const programOptions = [
  'Upper Body', 'Lower Body', 'Total Body', 
  'Hybrid Training', 'Circuit Training', 
  'Cardio Training', 'Muaythai', 'Manual Input'
]

const rpeDescriptions = {
  1: 'Sangat Ringan (Bisa ngobrol santai)',
  2: 'Ringan (Ngobrol mudah)',
  3: 'Lumayan Ringan',
  4: 'Sedikit Keras',
  5: 'Sedang (Mulai berkeringat)',
  6: 'Lumayan Keras (Napas agak berat)',
  7: 'Keras (Susah bicara panjang)',
  8: 'Sangat Keras (Bicara terputus)',
  9: 'Hampir Maksimal (Hanya 1-2 kata)',
  10: 'Maksimal Usaha (Tidak bisa bicara)',
}

export function SessionForm({ packages, initialData }: { packages: { id: string; name: string; clientName: string, remaining: number }[], initialData?: any }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initialData
  
  const [isManualProgram, setIsManualProgram] = useState(() => {
    if (initialData?.programType) {
      return !programOptions.includes(initialData.programType)
    }
    return false
  })
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      packageId: initialData?.packageId || '',
      scheduledAt: initialData?.scheduledAt || '',
      programType: initialData?.programType || '',
      rpe: initialData?.rpe || '',
      sessionNotes: initialData?.sessionNotes || '',
      location: initialData?.location || '',
    }
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    
    let res
    if (isEdit) {
      res = await updateSessionData(initialData.id, data)
    } else {
      res = await scheduleSession(data)
    }

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
        <h3 className="detail-section-title">{isEdit ? 'Edit Detail Sesi (Otomatis 60 Menit)' : 'Detail Jadwal Sesi (Otomatis 60 Menit)'}</h3>
        
        <div className="detail-grid">
          {/* Paket & Client */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Paket & Client</label>
            <select className="input-field" disabled={isEdit} {...register('packageId')}>
              <option value="">Pilih Paket (Sisa Kuota)</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>
                  {p.clientName} — {p.name} {isEdit ? '' : `(Sisa ${p.remaining} sesi)`}
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

          {/* Program Latihan */}
          <div className="form-group">
            <label className="form-label">Program Latihan</label>
            {!isManualProgram ? (
              <select className="input-field" {...register('programType')} onChange={(e) => {
                if (e.target.value === 'Manual Input') {
                  setIsManualProgram(true)
                  setValue('programType', '')
                } else {
                  setValue('programType', e.target.value)
                }
              }}>
                <option value="">Pilih Program</option>
                {programOptions.map(opt => (
                  <option key={opt} value={opt}>{opt === 'Manual Input' ? 'Tulis Manual...' : opt}</option>
                ))}
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Ketik program manual..." 
                  className="input-field" 
                  autoFocus
                  {...register('programType')} 
                />
                <button type="button" onClick={() => { setIsManualProgram(false); setValue('programType', ''); }} className="btn-secondary" style={{ padding: '0 12px' }}>Batal</button>
              </div>
            )}
            {errors.programType && <span className="form-error">{errors.programType.message}</span>}
          </div>

          {/* RPE */}
          <div className="form-group">
            <label className="form-label">Catatan RPE (1-10)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <select className="input-field" style={{ paddingLeft: '36px' }} {...register('rpe')}>
                <option value="">Pilih Skala RPE (Opsional)</option>
                {Object.entries(rpeDescriptions).map(([val, desc]) => (
                  <option key={val} value={val}>RPE {val} - {desc}</option>
                ))}
              </select>
              <Activity size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.rpe && <span className="form-error">{errors.rpe.message}</span>}
          </div>

          {/* Lokasi */}
          <div className="form-group">
            <label className="form-label">Lokasi (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="text" placeholder="Misal: Gym Utama, Area Functional" className="input-field" style={{ paddingLeft: '36px' }} {...register('location')} />
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>
          
          {/* Notes */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Catatan / Notes (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <textarea 
                placeholder="Tambahkan catatan latihan..." 
                className="input-field" 
                style={{ paddingLeft: '36px', minHeight: '80px', paddingTop: '10px', resize: 'vertical' }} 
                {...register('sessionNotes')} 
              />
              <PenLine size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
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
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : (isEdit ? 'Simpan Perubahan' : 'Jadwalkan Sesi')}
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
