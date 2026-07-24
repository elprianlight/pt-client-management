'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createExercise } from '@/lib/actions/workout'
import { Loader2, Dumbbell, AlignLeft, Link as LinkIcon, AlertCircle } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2, 'Nama gerakan wajib diisi'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  instructions: z.string().optional(),
  videoUrl: z.string().url('URL Video tidak valid').optional().or(z.literal('')),
})

type FormData = z.infer<typeof formSchema>

export function ExerciseForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      difficulty: 'beginner',
    }
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const res = await createExercise(data)
    if (res.success) {
      router.push('/workout')
    } else {
      setError(res.error || 'Terjadi kesalahan')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="detail-view">
      {error && (
        <div className="login-error animate-fade-in" style={{ padding: '12px', background: 'var(--error-bg)', color: 'var(--error)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="detail-section">
        <h3 className="detail-section-title">Detail Gerakan</h3>
        
        <div className="detail-grid">
          {/* Nama Gerakan */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Nama Gerakan</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="text" placeholder="Misal: Barbell Bench Press" className="input-field" style={{ paddingLeft: '36px' }} {...register('name')} />
              <Dumbbell size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          {/* Kesulitan */}
          <div className="form-group">
            <label className="form-label">Tingkat Kesulitan</label>
            <select className="input-field" {...register('difficulty')}>
              <option value="beginner">Pemula (Beginner)</option>
              <option value="intermediate">Menengah (Intermediate)</option>
              <option value="advanced">Lanjutan (Advanced)</option>
            </select>
            {errors.difficulty && <span className="form-error">{errors.difficulty.message}</span>}
          </div>

          {/* Video URL */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">URL Video Tutorial (Opsional)</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <input type="text" placeholder="https://youtube.com/..." className="input-field" style={{ paddingLeft: '36px' }} {...register('videoUrl')} />
              <LinkIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
            {errors.videoUrl && <span className="form-error">{errors.videoUrl.message}</span>}
          </div>

          {/* Instruksi */}
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Instruksi Eksekusi</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <textarea placeholder="Langkah-langkah melakukan gerakan yang benar..." className="input-field" style={{ paddingLeft: '36px', minHeight: '100px', paddingTop: '12px' }} {...register('instructions')} />
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
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : 'Tambah Gerakan'}
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
