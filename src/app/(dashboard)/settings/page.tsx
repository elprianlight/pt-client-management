'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/client'
import { User, Lock, Save, Moon, Sun, Monitor } from 'lucide-react'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' })

  const supabase = createClient()

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName)
    }
  }, [user])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, fullName })
      setMessage({ text: 'Profil berhasil diperbarui.', type: 'success' })
    } catch (error: any) {
      setMessage({ text: error.message || 'Gagal memperbarui profil.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsPasswordLoading(true)
    setPasswordMessage({ text: '', type: '' })

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordMessage({ text: 'Kata sandi berhasil diubah.', type: 'success' })
      setPassword('')
      setNewPassword('')
    } catch (error: any) {
      setPasswordMessage({ text: error.message || 'Gagal mengubah kata sandi.', type: 'error' })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <div className="settings-page animate-fade-in-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pengaturan Akun</h1>
          <p className="page-desc">Kelola profil dan preferensi akun Anda</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Profile Settings */}
        <div className="card settings-card">
          <div className="card-header">
            <div className="card-icon-wrapper">
              <User size={20} className="text-brand" />
            </div>
            <div>
              <h2 className="card-title">Profil Pengguna</h2>
              <p className="card-desc">Ubah informasi identitas Anda.</p>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label className="form-label">Alamat Email (Tidak dapat diubah)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={user?.email || ''} 
                  disabled 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  required
                />
              </div>
              
              {message.text && (
                <div className={`alert alert-${message.type}`}>
                  {message.text}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
              >
                {isLoading ? 'Menyimpan...' : (
                  <>
                    <Save size={16} />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card settings-card">
          <div className="card-header">
            <div className="card-icon-wrapper" style={{ background: 'var(--error-bg)' }}>
              <Lock size={20} className="text-error" />
            </div>
            <div>
              <h2 className="card-title">Keamanan & Sandi</h2>
              <p className="card-desc">Pastikan akun Anda tetap aman.</p>
            </div>
          </div>
          <div className="card-body">
            <form onSubmit={handleUpdatePassword} className="settings-form">
              <div className="form-group">
                <label className="form-label">Sandi Saat Ini</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan sandi saat ini"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sandi Baru</label>
                <input 
                  type="password" 
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan sandi baru"
                  required
                  minLength={6}
                />
              </div>

              {passwordMessage.text && (
                <div className={`alert alert-${passwordMessage.type}`}>
                  {passwordMessage.text}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-outline" 
                style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
                disabled={isPasswordLoading}
              >
                {isPasswordLoading ? 'Mengubah...' : 'Ubah Sandi'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .page-desc {
          color: var(--text-muted);
          font-size: 14px;
          margin-top: 4px;
        }
        
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .settings-card {
          height: fit-content;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          border-bottom: 1px solid var(--border-default);
        }
        .card-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: var(--brand-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .card-desc {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .card-body {
          padding: 20px;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .form-input {
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--bg-overlay);
          color: var(--text-primary);
          font-size: 14px;
          transition: all var(--transition-fast);
        }
        .form-input:focus {
          outline: none;
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99,102,241, 0.1);
        }

        .alert {
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
        }
        .alert-success {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .alert-error {
          background: var(--error-bg);
          color: var(--error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .text-brand { color: var(--brand-primary); }
        .text-error { color: var(--error); }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
          .settings-page {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  )
}
