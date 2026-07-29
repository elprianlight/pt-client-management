'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Dumbbell, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true, // Default to true
    }
  })

  // Load saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('pt_username')
    if (savedUsername) {
      setValue('username', savedUsername)
      setValue('rememberMe', true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)

    try {
      // Dummy email domain for Supabase Auth workaround
      const dummyEmail = `${data.username}@pt.local`

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: data.password,
      })

      if (error) {
        setAuthError('Username atau password salah. Silakan coba lagi.')
        return
      }

      // Handle Remember Me
      if (data.rememberMe) {
        localStorage.setItem('pt_username', data.username)
      } else {
        localStorage.removeItem('pt_username')
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setAuthError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-bg-orb orb-1" />
        <div className="login-bg-orb orb-2" />
        <div className="login-bg-orb orb-3" />
        <div className="login-bg-grid" />
      </div>

      {/* Card */}
      <div className="login-card animate-fade-in-up">
        {/* Logo */}
        <div className="login-logo" style={{ justifyContent: 'center', marginBottom: '24px' }}>
          <img 
            src="/logo_full_transparent.png" 
            alt="PT Client Management System" 
            style={{ width: '180px', height: 'auto', objectFit: 'contain' }} 
          />
        </div>

        <div className="login-divider" />

        <div className="login-header">
          <h2 className="login-title">Selamat Datang</h2>
          <p className="login-desc">Masuk ke akun Anda untuk melanjutkan</p>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="login-error animate-fade-in">
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Masukkan username"
              className={`input-field ${errors.username ? 'input-error' : ''}`}
              autoComplete="username"
              {...register('username')}
            />
            {errors.username && (
              <p className="form-error">{errors.username.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">Password</label>
            </div>
            <div className="input-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                autoComplete="current-password"
                {...register('password')}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="form-remember">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                {...register('rememberMe')}
              />
              <span className="checkbox-text">Ingat Saya</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary login-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="spin" />
                Memproses...
              </>
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        {/* Footer */}
        {/* Removed footer text per request */}
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          background: var(--bg-base);
        }

        /* ── Background ── */
        .login-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
        }
        .orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #6366f1, transparent);
          top: -200px; left: -200px;
          animation: float1 12s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #8b5cf6, transparent);
          bottom: -150px; right: -150px;
          animation: float2 10s ease-in-out infinite;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #06b6d4, transparent);
          top: 50%; left: 60%;
          opacity: 0.2;
          animation: float3 8s ease-in-out infinite;
        }
        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* ── Card ── */
        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: rgba(15, 17, 23, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 36px;
          box-shadow:
            0 32px 64px rgba(0,0,0,0.6),
            0 0 0 1px rgba(99,102,241,0.1),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }

        /* ── Logo ── */
        .login-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .logo-icon {
          width: 52px; height: 52px;
          background: var(--gradient-brand);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 0 24px rgba(99,102,241,0.4);
          flex-shrink: 0;
        }
        .logo-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .logo-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .login-divider {
          height: 1px;
          background: var(--border-default);
          margin-bottom: 24px;
        }

        /* ── Header ── */
        .login-header {
          margin-bottom: 24px;
        }
        .login-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .login-desc {
          font-size: 13px;
          color: var(--text-secondary);
        }

        /* ── Error ── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--error-bg);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: 13px;
          margin-bottom: 20px;
        }

        /* ── Form ── */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .form-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .form-forgot {
          font-size: 12px;
          color: var(--text-brand);
          text-decoration: none;
          transition: opacity var(--transition-fast);
        }
        .form-forgot:hover { opacity: 0.8; }
        .form-error {
          font-size: 12px;
          color: var(--error);
          margin-top: 2px;
        }
        .input-error {
          border-color: rgba(239,68,68,0.5) !important;
        }
        .input-error:focus {
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important;
        }
        .input-password-wrapper {
          position: relative;
        }
        .input-password-wrapper .input-field {
          padding-right: 44px;
        }
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color var(--transition-fast);
        }
        .password-toggle:hover { color: var(--text-secondary); }

        .form-remember {
          margin-top: 4px;
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .checkbox-input {
          appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid var(--border-default);
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }
        .checkbox-input:checked {
          background: var(--brand-primary);
          border-color: var(--brand-primary);
        }
        .checkbox-input:checked::after {
          content: '';
          position: absolute;
          left: 4px;
          top: 1px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .checkbox-text {
          font-size: 13px;
          color: var(--text-secondary);
          user-select: none;
        }

        .login-submit {
          width: 100%;
          padding: 12px;
          font-size: 15px;
          margin-top: 4px;
        }

        /* ── Footer ── */
        .login-footer {
          margin-top: 24px;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.7;
        }

        /* ── Spin ── */
        .spin {
          animation: spin 1s linear infinite;
        }

        /* ── Floating orb animations ── */
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          33%       { transform: translate(40px, 20px); }
          66%       { transform: translate(-20px, 40px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          33%       { transform: translate(-30px, -20px); }
          66%       { transform: translate(20px, -40px); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50%       { transform: translate(-50%, -50%) scale(1.2); }
        }
      `}</style>
    </div>
  )
}
