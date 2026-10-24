import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { getCleanNotes } from '@/lib/utils'
import { ELPRIAN_LOGO_BASE64 } from './report-logo'

export interface ReportSession {
  id: string
  packageId?: string | null
  scheduledAt: string | Date
  status: 'completed' | 'no_show' | 'scheduled' | 'cancelled' | string
  programType?: string | null
  rpe?: number | null
  sessionNotes?: string | null
  ptNotes?: string | null
  packageName?: string | null
}

export interface ReportPackage {
  id: string
  packageName?: string | null
  name?: string | null
  totalSessions?: number | null
  usedSessions?: number | null
  completedSessions?: number | null
  remainingSessions?: number | null
  createdAt?: string | Date | null
  billingType?: string | null
}

export interface ReportClient {
  id: string
  fitnessGoals?: string | null
  fitnessGoal?: string | null
  emergencyContactPhone?: string | null
  createdAt?: string | Date | null
  user?: {
    fullName?: string | null
    phone?: string | null
    avatarUrl?: string | null
  } | null
}

export interface ReportTrainer {
  fullName?: string | null
  role?: string | null
}

export interface GenerateReportOptions {
  client: ReportClient
  selectedPackage?: ReportPackage | null
  sessions: ReportSession[]
  trainer?: ReportTrainer | null
}

export function generateExecutiveReportHtml({
  client,
  selectedPackage,
  sessions,
  trainer,
}: GenerateReportOptions): string {
  const clientName = client.user?.fullName?.trim() || 'Client'
  const clientInitial = (clientName[0] || 'C').toUpperCase()
  const clientGoal = client.fitnessGoal || client.fitnessGoals || 'Body Recomposition & Strength'
  const clientPhone = client.user?.phone || client.emergencyContactPhone || '-'
  
  let joinDate = '-'
  if (client.createdAt) {
    try {
      joinDate = format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: id })
    } catch {
      joinDate = '-'
    }
  }

  const trainerName = trainer?.fullName?.trim() || 'Elprian Light'
  const trainerRole = trainer?.role?.trim() || 'Head Coach & Founder'

  const now = new Date()
  const printDate = format(now, 'EEEE, d MMMM yyyy', { locale: id })
  const yearMonth = format(now, 'yyyyMM')
  const clientCode = client.id ? client.id.replace(/-/g, '').slice(0, 6) : '1781'
  const reportNo = `ET-REP-${yearMonth}-C_${clientCode}`

  // Sort sessions chronologically (oldest to newest for session #1, #2, ...)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )

  const packageName =
    selectedPackage?.packageName ||
    selectedPackage?.name ||
    (sortedSessions[0]?.packageName ? sortedSessions[0].packageName : 'Semua Paket')

  // Status breakdown
  const completeCount = sortedSessions.filter((s) => s.status === 'completed').length
  const noShowCount = sortedSessions.filter((s) => s.status === 'no_show').length
  const scheduledCount = sortedSessions.filter((s) => s.status === 'scheduled').length
  const cancelCount = sortedSessions.filter((s) => s.status === 'cancelled').length
  const consumedCount = completeCount + noShowCount // Rule: Consumed = Complete + No Show

  // Package accounting
  let totalPackageSessions = 0
  let purchaseDate = '-'

  if (selectedPackage && typeof selectedPackage.totalSessions === 'number') {
    totalPackageSessions = selectedPackage.totalSessions
    if (selectedPackage.createdAt) {
      try {
        purchaseDate = format(new Date(selectedPackage.createdAt), 'dd/MM/yyyy', { locale: id })
      } catch {
        purchaseDate = '-'
      }
    }
  } else {
    // If "all" packages, derive quota from total records or consumed
    totalPackageSessions = Math.max(consumedCount, sortedSessions.length)
    if (sortedSessions.length > 0) {
      try {
        purchaseDate = format(new Date(sortedSessions[0].scheduledAt), 'dd/MM/yyyy', { locale: id })
      } catch {
        purchaseDate = '-'
      }
    }
  }

  const remainingSessions = Math.max(0, totalPackageSessions - consumedCount)
  const progressPercent =
    totalPackageSessions > 0
      ? Math.min(100, Math.round((consumedCount / totalPackageSessions) * 100))
      : 100

  // Session reconciliation
  const packageQuotaUsed = selectedPackage?.usedSessions ?? consumedCount
  const diff = Math.abs(packageQuotaUsed - consumedCount)
  const isVerified = diff === 0
  const integrityBadge = isVerified
    ? '<span class="integrity-badge">🟢 DATA VERIFIED</span>'
    : '<span class="integrity-badge" style="background:rgba(245,158,11,0.15);color:#d97706;border-color:#d97706;">🟡 RECONCILIATION</span>'

  // Average RPE & Training Insight
  const completedSessions = sortedSessions.filter((s) => s.status === 'completed')
  const rpeValues = completedSessions
    .filter((s) => typeof s.rpe === 'number' && s.rpe > 0)
    .map((s) => s.rpe as number)

  const avgRpe =
    rpeValues.length > 0
      ? rpeValues.reduce((sum, val) => sum + val, 0) / rpeValues.length
      : 8.0
  const avgRpeFormatted = avgRpe.toFixed(1)

  let intensityDesc = 'tinggi dan konsisten'
  let intensityBadgeText = 'High Intensity'
  if (avgRpe < 6.5) {
    intensityDesc = 'moderat dan adaptif'
    intensityBadgeText = 'Moderate Intensity'
  } else if (avgRpe < 7.5) {
    intensityDesc = 'progresif dan stabil'
    intensityBadgeText = 'Optimal Intensity'
  }

  const lastCompleted = [...completedSessions].pop()
  let lastSessionDate = '-'
  if (lastCompleted) {
    try {
      lastSessionDate = format(new Date(lastCompleted.scheduledAt), 'd MMMM yyyy', { locale: id })
    } catch {
      lastSessionDate = '-'
    }
  }
  const lastProgram = lastCompleted?.programType || 'Personal Training'
  const lastRpe = lastCompleted?.rpe ?? Math.round(avgRpe)

  const fileNameSlug = clientName.replace(/[^a-zA-Z0-9_-]/g, '_')
  const defaultDownloadFilename = `Laporan_${fileNameSlug}_ElprianTraining.html`

  // Render session cards
  const sessionCardsHtml = sortedSessions
    .map((s, idx) => {
      const sessNum = idx + 1
      let sessDate = '-'
      let sessTime = '-'
      try {
        const d = new Date(s.scheduledAt)
        sessDate = format(d, 'EEEE, d MMMM yyyy', { locale: id })
        sessTime = format(d, 'HH:mm')
      } catch {
        // fallback
      }

      let statusBadge = '<span class="badge-complete">✓ Complete</span>'
      if (s.status === 'no_show') {
        statusBadge = '<span class="badge-noshow">⚠️ No Show</span>'
      } else if (s.status === 'scheduled') {
        statusBadge = '<span class="badge-scheduled">📅 Scheduled</span>'
      } else if (s.status === 'cancelled') {
        statusBadge = '<span class="badge-cancel">✕ Cancel</span>'
      }

      const rawNotes = getCleanNotes(s.ptNotes, s.sessionNotes)
      const notesContent = rawNotes
        ? rawNotes
        : 'Sesi latihan berjalan lancar sesuai target program harian.'

      const programLabel = s.programType || 'Personal Training'
      const sessPkgLabel = s.packageName || packageName

      return `
      <div class="sess-card">
        <div class="sess-header">
          <div class="sess-title">💪 ${escapeHtml(programLabel)} — ${escapeHtml(sessPkgLabel)}</div>
          <div class="sess-num">Sesi #${sessNum}</div>
        </div>
        <div class="sess-body">
          <div class="sess-metas">
            <div class="sess-pill">📅 ${escapeHtml(sessDate)}</div>
            <div class="sess-pill">🕐 Jam ${escapeHtml(sessTime)}</div>
            <div class="sess-pill" style="color:#FF5A1F;font-weight:800;">⚡ RPE ${s.rpe ? `${s.rpe}/10` : '-'}</div>
            ${statusBadge}
          </div>
          <div class="notes-box">
            <div class="notes-lbl">📝 Catatan Coach</div>
            <div class="notes-txt">${escapeHtml(notesContent)}</div>
          </div>
        </div>
      </div>
      `
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Executive Report — ${escapeHtml(clientName)} | Elprian Training</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f0f4f8;
      color: #0f172a;
      padding: 20px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    @media (min-width: 768px) {
      body {
        padding: 40px;
      }
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
    }
    
    /* Top Action Bar (No-Print) */
    .report-actions-bar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 12px 18px;
      margin-bottom: 24px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.25);
    }
    .report-actions-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .report-actions-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
    }
    .report-actions-icon {
      background: #FF5A1F;
      color: #ffffff;
      width: 26px;
      height: 26px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
    }
    .report-actions-btns {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-action {
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .btn-print {
      background: #FF5A1F;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(255, 90, 31, 0.35);
    }
    .btn-print:hover {
      background: #ea580c;
      transform: translateY(-1px);
    }
    .btn-download {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-download:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
    .btn-close {
      background: transparent;
      color: #94a3b8;
    }
    .btn-close:hover {
      color: #ffffff;
    }

    .card {
      background: #fff;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
      page-break-inside: avoid;
    }
    .hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%);
      border-radius: 24px;
      padding: 34px 28px;
      margin-bottom: 24px;
      color: #fff;
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
    }
    .hero::before {
      content: "";
      position: absolute;
      top: -60px;
      right: -60px;
      width: 260px;
      height: 260px;
      background: radial-gradient(circle, rgba(255, 90, 31, 0.3), transparent 70%);
      border-radius: 50%;
    }
    .hero::after {
      content: "";
      position: absolute;
      bottom: -70px;
      left: -50px;
      width: 240px;
      height: 240px;
      background: radial-gradient(circle, rgba(249, 115, 22, 0.2), transparent 70%);
      border-radius: 50%;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
      flex-wrap: wrap;
      gap: 14px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-img {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      object-fit: contain;
      background: #fff;
      padding: 2px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .brand-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #fff;
    }
    .brand-sub {
      font-size: 10px;
      font-weight: 800;
      color: #f97316;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }
    .report-no {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 20px;
    }
    .integrity-badge {
      display: inline-block;
      padding: 5px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 800;
      background: rgba(5, 150, 105, 0.15);
      color: #059669;
      border: 1px solid #059669;
    }
    .hero-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      padding: 18px;
      position: relative;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .meta-lbl {
      font-size: 10px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 800;
      color: #fff;
      margin-top: 3px;
    }
    .client-grid {
      display: flex;
      align-items: center;
      gap: 18px;
      flex-wrap: wrap;
    }
    .avatar {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: linear-gradient(135deg, #FF5A1F, #f97316);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 900;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 6px 16px rgba(255, 90, 31, 0.25);
    }
    .client-name {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
      margin-top: 6px;
      margin-right: 6px;
    }
    .tag-green {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }
    .tag-blue {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    @media (min-width: 560px) {
      .kpi-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .kpi {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
    }
    .kpi-icon {
      font-size: 20px;
      margin-bottom: 8px;
    }
    .kpi-val {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1;
    }
    .kpi-lbl {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 6px;
    }
    .kpi-sub {
      font-size: 10px;
      font-weight: 700;
      margin-top: 4px;
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 480px) {
      .status-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .stat-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }
    .stat-num {
      font-size: 22px;
      font-weight: 900;
      line-height: 1;
    }
    .stat-lbl {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .prog-bg {
      background: #e2e8f0;
      border-radius: 20px;
      height: 10px;
      overflow: hidden;
      margin: 10px 0 6px 0;
    }
    .prog-fill {
      height: 100%;
      border-radius: 20px;
      background: linear-gradient(90deg, #FF5A1F, #f97316);
      transition: width 0.5s ease;
    }
    .recon-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .recon-row:last-child {
      border-bottom: none;
    }
    .recon-label {
      color: #64748b;
      font-weight: 600;
    }
    .recon-val {
      font-weight: 800;
      color: #0f172a;
    }
    .sess-head {
      font-size: 17px;
      font-weight: 900;
      color: #0f172a;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sess-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      margin-bottom: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      page-break-inside: avoid;
    }
    .sess-header {
      background: #0f172a;
      padding: 13px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sess-title {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
    }
    .sess-num {
      background: rgba(255, 90, 31, 0.25);
      color: #ff7a00;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
    }
    .sess-body {
      padding: 14px 18px;
    }
    .sess-metas {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 10px;
    }
    .sess-pill {
      background: #f1f5f9;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-complete {
      background: rgba(16, 185, 129, 0.12);
      color: #059669;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }
    .badge-noshow {
      background: rgba(249, 115, 22, 0.12);
      color: #ea580c;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }
    .badge-scheduled {
      background: rgba(245, 158, 11, 0.12);
      color: #d97706;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }
    .badge-cancel {
      background: rgba(239, 68, 68, 0.12);
      color: #dc2626;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
    }
    .notes-box {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 0 10px 10px 0;
      padding: 10px 14px;
      margin-top: 8px;
    }
    .notes-lbl {
      font-size: 10px;
      font-weight: 800;
      color: #15803d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .notes-txt {
      font-size: 12px;
      color: #334155;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    .insight-box {
      background: linear-gradient(135deg, #f8fafc, #f0f9ff);
      border: 1px solid #bae6fd;
      border-radius: 14px;
      padding: 16px;
      margin-top: 10px;
    }
    .insight-txt {
      font-size: 13px;
      color: #0f172a;
      line-height: 1.7;
    }
    .milestone-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }
    .milestone {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .milestone-ico {
      font-size: 24px;
    }
    .milestone-txt {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px dashed #e2e8f0;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: center;
      padding: 12px;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      margin: 50px auto 6px;
      width: 70%;
    }
    .sig-name {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
    }
    .sig-role {
      font-size: 11px;
      color: #64748b;
    }
    .footer {
      text-align: center;
      padding: 24px 16px;
      color: #94a3b8;
      font-size: 11px;
      line-height: 1.7;
      margin-top: 10px;
    }

    /* Print Optimizations */
    @media print {
      @page {
        margin: 12mm 15mm;
        size: A4 portrait;
      }
      body {
        background: #ffffff !important;
        padding: 0 !important;
        color: #0f172a !important;
      }
      .no-print, .report-actions-bar {
        display: none !important;
      }
      .container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .hero, .card, .sess-card {
        box-shadow: none !important;
      }
      .card, .sess-card, .sig-grid {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .hero {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Top Action Bar for interactive printing and downloading -->
    <div class="no-print report-actions-bar">
      <div class="report-actions-inner">
        <div class="report-actions-brand">
          <span class="report-actions-icon">⚡</span>
          <span>Laporan Sesi — ${escapeHtml(clientName)}</span>
        </div>
        <div class="report-actions-btns">
          <button type="button" onclick="window.print()" class="btn-action btn-print" id="btn-print-report">
            🖨️ Cetak / Simpan PDF
          </button>
          <button type="button" onclick="downloadHtmlReport()" class="btn-action btn-download" id="btn-download-html">
            💾 Download File HTML
          </button>
          <button type="button" onclick="window.close()" class="btn-action btn-close" id="btn-close-report">
            ✕ Tutup
          </button>
        </div>
      </div>
    </div>

    <!-- Executive Hero -->
    <div class="hero">
      <div class="hero-top">
        <div class="brand-wrap">
          <img class="logo-img" src="${ELPRIAN_LOGO_BASE64}" alt="Elprian Training Logo">
          <div>
            <div class="brand-title">ELPRIAN TRAINING</div>
            <div class="brand-sub">Executive Fitness Report</div>
          </div>
        </div>
        <span class="report-no">🛡 ${escapeHtml(reportNo)}</span>
      </div>
      <div class="hero-meta">
        <div>
          <div class="meta-lbl">Klien</div>
          <div class="meta-val">${escapeHtml(clientName)}</div>
        </div>
        <div>
          <div class="meta-lbl">Head Coach</div>
          <div class="meta-val">${escapeHtml(trainerName)}</div>
        </div>
        <div>
          <div class="meta-lbl">Tanggal Cetak</div>
          <div class="meta-val">${escapeHtml(printDate)}</div>
        </div>
        <div>
          <div class="meta-lbl">Paket</div>
          <div class="meta-val">${escapeHtml(packageName)}</div>
        </div>
        <div>
          <div class="meta-lbl">Integritas Data</div>
          <div class="meta-val">${integrityBadge}</div>
        </div>
      </div>
    </div>

    <!-- Client Info Card -->
    <div class="card">
      <div class="client-grid">
        <div class="avatar">${escapeHtml(clientInitial)}</div>
        <div>
          <div class="client-name">${escapeHtml(clientName)}</div>
          <div style="font-size:13px;color:#475569;margin-top:4px;">🎯 ${escapeHtml(clientGoal)}</div>
          <div>
            <span class="tag tag-green">⭐ VIP Personal Coaching</span>
            <span class="tag tag-blue">📞 ${escapeHtml(clientPhone)}</span>
            <span class="tag" style="background:#f1f5f9;color:#475569">📅 Bergabung ${escapeHtml(joinDate)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Session KPI Card -->
    <div class="card">
      <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:16px;">📊 Session KPI — Package Accounting</div>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-icon">📦</div>
          <div class="kpi-val">${totalPackageSessions}</div>
          <div class="kpi-lbl">Total Package</div>
          <span class="kpi-sub" style="background:#f1f5f9;color:#475569;">${escapeHtml(packageName)}</span>
        </div>
        <div class="kpi">
          <div class="kpi-icon">🎯</div>
          <div class="kpi-val" style="color:#0f172a;">${consumedCount}</div>
          <div class="kpi-lbl">Consumed</div>
          <span class="kpi-sub" style="background:rgba(16,185,129,0.1);color:#059669;">Complete + No Show</span>
        </div>
        <div class="kpi">
          <div class="kpi-icon">⏳</div>
          <div class="kpi-val" style="color:#FF5A1F;">${remainingSessions}</div>
          <div class="kpi-lbl">Remaining</div>
          <span class="kpi-sub" style="background:rgba(255,90,31,0.1);color:#FF5A1F;">Sisa Sesi</span>
        </div>
        <div class="kpi">
          <div class="kpi-icon">📈</div>
          <div class="kpi-val" style="color:#3b82f6;">${progressPercent}%</div>
          <div class="kpi-lbl">Progress</div>
          <span class="kpi-sub" style="background:rgba(59,130,246,0.1);color:#2563eb;">${consumedCount} / ${totalPackageSessions}</span>
        </div>
      </div>
      <div class="prog-bg">
        <div class="prog-fill" style="width:${progressPercent}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#64748b;">
        <span>${consumedCount} dari ${totalPackageSessions} sesi terlaksana</span>
        <span>Tgl Beli: ${escapeHtml(purchaseDate)}</span>
      </div>
    </div>

    <!-- Status Breakdown Card -->
    <div class="card">
      <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:16px;">📋 Status Breakdown Training History</div>
      <div class="status-grid">
        <div class="stat-item">
          <div class="stat-num" style="color:#059669;">${completeCount}</div>
          <div class="stat-lbl">✓ Complete</div>
        </div>
        <div class="stat-item">
          <div class="stat-num" style="color:#ea580c;">${noShowCount}</div>
          <div class="stat-lbl">⚠️ No Show</div>
        </div>
        <div class="stat-item">
          <div class="stat-num" style="color:#d97706;">${scheduledCount}</div>
          <div class="stat-lbl">📅 Scheduled</div>
        </div>
        <div class="stat-item">
          <div class="stat-num" style="color:#dc2626;">${cancelCount}</div>
          <div class="stat-lbl">✕ Cancel</div>
        </div>
      </div>
      <div style="margin-top:12px; font-size:12px; color:#64748b; background:#f8fafc; padding:10px 14px; border-radius:10px; border-left:4px solid #FF5A1F;">
        <strong>Consumed = Complete + No Show</strong> (${consumedCount} sesi). Scheduled dan Cancel tidak dihitung sebagai sesi terpakai.
      </div>
    </div>

    <!-- Session Reconciliation Card -->
    <div class="card">
      <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:16px;">🔎 Session Reconciliation</div>
      <div class="recon-row">
        <span class="recon-label">Package Quota Total</span>
        <span class="recon-val">${totalPackageSessions} sesi</span>
      </div>
      <div class="recon-row">
        <span class="recon-label">Package Quota Used</span>
        <span class="recon-val">${packageQuotaUsed} sesi</span>
      </div>
      <div class="recon-row">
        <span class="recon-label">Training Records — Consumed</span>
        <span class="recon-val">${consumedCount} sesi</span>
      </div>
      <div class="recon-row">
        <span class="recon-label">Training Records — Total (semua status)</span>
        <span class="recon-val">${sortedSessions.length} records</span>
      </div>
      <div class="recon-row">
        <span class="recon-label">Selisih (Package vs History)</span>
        <span class="recon-val" style="color:${diff === 0 ? '#059669' : '#dc2626'};">${diff} sesi</span>
      </div>
      <div class="recon-row">
        <span class="recon-label">Status Integritas</span>
        <span class="recon-val">${integrityBadge}</span>
      </div>
    </div>

    <!-- Training History Timeline -->
    <div class="card">
      <div class="sess-head">
        <span>📋 Training History Timeline</span>
        <span class="tag tag-green">${sortedSessions.length} Total Records</span>
      </div>
      ${
        sortedSessions.length === 0
          ? '<p style="text-align:center;color:#64748b;padding:20px;">Belum ada riwayat sesi latihan.</p>'
          : sessionCardsHtml
      }
    </div>

    <!-- Training Insight Card -->
    <div class="card">
      <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:12px;">💡 Training Insight</div>
      <div class="insight-box">
        <div class="insight-txt">
          <strong>${escapeHtml(clientName)}</strong> telah menyelesaikan <strong>${consumedCount} sesi latihan terverifikasi</strong> (${completeCount} Complete, ${noShowCount} No Show) dari paket <strong>${escapeHtml(packageName)}</strong>.${
            lastCompleted
              ? ` Sesi latihan terakhir tercatat pada <strong>${escapeHtml(lastSessionDate)}</strong> dengan program <strong>${escapeHtml(lastProgram)}</strong> dan RPE <strong>${lastRpe}/10</strong>.`
              : ''
          } Rata-rata RPE <strong>${avgRpeFormatted}/10</strong> menunjukkan intensitas latihan yang <strong>${intensityDesc}</strong>.
        </div>
      </div>
    </div>

    <!-- Milestone & Achievements Card -->
    <div class="card">
      <div style="font-size:16px;font-weight:900;color:#0f172a;margin-bottom:14px;">🏆 Milestone & Achievements</div>
      <div class="milestone-grid">
        <div class="milestone">
          <div class="milestone-ico">🏆</div>
          <div class="milestone-txt">${consumedCount} Sesi Verified</div>
        </div>
        <div class="milestone">
          <div class="milestone-ico">⚡</div>
          <div class="milestone-txt">${intensityBadgeText} RPE ${avgRpeFormatted}</div>
        </div>
        <div class="milestone">
          <div class="milestone-ico">💪</div>
          <div class="milestone-txt">Progression Strong</div>
        </div>
      </div>
    </div>

    <!-- Catatan & Rekomendasi Pelatih -->
    <div class="card" style="border-left:5px solid #FF5A1F;">
      <div style="font-size:15px;font-weight:900;color:#0f172a;margin-bottom:10px;">🗣️ Catatan & Rekomendasi Pelatih</div>
      <div style="font-size:13px;color:#475569;line-height:1.7;background:#f8fafc;padding:14px;border-radius:12px;">
        Klien menunjukkan dedikasi dan konsistensi dalam program latihan. Pertahankan hidrasi harian (min. 2.5L), asupan protein optimal, dan kualitas tidur 7–8 jam untuk mendukung pemulihan dan pertumbuhan otot secara maksimal.
      </div>
      <div class="sig-grid">
        <div class="sig-box">
          <div class="sig-name">${escapeHtml(trainerName)}</div>
          <div class="sig-role">${escapeHtml(trainerRole)}</div>
          <div class="sig-line"></div>
          <div style="font-size:10px;color:#94a3b8;">Tanda Tangan Coach</div>
        </div>
        <div class="sig-box">
          <div class="sig-name">${escapeHtml(clientName)}</div>
          <div class="sig-role">Klien Executive</div>
          <div class="sig-line"></div>
          <div style="font-size:10px;color:#94a3b8;">Tanda Tangan Klien</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <strong>ELPRIAN TRAINING — EXECUTIVE FITNESS REPORT</strong><br>
      Report No: ${escapeHtml(reportNo)} • Dicetak: ${escapeHtml(printDate)}<br>
      <small>Dokumen resmi & rahasia. © ${now.getFullYear()} Elprian Training. Data berdasarkan Training History Aktual.</small>
    </div>
  </div>

  <script>
    function downloadHtmlReport() {
      // Create a clean copy of the document without any external modification
      const content = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ${JSON.stringify(defaultDownloadFilename)};
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  </script>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
