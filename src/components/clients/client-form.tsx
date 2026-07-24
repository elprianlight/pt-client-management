'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient_action, updateClient } from '@/lib/actions/client'
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

const createSchema = z.object({
  username: z.string().min(3, 'Min 3 karakter').max(50).regex(/^[a-zA-Z0-9_]+$/, 'Hanya huruf, angka, underscore'),
  fullName: z.string().min(2, 'Nama lengkap wajib diisi').max(255),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password min 6 karakter'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  heightCm: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(100).max(250).optional()),
  weightKg: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(20).max(300).optional()),
  notes: z.string().optional(),
})

const updateSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap wajib diisi').max(255),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  heightCm: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(100).max(250).optional()),
  weightKg: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(20).max(300).optional()),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type UpdateForm = z.infer<typeof updateSchema>

// ─── Create Form ──────────────────────────────────────────────────────────────

interface ClientCreateFormProps {
  onSuccess?: () => void
}

export function ClientCreateForm({ onSuccess }: ClientCreateFormProps) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<CreateForm>({ // eslint-disable-line
    resolver: zodResolver(createSchema) as any,
  })

  const onSubmit = async (data: CreateForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await createClient_action(data)
      if (!result.success) { setError(result.error ?? 'Terjadi kesalahan.'); return }
      setSuccess(true)
      setTimeout(() => { if (onSuccess) onSuccess(); else router.push('/clients'); router.refresh() }, 1000)
    } catch { setError('Terjadi kesalahan.') }
    finally { setIsLoading(false) }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={(handleSubmit as any)(onSubmit)} className="client-form">
      {error && <div className="form-alert form-alert-error"><AlertCircle size={15} /><span>{error}</span></div>}
      {success && <div className="form-alert form-alert-success"><CheckCircle size={15} /><span>Client berhasil ditambahkan!</span></div>}

      <div className="form-section">
        <h3 className="form-section-title">Informasi Akun</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Username <span className="form-required">*</span></label>
            <input type="text" className={`input-field ${errors.username ? 'input-error' : ''}`} placeholder="contoh: budi_client" {...register('username')} />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap <span className="form-required">*</span></label>
            <input type="text" className={`input-field ${errors.fullName ? 'input-error' : ''}`} placeholder="contoh: Budi Santoso" {...register('fullName')} />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Nomor HP</label>
            <input type="tel" className="input-field" placeholder="08123456789" {...register('phone')} />
          </div>

          <div className="form-group">
            <label className="form-label">Password <span className="form-required">*</span></label>
            <div className="input-password-wrapper">
              <input type={showPassword ? 'text' : 'password'} className={`input-field ${errors.password ? 'input-error' : ''}`} placeholder="Min. 6 karakter" {...register('password')} />
              <button type="button" className="pw-toggle" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Data Fisik</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Jenis Kelamin</label>
            <select className="input-field" {...register('gender')}>
              <option value="">— Pilih —</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Lahir</label>
            <input type="date" className="input-field" {...register('dateOfBirth')} />
          </div>

          <div className="form-group">
            <label className="form-label">Tinggi Badan (cm)</label>
            <input type="number" min={100} max={250} className="input-field" placeholder="170" {...register('heightCm')} />
          </div>

          <div className="form-group">
            <label className="form-label">Berat Badan (kg)</label>
            <input type="number" min={20} max={300} step={0.1} className="input-field" placeholder="70" {...register('weightKg')} />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Catatan</label>
            <textarea className="input-field" placeholder="Catatan khusus..." rows={3} style={{ resize: 'vertical' }} {...register('notes')} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={isLoading}>Batal</button>
        <button type="submit" className="btn-primary" disabled={isLoading || success}>
          {isLoading ? <><Loader2 size={15} className="spin" /> Menyimpan...</> : 'Tambah Client'}
        </button>
      </div>

      <style jsx global>{`
        .client-form { display: flex; flex-direction: column; gap: 28px; }
        .form-section { display: flex; flex-direction: column; gap: 16px; }
        .form-section-title {
          font-size: 14px; font-weight: 600; color: var(--text-primary);
          padding-bottom: 10px; border-bottom: 1px solid var(--border-default);
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group-full { grid-column: span 2; }
        .form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        .form-required { color: var(--error); }
        .form-error { font-size: 12px; color: var(--error); }
        .form-actions {
          display: flex; justify-content: flex-end; gap: 10px;
          padding-top: 8px; border-top: 1px solid var(--border-default);
        }
        .form-alert {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; border-radius: var(--radius-md); font-size: 13px;
        }
        .form-alert-error { background: var(--error-bg); border: 1px solid rgba(239,68,68,0.25); color: var(--error); }
        .form-alert-success { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); color: var(--success); }
        .input-password-wrapper { position: relative; }
        .input-password-wrapper .input-field { padding-right: 44px; }
        .pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;
          display: flex; align-items: center; transition: color var(--transition-fast);
        }
        .pw-toggle:hover { color: var(--text-secondary); }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-group-full { grid-column: span 1; }
        }
      `}</style>
    </form>
  )
}

// ─── Edit Form ────────────────────────────────────────────────────────────────

interface ClientEditFormProps {
  clientId: string
  defaultValues?: Partial<UpdateForm>
  onSuccess?: () => void
}

export function ClientEditForm({ clientId, defaultValues, onSuccess }: ClientEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<UpdateForm>({ // eslint-disable-line
    resolver: zodResolver(updateSchema) as any,
    defaultValues: { ...defaultValues, isActive: defaultValues?.isActive ?? true }
  })

  const onSubmit = async (data: UpdateForm) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await updateClient(clientId, data)
      if (!result.success) { setError(result.error ?? 'Terjadi kesalahan.'); return }
      setSuccess(true)
      setTimeout(() => { if (onSuccess) onSuccess(); else router.push('/clients'); router.refresh() }, 1000)
    } catch { setError('Terjadi kesalahan.') }
    finally { setIsLoading(false) }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={(handleSubmit as any)(onSubmit)} className="client-form">
      {error && <div className="form-alert form-alert-error"><AlertCircle size={15} /><span>{error}</span></div>}
      {success && <div className="form-alert form-alert-success"><CheckCircle size={15} /><span>Data berhasil diperbarui!</span></div>}

      <div className="form-section">
        <h3 className="form-section-title">Informasi Akun</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Nama Lengkap <span className="form-required">*</span></label>
            <input type="text" className={`input-field ${errors.fullName ? 'input-error' : ''}`} {...register('fullName')} />
            {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Nomor HP</label>
            <input type="tel" className="input-field" {...register('phone')} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3 className="form-section-title">Data Fisik</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Jenis Kelamin</label>
            <select className="input-field" {...register('gender')}>
              <option value="">— Pilih —</option>
              <option value="male">Laki-laki</option>
              <option value="female">Perempuan</option>
              <option value="other">Lainnya</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tanggal Lahir</label>
            <input type="date" className="input-field" {...register('dateOfBirth')} />
          </div>

          <div className="form-group">
            <label className="form-label">Tinggi Badan (cm)</label>
            <input type="number" min={100} max={250} className="input-field" {...register('heightCm')} />
          </div>

          <div className="form-group">
            <label className="form-label">Berat Badan (kg)</label>
            <input type="number" min={20} max={300} step={0.1} className="input-field" {...register('weightKg')} />
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Catatan</label>
            <textarea className="input-field" rows={3} style={{ resize: 'vertical' }} {...register('notes')} />
          </div>

          <div className="form-group form-group-full">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" {...register('isActive')} />
              <span className="checkbox-text">Akun Aktif</span>
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={isLoading}>Batal</button>
        <button type="submit" className="btn-primary" disabled={isLoading || success}>
          {isLoading ? <><Loader2 size={15} className="spin" /> Menyimpan...</> : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  )
}

// ─── Unified ClientForm ───────────────────────────────────────────────────────

interface ClientFormProps {
  mode: 'create' | 'edit'
  clientId?: string
  defaultValues?: Partial<UpdateForm>
  onSuccess?: () => void
}

export function ClientForm({ mode, clientId, defaultValues, onSuccess }: ClientFormProps) {
  if (mode === 'create') return <ClientCreateForm onSuccess={onSuccess} />
  return <ClientEditForm clientId={clientId!} defaultValues={defaultValues} onSuccess={onSuccess} />
}
