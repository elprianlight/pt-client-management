'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { sellPackage, updatePackageData } from '@/lib/actions/package'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

const packageSchema = z.object({
  clientId: z.string().uuid('Pilih client terlebih dahulu'),
  packageName: z.string().min(2, 'Nama paket wajib diisi').max(255),
  totalSessions: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(1, 'Minimal 1 sesi')),
  pricePerSession: z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(0, 'Harga tidak valid')),
  purchaseDate: z.string().min(1, 'Tanggal penjualan wajib diisi'),
  notes: z.string().optional(),
})

type PackageFormValues = z.infer<typeof packageSchema>

interface PackageFormProps {
  clients: { id: string, name: string }[]
  initialData?: any
}

export function PackageForm({ clients, initialData }: PackageFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const isEdit = !!initialData

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PackageFormValues>({ // eslint-disable-line
    resolver: zodResolver(packageSchema) as any,
    defaultValues: {
      clientId: initialData?.clientId || '',
      packageName: initialData?.packageName || '',
      totalSessions: initialData?.totalSessions || 10,
      pricePerSession: initialData?.pricePerSession ? Number(initialData.pricePerSession) : 0,
      purchaseDate: initialData?.createdAt ? new Date(initialData.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: initialData?.notes || '',
    }
  })

  const totalSessions = watch('totalSessions') || 0
  const pricePerSession = watch('pricePerSession') || 0
  const totalPrice = totalSessions * pricePerSession

  const onSubmit = async (data: PackageFormValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = isEdit ? await updatePackageData(initialData.id, data) : await sellPackage(data)
      if (!res.success) {
        setError(res.error || 'Terjadi kesalahan')
      } else {
        setSuccess(true)
        setTimeout(() => {
          router.push('/packages')
          router.refresh()
        }, 1500)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <form onSubmit={(handleSubmit as any)(onSubmit)} className="package-form">
      {error && <div className="form-alert form-alert-error"><AlertCircle size={15} /><span>{error}</span></div>}
      {success && <div className="form-alert form-alert-success"><CheckCircle size={15} /><span>{isEdit ? 'Perubahan berhasil disimpan! Mengalihkan...' : 'Paket berhasil dijual! Mengalihkan...'}</span></div>}

      <div className="form-grid">
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Client</label>
          <select className={`input-field ${errors.clientId ? 'input-error' : ''}`} disabled={isEdit} {...register('clientId')}>
            <option value="">-- Pilih Client --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.clientId && <span className="form-error">{errors.clientId.message}</span>}
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Nama Paket</label>
          <input type="text" className={`input-field ${errors.packageName ? 'input-error' : ''}`} placeholder="Contoh: Paket Fat Loss 10 Sesi" {...register('packageName')} />
          {errors.packageName && <span className="form-error">{errors.packageName.message}</span>}
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Tanggal Penjualan</label>
          <input type="date" className={`input-field ${errors.purchaseDate ? 'input-error' : ''}`} {...register('purchaseDate')} />
          {errors.purchaseDate && <span className="form-error">{errors.purchaseDate.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Jumlah Sesi</label>
          <input type="number" className={`input-field ${errors.totalSessions ? 'input-error' : ''}`} {...register('totalSessions')} />
          {errors.totalSessions && <span className="form-error">{errors.totalSessions.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Harga Per Sesi (Rp)</label>
          <input type="number" className={`input-field ${errors.pricePerSession ? 'input-error' : ''}`} placeholder="Misal: 250000" {...register('pricePerSession')} />
          {errors.pricePerSession && <span className="form-error">{errors.pricePerSession.message}</span>}
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Total Harga (Otomatis)</label>
          <div className="total-price-display">
            Rp {new Intl.NumberFormat('id-ID').format(totalPrice)}
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Catatan Tambahan (Opsional)</label>
          <textarea className="input-field" rows={3} placeholder="Tambahkan catatan khusus..." {...register('notes')} />
        </div>
      </div>

      <div className="form-actions">
        <Link href="/packages" className="btn-secondary">Batal</Link>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? <><Loader2 size={16} className="spin" /> Menyimpan...</> : (isEdit ? 'Simpan Perubahan' : 'Jual Paket')}
        </button>
      </div>

      <style jsx>{`
        .package-form { display: flex; flex-direction: column; gap: 24px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 13px; font-weight: 500; color: var(--text-secondary); }
        .form-error { font-size: 12px; color: var(--error); margin-top: 2px; }
        .input-error { border-color: rgba(239,68,68,0.5) !important; }
        .total-price-display {
          padding: 12px 16px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: var(--radius-lg);
          font-size: 18px;
          font-weight: 700;
          color: var(--brand-secondary);
        }
        .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; border-top: 1px solid var(--border-default); padding-top: 20px; }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr; }
          .form-group { grid-column: span 1 !important; }
        }
      `}</style>
    </form>
  )
}
