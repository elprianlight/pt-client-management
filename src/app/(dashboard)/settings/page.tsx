'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '@/store/auth-store'
import { createClient } from '@/lib/supabase/client'
import {
  User,
  Lock,
  Camera,
  Shield,
  Bell,
  Globe,
  Moon,
  Info,
  LogOut,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Calendar,
  MapPin,
  Package,
  Activity,
  Award,
  HelpCircle,
  FileText,
  KeyRound,
  Smartphone,
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

export default function SettingsPage() {
  const { user, role, clearAuth, setUser } = useAuthStore()
  const isClient = role === 'client'

  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  // User Profile Form State
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+62 812-3456-7890')
  const [gender, setGender] = useState('Pria')
  const [birthDate, setBirthDate] = useState('1995-08-15')
  const [address, setAddress] = useState('Jakarta Selatan, Indonesia')

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Modal States
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isAvatarBottomSheetOpen, setIsAvatarBottomSheetOpen] = useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)

  // Feedback Dialog State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  })

  // Loading State
  const [isLoading, setIsLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Memproses...')

  useEffect(() => {
    setMounted(true)
    if (user?.fullName) {
      setFullName(user.fullName)
    }
  }, [user])

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      isEditProfileModalOpen ||
      isPasswordModalOpen ||
      isAvatarBottomSheetOpen ||
      isLogoutModalOpen ||
      feedbackModal.isOpen

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [
    isEditProfileModalOpen,
    isPasswordModalOpen,
    isAvatarBottomSheetOpen,
    isLogoutModalOpen,
    feedbackModal.isOpen,
  ])

  // Save Profile Handler
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setLoadingText('Memperbarui Profil...')

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id)

      if (error) throw error

      setUser({ ...user, fullName })
      setIsEditProfileModalOpen(false)
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Profil Berhasil Diperbarui',
        message: 'Informasi data diri Anda telah diperbarui di sistem StrengthLab.',
      })
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Memperbarui Profil',
        message: error.message || 'Terjadi kesalahan saat menyimpan data profil.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update Password Handler
  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Konfirmasi Sandi Tidak Cocok',
        message: 'Password baru dan konfirmasi password baru tidak sama. Silakan periksa kembali.',
      })
      return
    }

    if (newPassword.length < 6) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Sandi Terlalu Pendek',
        message: 'Password baru minimal harus terdiri dari 6 karakter.',
      })
      return
    }

    setIsLoading(true)
    setLoadingText('Mengubah Kata Sandi...')

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setIsPasswordModalOpen(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Kata Sandi Berhasil Diubah',
        message: 'Kata sandi akun Anda telah diperbarui. Gunakan password baru ini untuk login berikutnya.',
      })
    } catch (error: any) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal Mengubah Sandi',
        message: error.message || 'Terjadi kesalahan saat memperbarui kata sandi.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Logout Handler
  async function handleConfirmLogout() {
    setIsLoading(true)
    setLoadingText('Mengakhiri Sesi Login...')
    try {
      await supabase.auth.signOut()
      clearAuth()
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
      window.location.href = '/login'
    }
  }

  // Password Strength Calculator
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0
    let score = 0
    if (newPassword.length >= 6) score += 30
    if (newPassword.length >= 10) score += 30
    if (/[A-Z]/.test(newPassword)) score += 20
    if (/[0-9]/.test(newPassword)) score += 20
    return Math.min(100, score)
  }, [newPassword])

  return (
    <div className="account-center-wrapper animate-fade-in">
      {/* ==================== 2. PREMIUM PROFILE HERO HEADER ==================== */}
      <div className="account-hero-card animate-slide-down">
        <div className="ah-orb ah-orb-1" />
        <div className="ah-orb ah-orb-2" />
        <div className="ah-pattern" />

        <div className="ah-content">
          {/* Avatar with Camera Overlay & Click Trigger */}
          <div
            className="ah-avatar-wrap"
            onClick={() => setIsAvatarBottomSheetOpen(true)}
            title="Klik untuk membuka Menu Akun"
          >
            <div className="ah-avatar-circle">
              <span>{fullName.slice(0, 2).toUpperCase() || 'PT'}</span>
            </div>
            <div className="ah-camera-badge">
              <Camera size={12} />
            </div>
          </div>

          {/* Identity & Status */}
          <div className="ah-identity-group">
            <div className="ah-role-row">
              <span className={`ah-role-pill ${isClient ? 'role-client' : 'role-pt'}`}>
                {isClient ? '⚡ Member Client' : '🟢 Personal Trainer'}
              </span>
              <span className="ah-verified-pill">🟢 Aktif</span>
            </div>

            <h1 className="ah-full-name">{fullName || 'Dana Gading'}</h1>
            <p className="ah-email">{user?.email || 'dana@pt.local'}</p>
            <p className="ah-joined">Member Since Juli 2026</p>
          </div>
        </div>
      </div>

      {/* ==================== 16. AI ACCOUNT INSIGHT CARD ==================== */}
      <div className="ai-account-card">
        <div className="ai-ac-header">
          <Sparkles size={16} className="ai-ac-icon" />
          <h4 className="ai-ac-title">✨ AI Account Security Insight</h4>
        </div>
        <p className="ai-ac-text">
          Profil akun Anda telah lengkap <strong>90%</strong>. Pastikan kata sandi Anda diperbarui secara berkala dan nomor telepon aktif untuk meningkatkan keamanan akun.
        </p>
      </div>

      {/* ==================== 3. GROUPED SETTINGS MENU CARDS ==================== */}
      <div className="account-sections-grid">
        {/* SECTION 1: PROFIL PENGGUNA */}
        <div className="account-section-card">
          <div className="asc-header">
            <div className="asc-title-wrap">
              <div className="asc-icon-box" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>
                <User size={18} />
              </div>
              <div>
                <h3 className="asc-title">Profil Pengguna</h3>
                <p className="asc-desc">Informasi data diri dan identitas Anda</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="asc-edit-btn"
            >
              <span>Edit Profil</span>
            </button>
          </div>

          <div className="asc-info-grid">
            <div className="asc-info-item">
              <span className="asc-label">Nama Lengkap</span>
              <span className="asc-val">{fullName || '-'}</span>
            </div>

            <div className="asc-info-item">
              <span className="asc-label">Nomor Telepon / HP</span>
              <span className="asc-val">{phone}</span>
            </div>

            <div className="asc-info-item">
              <span className="asc-label">Jenis Kelamin</span>
              <span className="asc-val">{gender}</span>
            </div>

            <div className="asc-info-item">
              <span className="asc-label">Tanggal Lahir</span>
              <span className="asc-val">{birthDate}</span>
            </div>

            <div className="asc-info-item col-span-2">
              <span className="asc-label">Alamat Lengkap</span>
              <span className="asc-val">{address}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: KEAMANAN & SANDI */}
        <div className="account-section-card">
          <div className="asc-header">
            <div className="asc-title-wrap">
              <div className="asc-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Shield size={18} />
              </div>
              <div>
                <h3 className="asc-title">Keamanan & Kata Sandi</h3>
                <p className="asc-desc">Kelola keamanan dan otentikasi login akun</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="asc-pwd-btn"
            >
              <KeyRound size={13} />
              <span>Ubah Sandi</span>
            </button>
          </div>

          <div className="asc-info-grid">
            <div className="asc-info-item col-span-2">
              <span className="asc-label">Alamat Email (Read Only)</span>
              <span className="asc-val-email">{user?.email || 'dana@pt.local'}</span>
            </div>

            <div className="asc-info-item">
              <span className="asc-label">Password Terakhir Diubah</span>
              <span className="asc-val">14 Hari Yang Lalu</span>
            </div>

            <div className="asc-info-item">
              <span className="asc-label">Login Terakhir</span>
              <span className="asc-val">Hari Ini • {format(new Date(), 'HH:mm')} WIB</span>
            </div>

            {/* 17. SECURITY CARD DETAILS */}
            <div className="asc-info-item col-span-2 security-device-box">
              <Smartphone size={16} className="sdb-icon" />
              <div>
                <span className="sdb-title">Perangkat Aktif Saat Ini</span>
                <span className="sdb-desc">iPhone / Mac App Session • StrengthLab Enterprise App</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PREFERENSI APLIKASI */}
        <div className="account-section-card">
          <div className="asc-header">
            <div className="asc-title-wrap">
              <div className="asc-icon-box" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <Bell size={18} />
              </div>
              <div>
                <h3 className="asc-title">Preferensi & Aplikasi</h3>
                <p className="asc-desc">Pengaturan tampilan, bahasa, dan notifikasi</p>
              </div>
            </div>
          </div>

          <div className="pref-list">
            <div className="pref-row">
              <div className="pref-left">
                <Bell size={16} className="pref-icon" />
                <span>Notifikasi Sesi & Progress</span>
              </div>
              <span className="pref-val-badge">Aktif</span>
            </div>

            <div className="pref-row">
              <div className="pref-left">
                <Globe size={16} className="pref-icon" />
                <span>Bahasa Aplikasi</span>
              </div>
              <span className="pref-val">Bahasa Indonesia</span>
            </div>

            <div className="pref-row">
              <div className="pref-left">
                <Moon size={16} className="pref-icon" />
                <span>Tema Tampilan</span>
              </div>
              <span className="pref-val">Dark Mode Premium</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: TENTANG & BANTUAN */}
        <div className="account-section-card">
          <div className="asc-header">
            <div className="asc-title-wrap">
              <div className="asc-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Info size={18} />
              </div>
              <div>
                <h3 className="asc-title">Tentang & Bantuan</h3>
                <p className="asc-desc">Informasi versi aplikasi dan bantuan layanan</p>
              </div>
            </div>
          </div>

          <div className="about-list">
            <div className="about-row">
              <span>Versi Aplikasi</span>
              <span className="about-ver">v1.0.0 Enterprise</span>
            </div>

            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20butuh%20bantuan%20terkait%20aplikasi."
              target="_blank"
              rel="noopener noreferrer"
              className="about-link-row"
            >
              <div className="about-link-left">
                <HelpCircle size={16} />
                <span>Pusat Bantuan & Customer Support</span>
              </div>
              <ChevronRight size={14} />
            </a>

            <div className="about-row">
              <span>Kebijakan Privasi & Syarat Ketentuan</span>
              <span className="about-ver">Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* LOGOUT BUTTON */}
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="account-logout-btn"
        >
          <LogOut size={16} />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </div>

      {/* ==================== 5. EDIT PROFILE MODAL / PORTAL ==================== */}
      {mounted && isEditProfileModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsEditProfileModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Edit Profil Pengguna</h3>
                  <p className="mc-sub">Perbarui informasi identitas akun Anda</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mc-form">
              <div className="mc-field">
                <label className="mc-label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mc-input"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="mc-field">
                <label className="mc-label">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mc-input"
                  placeholder="+62 8xx-xxxx-xxxx"
                />
              </div>

              <div className="mc-field-grid">
                <div className="mc-field">
                  <label className="mc-label">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mc-select"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                  </select>
                </div>

                <div className="mc-field">
                  <label className="mc-label">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="mc-input"
                  />
                </div>
              </div>

              <div className="mc-field">
                <label className="mc-label">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mc-textarea"
                />
              </div>

              <div className="mc-actions">
                <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="mc-btn-cancel">
                  Batal
                </button>
                <button type="submit" className="mc-btn-save">
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 4. CHANGE PASSWORD MODAL / PORTAL ==================== */}
      {mounted && isPasswordModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Ubah Kata Sandi</h3>
                  <p className="mc-sub">Pastikan kata sandi baru Anda aman</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="mc-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="mc-form">
              <div className="mc-field">
                <label className="mc-label">Kata Sandi Saat Ini</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mc-input"
                  placeholder="Masukkan kata sandi saat ini"
                />
              </div>

              <div className="mc-field">
                <div className="flex-between">
                  <label className="mc-label">Kata Sandi Baru</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="toggle-pwd-btn"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mc-input"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="pwd-strength-wrap">
                  <div className="pwd-strength-bar">
                    <div
                      className="pwd-strength-fill"
                      style={{
                        width: `${passwordStrength}%`,
                        background: passwordStrength > 60 ? '#10b981' : passwordStrength > 30 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="pwd-strength-text">
                    Kekuatan Sandi: {passwordStrength > 60 ? 'Kuat 💪' : passwordStrength > 30 ? 'Sedang ⚠️' : 'Lemah ❌'}
                  </span>
                </div>
              )}

              <div className="mc-field">
                <label className="mc-label">Konfirmasi Kata Sandi Baru</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mc-input"
                  placeholder="Ketik ulang kata sandi baru"
                />
              </div>

              <div className="mc-actions">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="mc-btn-cancel">
                  Batal
                </button>
                <button type="submit" className="mc-btn-save">
                  Ubah Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 15. AVATAR BOTTOM SHEET MENU (PORTAL) ==================== */}
      {mounted && isAvatarBottomSheetOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsAvatarBottomSheetOpen(false)}>
          <div className="bottom-sheet-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar" />

            <div className="bs-header">
              <h3 className="bs-title">Menu Pusat Akun</h3>
              <p className="bs-sub">Pilih layanan cepat untuk akun Anda</p>
            </div>

            <div className="bs-menu-list">
              <button
                type="button"
                onClick={() => {
                  setIsAvatarBottomSheetOpen(false)
                  setIsEditProfileModalOpen(true)
                }}
                className="bs-menu-item"
              >
                <User size={18} className="bs-m-icon" />
                <span>👤 Profil Saya</span>
              </button>

              <Link href="/packages" className="bs-menu-item" onClick={() => setIsAvatarBottomSheetOpen(false)}>
                <Package size={18} className="bs-m-icon" />
                <span>📦 Paket Saya</span>
              </Link>

              <Link href="/progress" className="bs-menu-item" onClick={() => setIsAvatarBottomSheetOpen(false)}>
                <Activity size={18} className="bs-m-icon" />
                <span>📈 Progress Latihan</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsAvatarBottomSheetOpen(false)
                  setIsPasswordModalOpen(true)
                }}
                className="bs-menu-item"
              >
                <Lock size={18} className="bs-m-icon" />
                <span>⚙️ Pengaturan & Sandi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAvatarBottomSheetOpen(false)
                  setIsLogoutModalOpen(true)
                }}
                className="bs-menu-item danger"
              >
                <LogOut size={18} className="bs-m-icon" />
                <span>🚪 Keluar dari Akun</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== LOGOUT CONFIRMATION MODAL ==================== */}
      {mounted && isLogoutModalOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <LogOut size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Konfirmasi Keluar</h3>
                  <p className="mc-sub">Apakah Anda yakin ingin keluar?</p>
                </div>
              </div>
            </div>

            <p className="mc-modal-desc">
              Sesi login Anda akan diakhiri. Anda dapat login kembali sewaktu-waktu dengan email dan kata sandi Anda.
            </p>

            <div className="mc-actions">
              <button type="button" onClick={() => setIsLogoutModalOpen(false)} className="mc-btn-cancel">
                Batal
              </button>
              <button type="button" onClick={handleConfirmLogout} className="mc-btn-danger">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 6 & 8 & 9. FEEDBACK SUCCESS / ERROR DIALOG ==================== */}
      {mounted && feedbackModal.isOpen && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}>
          <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mc-header">
              <div className="mc-title-group">
                <div
                  className="mc-icon-badge"
                  style={{
                    background: feedbackModal.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: feedbackModal.type === 'success' ? '#10b981' : '#ef4444',
                  }}
                >
                  {feedbackModal.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <div>
                  <h3 className="mc-title">{feedbackModal.title}</h3>
                </div>
              </div>
            </div>

            <p className="mc-modal-desc">{feedbackModal.message}</p>

            <div className="mc-actions">
              <button
                type="button"
                onClick={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
                className="mc-btn-save"
                style={{ width: '100%' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== 7. TRANSPARENT LOADING OVERLAY ==================== */}
      {mounted && isLoading && createPortal(
        <div className="loading-overlay animate-fade-in">
          <div className="loading-card">
            <div className="loading-spinner-wrap">
              <div className="custom-loading-pulse" />
            </div>
            <span className="loading-text">{loadingText}</span>
          </div>
        </div>,
        document.body
      )}

      {/* ==================== STYLES ==================== */}
      <style jsx>{`
        .account-center-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 680px;
          margin: 0 auto;
          padding-bottom: 24px;
        }

        /* HERO CARD */
        .account-hero-card {
          position: relative;
          min-height: 180px;
          border-radius: 24px;
          padding: 22px 24px;
          background: linear-gradient(135deg, rgba(30, 27, 75, 0.55) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(49, 46, 129, 0.5) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(24px);
          overflow: hidden;
          display: flex;
          align-items: center;
        }
        .ah-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .ah-orb-1 {
          top: -50px; right: -40px; width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(168, 85, 247, 0) 70%);
          filter: blur(30px);
        }
        .ah-orb-2 {
          bottom: -40px; left: -30px; width: 160px; height: 160px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(99, 102, 241, 0) 70%);
          filter: blur(25px);
        }
        .ah-pattern {
          position: absolute; inset: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3; pointer-events: none;
        }

        .ah-content {
          position: relative; z-index: 1; width: 100%;
          display: flex; align-items: center; gap: 18px;
        }
        .ah-avatar-wrap {
          position: relative; cursor: pointer; flex-shrink: 0;
        }
        .ah-avatar-circle {
          width: 68px; height: 68px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 22px; font-weight: 900;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
        }
        .ah-camera-badge {
          position: absolute; bottom: 0; right: 0;
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--brand-primary); color: white;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg-surface);
        }

        .ah-identity-group {
          display: flex; flex-direction: column; gap: 2px;
        }
        .ah-role-row {
          display: flex; align-items: center; gap: 8px;
        }
        .ah-role-pill {
          padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 800;
        }
        .role-pt { background: rgba(16, 185, 129, 0.16); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
        .role-client { background: rgba(99, 102, 241, 0.16); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
        .ah-verified-pill {
          padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 700;
          background: rgba(255, 255, 255, 0.08); color: var(--text-muted);
        }
        .ah-full-name {
          font-size: 22px; font-weight: 900; color: #ffffff; line-height: 1.2;
        }
        .ah-email {
          font-size: 12.5px; color: var(--text-secondary);
        }
        .ah-joined {
          font-size: 11px; color: var(--text-muted);
        }

        /* AI ACCOUNT CARD */
        .ai-account-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%);
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 18px; padding: 14px 16px; backdrop-filter: blur(16px);
          display: flex; flex-direction: column; gap: 4px;
        }
        .ai-ac-header { display: flex; align-items: center; gap: 6px; }
        :global(.ai-ac-icon) { color: #a855f7; }
        .ai-ac-title { font-size: 13.5px; font-weight: 800; color: #a855f7; }
        .ai-ac-text { font-size: 12.5px; line-height: 1.45; color: var(--text-secondary); }

        /* SECTIONS GRID */
        .account-sections-grid {
          display: flex; flex-direction: column; gap: 14px;
        }
        .account-section-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px; padding: 18px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
          backdrop-filter: blur(16px);
          display: flex; flex-direction: column; gap: 14px;
        }
        .asc-header {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; padding-bottom: 12px; border-bottom: 1px solid var(--border-default);
        }
        .asc-title-wrap { display: flex; align-items: center; gap: 10px; }
        .asc-icon-box {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .asc-title { font-size: 15.5px; font-weight: 800; color: var(--text-primary); }
        .asc-desc { font-size: 11.5px; color: var(--text-muted); }

        .asc-edit-btn, .asc-pwd-btn {
          height: 34px; padding: 0 12px; border-radius: 10px;
          background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.28);
          color: var(--brand-primary); font-size: 12px; font-weight: 700;
          display: flex; align-items: center; gap: 6px; cursor: pointer;
        }

        .asc-info-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        .asc-info-item {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 12px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 2px;
        }
        .col-span-2 { grid-column: span 2; }
        .asc-label { font-size: 11px; color: var(--text-muted); font-weight: 500; }
        .asc-val { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .asc-val-email { font-size: 13px; font-weight: 700; color: var(--brand-primary); }

        .security-device-box {
          flex-direction: row; align-items: center; gap: 10px;
        }
        :global(.sdb-icon) { color: #10b981; flex-shrink: 0; }
        .sdb-title { font-size: 12.5px; font-weight: 700; color: var(--text-primary); display: block; }
        .sdb-desc { font-size: 11px; color: var(--text-muted); display: block; }

        /* PREFERENCES */
        .pref-list, .about-list { display: flex; flex-direction: column; gap: 8px; }
        .pref-row, .about-row {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 12px; padding: 10px 12px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: var(--text-secondary);
        }
        .pref-left { display: flex; align-items: center; gap: 8px; }
        :global(.pref-icon) { color: var(--brand-primary); }
        .pref-val-badge {
          background: rgba(16, 185, 129, 0.14); color: #10b981;
          padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 800;
        }
        .pref-val, .about-ver { font-weight: 700; color: var(--text-primary); }
        :global(.about-link-row) {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 12px; padding: 10px 12px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: var(--text-primary); text-decoration: none;
        }
        .about-link-left { display: flex; align-items: center; gap: 8px; }

        /* LOGOUT BUTTON */
        .account-logout-btn {
          width: 100%; height: 46px; border-radius: 16px;
          background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444; font-size: 14px; font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer; transition: all var(--transition-fast);
        }
        .account-logout-btn:hover { background: rgba(239, 68, 68, 0.2); }

        /* MODAL STYLES */
        .modal-backdrop {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.78); backdrop-filter: blur(16px);
          z-index: 99999; display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .modal-card {
          width: 100%; max-width: 480px; background: var(--bg-elevated);
          border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 20px 22px; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
          display: flex; flex-direction: column; gap: 14px;
          max-height: 85vh; overflow-y: auto;
        }
        .mc-header { display: flex; align-items: center; justify-content: space-between; }
        .mc-title-group { display: flex; align-items: center; gap: 8px; }
        .mc-icon-badge {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(99, 102, 241, 0.15); color: #6366f1;
          display: flex; align-items: center; justify-content: center;
        }
        .mc-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .mc-sub { font-size: 11.5px; color: var(--text-muted); }
        .mc-close-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }

        .mc-form { display: flex; flex-direction: column; gap: 10px; }
        .mc-field { display: flex; flex-direction: column; gap: 4px; }
        .mc-field-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .mc-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
        .mc-input, .mc-select, .mc-textarea {
          width: 100%; background: var(--bg-surface); border: 1px solid var(--border-default);
          border-radius: 10px; color: var(--text-primary); font-size: 13px;
          padding: 8px 12px; outline: none;
        }
        .flex-between { display: flex; align-items: center; justify-content: space-between; }
        .toggle-pwd-btn {
          background: transparent; border: none; color: var(--brand-primary);
          font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px; cursor: pointer;
        }
        .pwd-strength-wrap { display: flex; flex-direction: column; gap: 3px; }
        .pwd-strength-bar {
          width: 100%; height: 4px; background: rgba(255, 255, 255, 0.1); border-radius: 100px; overflow: hidden;
        }
        .pwd-strength-fill { height: 100%; transition: width 0.3s; }
        .pwd-strength-text { font-size: 10.5px; color: var(--text-muted); }

        .mc-actions { display: flex; gap: 8px; margin-top: 8px; }
        .mc-btn-cancel {
          flex: 1; height: 40px; border-radius: 12px;
          background: var(--bg-surface); border: 1px solid var(--border-default);
          color: var(--text-secondary); font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .mc-btn-save {
          flex: 1; height: 40px; border-radius: 12px;
          background: var(--brand-primary); border: none;
          color: white; font-size: 13px; font-weight: 700; cursor: pointer;
        }
        .mc-btn-danger {
          flex: 1; height: 40px; border-radius: 12px;
          background: #ef4444; border: none;
          color: white; font-size: 13px; font-weight: 700; cursor: pointer;
        }

        /* BOTTOM SHEET */
        .bottom-sheet-modal {
          width: 100%; max-width: 500px; background: var(--bg-elevated);
          border-top-left-radius: 24px; border-top-right-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.15); padding: 16px 20px 24px;
          display: flex; flex-direction: column; gap: 12px; margin-top: auto;
        }
        .sheet-handle-bar {
          width: 40px; height: 4px; background: var(--border-default);
          border-radius: 100px; align-self: center;
        }
        .bs-header { text-align: center; }
        .bs-title { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .bs-sub { font-size: 11.5px; color: var(--text-muted); }
        .bs-menu-list { display: flex; flex-direction: column; gap: 6px; }
        :global(.bs-menu-item) {
          width: 100%; height: 44px; border-radius: 12px;
          background: var(--bg-surface); border: 1px solid var(--border-default);
          color: var(--text-primary); font-size: 13.5px; font-weight: 700;
          display: flex; align-items: center; gap: 10px; padding: 0 14px;
          text-decoration: none; cursor: pointer;
        }
        :global(.bs-menu-item.danger) { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        :global(.bs-m-icon) { color: var(--brand-primary); }

        /* LOADING OVERLAY */
        .loading-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(14px); z-index: 999999;
          display: flex; align-items: center; justify-content: center;
        }
        .loading-card {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 20px; padding: 24px 32px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }
        .custom-loading-pulse {
          width: 36px; height: 36px; border-radius: 50%;
          border: 3px solid rgba(99, 102, 241, 0.2);
          border-top-color: var(--brand-primary); animation: spin 0.8s linear infinite;
        }
        .loading-text { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 640px) {
          .asc-info-grid { grid-template-columns: 1fr; }
          .col-span-2 { grid-column: span 1; }
        }
      `}</style>
    </div>
  )
}
