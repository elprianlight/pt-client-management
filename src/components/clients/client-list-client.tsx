'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dumbbell,
  ChevronRight,
  X,
  UserPlus,
  Phone,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { format, subDays, differenceInDays } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { listClients } from '@/lib/actions/client'
import { WhatsAppModal } from '@/components/crm/whatsapp-modal'
import { WhatsAppIcon } from '@/components/ui/whatsapp-icon'
import { ClientCreateForm } from '@/components/clients/client-form'

type Client = Awaited<ReturnType<typeof listClients>>[number]

interface ClientListClientProps {
  initialData: Client[]
  totalCount: number
}

// Deterministic gradients for avatars
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
  'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

function getRelativeLastSession(date: Date | string | null | undefined): {
  text: string
  relative: string
  color: 'emerald' | 'amber' | 'rose' | 'muted'
} {
  if (!date) return { text: 'Belum pernah sesi', relative: 'No Session', color: 'muted' }
  const d = new Date(date)
  const now = new Date()
  const diffDays = differenceInDays(now, d)

  const dateFormatted = format(d, 'd MMM yyyy', { locale: idLocale })

  if (diffDays === 0) return { text: `${dateFormatted} · Hari ini`, relative: 'Hari ini', color: 'emerald' }
  if (diffDays === 1) return { text: `${dateFormatted} · Kemarin`, relative: 'Kemarin', color: 'emerald' }
  if (diffDays <= 3) return { text: `${dateFormatted} · ${diffDays} hari lalu`, relative: `${diffDays}h lalu`, color: 'emerald' }
  if (diffDays <= 7) return { text: `${dateFormatted} · ${diffDays} hari lalu`, relative: `${diffDays}h lalu`, color: 'amber' }
  return { text: `${dateFormatted} · ${diffDays} hari lalu`, relative: `${diffDays}h lalu`, color: 'rose' }
}

export function ClientListClient({ initialData, totalCount }: ClientListClientProps) {
  const router = useRouter()

  const [filterType, setFilterType] = useState<
    'all' | 'active' | 'low_session' | 'no_remaining' | 'inactive'
  >('all')
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false)
  const [selectedWAClient, setSelectedWAClient] = useState<Client | null>(null)

  // KPI Intelligence metrics
  const kpiStats = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)

    let activeCount = 0
    let lowCount = 0
    let noRemainingCount = 0
    let inactiveCount = 0

    initialData.forEach((c) => {
      const total = c.packageStats?.total ?? 0
      const used = c.packageStats?.used ?? 0
      const remaining = total - used

      if (remaining > 0) activeCount++
      if (total > 0 && remaining <= 2 && remaining > 0) lowCount++
      if (total > 0 && remaining <= 0) noRemainingCount++
      if (!c.lastSessionAt || new Date(c.lastSessionAt) < sevenDaysAgo) inactiveCount++
    })

    return {
      total: initialData.length,
      active: activeCount,
      low: lowCount,
      noRemaining: noRemainingCount,
      inactive: inactiveCount,
    }
  }, [initialData])

  // Filter & Urgency Sorting Logic
  const filteredAndSorted = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)

    // 1. Filter
    const result = initialData.filter((c) => {
      const total = c.packageStats?.total ?? 0
      const used = c.packageStats?.used ?? 0
      const remaining = total - used

      if (filterType === 'active') return remaining > 0
      if (filterType === 'low_session') return total > 0 && remaining <= 2 && remaining > 0
      if (filterType === 'no_remaining') return total > 0 && remaining <= 0
      if (filterType === 'inactive') return !c.lastSessionAt || new Date(c.lastSessionAt) < sevenDaysAgo
      return true
    })

    // 2. Default Smart Urgency Sort (Sisa Sedikit -> Habis -> Sisa Banyak)
    result.sort((a, b) => {
      const aTotal = a.packageStats?.total ?? 0
      const aUsed = a.packageStats?.used ?? 0
      const aRem = aTotal - aUsed

      const bTotal = b.packageStats?.total ?? 0
      const bUsed = b.packageStats?.used ?? 0
      const bRem = bTotal - bUsed

      // Priority 1: Sisa 1-2 (Perlu renewal)
      const aIsLow = aTotal > 0 && aRem <= 2 && aRem > 0 ? 1 : 0
      const bIsLow = bTotal > 0 && bRem <= 2 && bRem > 0 ? 1 : 0
      if (aIsLow !== bIsLow) return bIsLow - aIsLow

      // Priority 2: Sisa 0 (Habis)
      const aIsZero = aTotal > 0 && aRem <= 0 ? 1 : 0
      const bIsZero = bTotal > 0 && bRem <= 0 ? 1 : 0
      if (aIsZero !== bIsZero) return bIsZero - aIsZero

      // Priority 3: Sisa terkecil ke terbesar
      if (aRem !== bRem) return aRem - bRem

      return (a.user?.fullName || '').localeCompare(b.user?.fullName || '')
    })

    return result
  }, [initialData, filterType])

  return (
    <div className="sr-root animate-fade-in">
      {/* ─── 1. HEADER SUMMARY BAR (Konsep 2) ─── */}
      <div className="sr-summary-bar">
        <div className="sr-summary-items">
          <button
            type="button"
            className={`sr-sum-item ${filterType === 'active' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'active' ? 'all' : 'active')}
            title="Filter Client Aktif"
          >
            <span className="sr-sum-dot dot-emerald" />
            <span className="sr-sum-val font-mono">{kpiStats.active}</span>
            <span className="sr-sum-label">Client Aktif</span>
          </button>

          <span className="sr-sum-divider">·</span>

          <button
            type="button"
            className={`sr-sum-item ${filterType === 'low_session' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'low_session' ? 'all' : 'low_session')}
            title="Filter Sisa ≤ 2 Sesi"
          >
            <span className="sr-sum-dot dot-amber" />
            <span className="sr-sum-val font-mono text-amber">{kpiStats.low}</span>
            <span className="sr-sum-label">Hampir Habis</span>
          </button>

          <span className="sr-sum-divider">·</span>

          <button
            type="button"
            className={`sr-sum-item ${filterType === 'no_remaining' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'no_remaining' ? 'all' : 'no_remaining')}
            title="Filter Sesi Habis"
          >
            <span className="sr-sum-dot dot-rose" />
            <span className="sr-sum-val font-mono text-rose">{kpiStats.noRemaining}</span>
            <span className="sr-sum-label">Sesi Habis</span>
          </button>

          <span className="sr-sum-divider">·</span>

          <button
            type="button"
            className={`sr-sum-item ${filterType === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterType(filterType === 'inactive' ? 'all' : 'inactive')}
            title="Filter Inaktif > 7 Hari"
          >
            <span className="sr-sum-dot dot-gray" />
            <span className="sr-sum-val font-mono">{kpiStats.inactive}</span>
            <span className="sr-sum-label">Inaktif (&gt; 7h)</span>
          </button>

          <span className="sr-sum-divider">·</span>

          <button
            type="button"
            className={`sr-sum-item ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
            title="Tampilkan Semua Client"
          >
            <span className="sr-sum-label">Total:</span>
            <span className="sr-sum-val font-mono text-brand">{kpiStats.total}</span>
          </button>
        </div>

        <button
          type="button"
          className="sr-add-btn"
          onClick={() => setIsAddClientModalOpen(true)}
          id="btn-add-client-top"
        >
          <UserPlus size={15} strokeWidth={2.4} />
          <span>+ Client</span>
        </button>
      </div>

      {/* ─── 2. SMART ROSTER CLIENT CARDS ─── */}
      {filteredAndSorted.length === 0 ? (
        <div className="sr-empty-state">
          <div className="sr-empty-icon-wrap">
            <Dumbbell size={32} />
          </div>
          <h3 className="sr-empty-title">Tidak Ada Client Ditemukan</h3>
          <p className="sr-empty-desc">
            Tidak ada data client pada kategori filter ini.
          </p>
          {filterType !== 'all' && (
            <button
              type="button"
              className="sr-empty-reset-btn"
              onClick={() => setFilterType('all')}
            >
              Tampilkan Semua Client
            </button>
          )}
        </div>
      ) : (
        <div className="sr-grid">
          {filteredAndSorted.map((client, idx) => {
            const name = client.user?.fullName ?? 'Klien'
            const username = client.user?.username ? `@${client.user.username}` : ''
            const initial = name.charAt(0).toUpperCase()
            const gradient = getGradient(name)

            const stats = client.packageStats
            const total = stats?.total ?? 0
            const used = stats?.used ?? 0
            const remaining = total - used
            const lastPackageName = stats?.lastPackageName ?? null
            const goal = client.fitnessGoal || 'General Fitness'

            // Urgency & Status logic
            const isNoPackage = total === 0
            const isExpired = total > 0 && remaining <= 0
            const isLowSession = total > 0 && remaining > 0 && remaining <= 2
            const isHealthy = remaining > 2

            const cardBorderClass = isExpired
              ? 'border-rose'
              : isLowSession
              ? 'border-amber'
              : isHealthy
              ? 'border-emerald'
              : 'border-neutral'

            // Progress percentage
            const progressPct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0

            // Relative Last Session
            const lastSessionInfo = getRelativeLastSession(client.lastSessionAt)

            return (
              <div
                key={client.id}
                className={`sr-card ${cardBorderClass}`}
                onClick={() => router.push(`/clients/${client.id}`)}
                id={`client-card-${client.id}`}
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                {/* Card Top: Avatar + Client Info + Status Badge */}
                <div className="sr-card-top">
                  <div className="sr-avatar-wrap">
                    <div className="sr-avatar" style={{ background: gradient }}>
                      {initial}
                    </div>
                    <span
                      className={`sr-online-dot ${
                        isExpired ? 'dot-rose' : isLowSession ? 'dot-amber' : isHealthy ? 'dot-emerald' : 'dot-gray'
                      }`}
                    />
                  </div>

                  <div className="sr-card-identity">
                    <div className="sr-name-row">
                      <span className="sr-client-name">{name}</span>
                      {username && <span className="sr-client-username">{username}</span>}
                    </div>

                    <div className="sr-client-tags">
                      <span className="sr-tag sr-tag-goal">🎯 {goal}</span>
                      {lastPackageName && (
                        <span className="sr-tag sr-tag-pkg">📦 {lastPackageName}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="sr-status-badge-wrap">
                    {isLowSession ? (
                      <span className="sr-badge sr-badge-amber">
                        <AlertTriangle size={11} /> Sisa {remaining} Sesi
                      </span>
                    ) : isExpired ? (
                      <span className="sr-badge sr-badge-rose">
                        <X size={11} /> Sesi Habis
                      </span>
                    ) : isHealthy ? (
                      <span className="sr-badge sr-badge-emerald">
                        <CheckCircle2 size={11} /> Aktif ({remaining})
                      </span>
                    ) : (
                      <span className="sr-badge sr-badge-gray">Belum Ada Paket</span>
                    )}
                  </div>
                </div>

                {/* Card Mid: Visual Quota Progress Meter */}
                <div className="sr-quota-meter">
                  <div className="sr-quota-header font-mono">
                    <div className="sr-quota-counts">
                      <span className="sr-used-highlight">{String(used).padStart(2, '0')}</span>
                      <span className="sr-total-text"> / {String(total).padStart(2, '0')} Sesi Terpakai</span>
                    </div>
                    <div className="sr-remaining-pill">
                      {isNoPackage ? (
                        <span className="text-slate-400">0 Kuota</span>
                      ) : (
                        <span>
                          Sisa: <strong className={isLowSession ? 'text-amber' : isExpired ? 'text-rose' : 'text-emerald'}>{remaining}</strong> Sesi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* High Precision Progress Bar */}
                  <div className="sr-progress-track">
                    <div
                      className={`sr-progress-fill ${
                        isExpired ? 'fill-rose' : isLowSession ? 'fill-amber' : 'fill-emerald'
                      }`}
                      style={{ width: `${total === 0 ? 0 : progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Card Bottom: Intelligence Footer & Quick Actions */}
                <div className="sr-card-footer">
                  <div className="sr-footer-meta">
                    <div className="sr-meta-item">
                      <Clock size={12} className={`sr-icon-${lastSessionInfo.color}`} />
                      <span className="sr-meta-label">Terakhir:</span>
                      <span className={`sr-meta-value val-${lastSessionInfo.color}`}>
                        {lastSessionInfo.text}
                      </span>
                    </div>

                    {client.user?.phone && (
                      <div className="sr-meta-item">
                        <Phone size={12} className="text-slate-400" />
                        <span className="sr-meta-phone font-mono">{client.user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Direct Actions */}
                  <div className="sr-action-group" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="sr-wa-action-btn"
                      onClick={() => setSelectedWAClient(client)}
                      title={`Kirim WhatsApp ke ${name}`}
                    >
                      <WhatsAppIcon size={14} />
                      <span className="sr-action-label">WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      className="sr-detail-action-btn"
                      onClick={() => router.push(`/clients/${client.id}`)}
                      title="Lihat Detail Profil & Riwayat"
                    >
                      <span>Detail</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── 3. WHATSAPP QUICK ACTION MODAL ─── */}
      {selectedWAClient && (() => {
        const nextSess = selectedWAClient.nextSessionAt
          ? new Date(selectedWAClient.nextSessionAt)
          : null
        const sessionDateStr = nextSess
          ? format(nextSess, 'EEEE, d MMM', { locale: idLocale })
          : undefined
        const sessionTimeStr = nextSess
          ? format(nextSess, 'HH:mm')
          : undefined
        const remaining =
          (selectedWAClient.packageStats?.total ?? 0) -
          (selectedWAClient.packageStats?.used ?? 0)

        return (
          <WhatsAppModal
            isOpen={Boolean(selectedWAClient)}
            onClose={() => setSelectedWAClient(null)}
            clientData={{
              id: selectedWAClient.id,
              fullName: selectedWAClient.user?.fullName ?? 'Client',
              phone: selectedWAClient.user?.phone,
              fitnessGoal: selectedWAClient.fitnessGoal,
              remainingSessions: remaining,
              packageName: selectedWAClient.packageStats?.lastPackageName ?? undefined,
              sessionDate: sessionDateStr,
              sessionTime: sessionTimeStr,
            }}
            defaultTemplate={remaining <= 2 ? 'renewal' : 'confirmation'}
          />
        )
      })()}

      {/* ─── 4. ADD CLIENT MODAL DIALOG ─── */}
      {isAddClientModalOpen && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setIsAddClientModalOpen(false)}
        >
          <div
            className="modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 540 }}
          >
            <div className="mc-header">
              <div className="mc-title-group">
                <div className="mc-icon-badge">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="mc-title">Tambah Client Baru</h3>
                  <p className="mc-sub">Daftarkan akun dan profil klien baru</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(false)}
                className="mc-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mc-modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
              <ClientCreateForm
                onSuccess={() => {
                  setIsAddClientModalOpen(false)
                  router.refresh()
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. STYLES (Clean, Modern, Coding-Vibes) ─── */}
      <style jsx global>{`
        .sr-root {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 1100px;
          margin: 0 auto;
          padding-bottom: 90px;
        }

        .font-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        /* ─── Header Summary Bar (Konsep 2) ─── */
        .sr-summary-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: linear-gradient(135deg, rgba(22, 31, 50, 0.75) 0%, rgba(13, 19, 33, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 14px;
          padding: 8px 12px;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        [data-theme="light"] .sr-summary-bar {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .sr-summary-items {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          flex: 1;
        }

        .sr-summary-items::-webkit-scrollbar {
          display: none;
        }

        .sr-sum-item {
          display: flex;
          align-items: center;
          gap: 5px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 4px 7px;
          font-size: 12px;
          color: #94a3b8;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .sr-sum-item:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        [data-theme="light"] .sr-sum-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .sr-sum-item.active {
          background: rgba(99, 102, 241, 0.16);
          border-color: rgba(99, 102, 241, 0.4);
          color: #ffffff;
        }

        [data-theme="light"] .sr-sum-item.active {
          background: rgba(99, 102, 241, 0.1);
          border-color: #6366f1;
          color: #4f46e5;
        }

        .sr-sum-dot {
          width: 6.5px;
          height: 6.5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot-emerald { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.7); }
        .dot-amber { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.7); }
        .dot-rose { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.7); }
        .dot-gray { background: #64748b; }

        .sr-sum-val {
          font-weight: 800;
          color: #ffffff;
          font-size: 12.5px;
        }

        [data-theme="light"] .sr-sum-val {
          color: #0f172a;
        }

        .text-brand { color: #818cf8 !important; }
        .text-amber { color: #fbbf24 !important; }
        .text-rose { color: #f87171 !important; }

        .sr-sum-label {
          font-size: 11.5px;
          color: #94a3b8;
        }

        .sr-sum-item.active .sr-sum-label {
          color: #cbd5e1;
        }

        [data-theme="light"] .sr-sum-item.active .sr-sum-label {
          color: #4f46e5;
        }

        .sr-sum-divider {
          color: rgba(255, 255, 255, 0.2);
          font-weight: bold;
          font-size: 14px;
          user-select: none;
        }

        [data-theme="light"] .sr-sum-divider {
          color: #cbd5e1;
        }

        .sr-add-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border: none;
          border-radius: 9px;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 3px 10px rgba(99, 102, 241, 0.35);
        }

        .sr-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 15px rgba(99, 102, 241, 0.5);
        }

        .sr-add-btn:active {
          transform: scale(0.97);
        }

        /* Grid */
        .sr-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        @media (min-width: 768px) {
          .sr-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        /* Smart Roster Card */
        .sr-card {
          background: linear-gradient(135deg, rgba(26, 36, 56, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-left: 3.5px solid #64748b;
          border-radius: 16px;
          padding: 13px 15px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
        }

        [data-theme="light"] .sr-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .sr-card.border-emerald {
          border-left-color: #10b981;
        }
        .sr-card.border-amber {
          border-left-color: #f59e0b;
        }
        .sr-card.border-rose {
          border-left-color: #ef4444;
        }
        .sr-card.border-neutral {
          border-left-color: #64748b;
        }

        .sr-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
        }

        [data-theme="light"] .sr-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        }

        /* Card Top */
        .sr-card-top {
          display: flex;
          align-items: flex-start;
          gap: 11px;
        }

        .sr-avatar-wrap {
          position: relative;
          flex-shrink: 0;
        }

        .sr-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 17px;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .sr-online-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          border: 2px solid #0f172a;
        }

        [data-theme="light"] .sr-online-dot {
          border-color: #ffffff;
        }

        .sr-card-identity {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sr-name-row {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sr-client-name {
          font-size: 14.5px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        [data-theme="light"] .sr-client-name {
          color: #0f172a;
        }

        .sr-client-username {
          font-size: 11px;
          font-family: ui-monospace, monospace;
          color: #94a3b8;
        }

        .sr-client-tags {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .sr-tag {
          font-size: 10.5px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        [data-theme="light"] .sr-tag {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #475569;
        }

        .sr-tag-pkg {
          color: #a5b4fc;
          border-color: rgba(99, 102, 241, 0.25);
        }

        /* Status Badge */
        .sr-status-badge-wrap {
          flex-shrink: 0;
        }

        .sr-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 8px;
          white-space: nowrap;
        }

        .sr-badge-emerald {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #34d399;
        }

        .sr-badge-amber {
          background: rgba(245, 158, 11, 0.18);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #fbbf24;
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
        }

        .sr-badge-rose {
          background: rgba(239, 68, 68, 0.16);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #f87171;
        }

        .sr-badge-gray {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        /* Quota Meter */
        .sr-quota-meter {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 11px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        [data-theme="light"] .sr-quota-meter {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .sr-quota-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
        }

        .sr-quota-counts {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .sr-used-highlight {
          font-size: 13px;
          font-weight: 900;
          color: #ffffff;
        }

        [data-theme="light"] .sr-used-highlight {
          color: #0f172a;
        }

        .sr-total-text {
          color: #94a3b8;
        }

        .sr-remaining-pill {
          font-size: 11px;
          color: #cbd5e1;
        }

        [data-theme="light"] .sr-remaining-pill {
          color: #475569;
        }

        .text-emerald { color: #34d399; }
        .text-amber { color: #fbbf24; }
        .text-rose { color: #f87171; }

        .sr-progress-track {
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          overflow: hidden;
        }

        [data-theme="light"] .sr-progress-track {
          background: #e2e8f0;
        }

        .sr-progress-fill {
          height: 100%;
          border-radius: 10px;
          transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fill-emerald {
          background: linear-gradient(90deg, #10b981 0%, #06b6d4 100%);
        }
        .fill-amber {
          background: linear-gradient(90deg, #f59e0b 0%, #ea580c 100%);
        }
        .fill-rose {
          background: linear-gradient(90deg, #ef4444 0%, #be123c 100%);
        }

        /* Card Footer */
        .sr-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          flex-wrap: wrap;
        }

        [data-theme="light"] .sr-card-footer {
          border-top-color: #f1f5f9;
        }

        .sr-footer-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .sr-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
        }

        .sr-meta-label {
          color: #64748b;
        }

        .sr-meta-value {
          font-weight: 700;
        }

        .sr-meta-phone {
          color: #94a3b8;
          font-size: 11px;
        }

        .sr-icon-emerald { color: #10b981; }
        .sr-icon-amber { color: #f59e0b; }
        .sr-icon-rose { color: #ef4444; }
        .sr-icon-muted { color: #64748b; }

        .val-emerald { color: #34d399; }
        .val-amber { color: #fbbf24; }
        .val-rose { color: #f87171; }
        .val-muted { color: #94a3b8; }

        /* Action Buttons */
        .sr-action-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sr-wa-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(37, 211, 102, 0.14);
          border: 1px solid rgba(37, 211, 102, 0.35);
          color: #25d366;
          padding: 6px 9px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sr-wa-action-btn:hover {
          background: #25d366;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.35);
        }

        .sr-detail-action-btn {
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        [data-theme="light"] .sr-detail-action-btn {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #334155;
        }

        .sr-detail-action-btn:hover {
          background: rgba(99, 102, 241, 0.16);
          border-color: #6366f1;
          color: #ffffff;
        }

        [data-theme="light"] .sr-detail-action-btn:hover {
          background: #e2e8f0;
          color: #4f46e5;
        }

        /* Empty state */
        .sr-empty-state {
          background: rgba(19, 27, 46, 0.6);
          border: 1px dashed rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 48px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        [data-theme="light"] .sr-empty-state {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .sr-empty-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }

        .sr-empty-title {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        [data-theme="light"] .sr-empty-title {
          color: #0f172a;
        }

        .sr-empty-desc {
          font-size: 13px;
          color: #94a3b8;
          margin: 0;
          max-width: 360px;
        }

        .sr-empty-reset-btn {
          margin-top: 8px;
          background: rgba(99, 102, 241, 0.16);
          border: 1px solid #6366f1;
          color: #818cf8;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Mobile specific optimizations (< 640px) */
        @media (max-width: 640px) {
          .sr-top-bar {
            padding: 8px 10px;
            gap: 6px;
          }
          .sr-card {
            padding: 11px 12px;
          }
          .sr-avatar {
            width: 38px;
            height: 38px;
            font-size: 15px;
          }
          .sr-client-name {
            font-size: 13.5px;
          }
          .sr-action-label {
            display: none;
          }
          .sr-wa-action-btn {
            padding: 6px 8px;
          }
        }
      `}</style>
    </div>
  )
}
