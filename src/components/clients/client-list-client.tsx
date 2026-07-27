'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Dumbbell, ChevronRight, X, Loader2, Filter, MessageSquare } from 'lucide-react'
import { format, subDays, startOfMonth } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { listClients } from '@/lib/actions/client'
import { useThemeStore } from '@/store/theme-store'
import { WhatsAppModal } from '@/components/crm/whatsapp-modal'

type Client = Awaited<ReturnType<typeof listClients>>[number]

interface ClientListClientProps {
  initialData: Client[]
  totalCount: number
}

// Deterministic color gradient per client based on name initials
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

export function ClientListClient({ initialData, totalCount }: ClientListClientProps) {
  const router = useRouter()
  const { theme } = useThemeStore()
  const [search, setSearch] = useState('')
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'low_session' | 'inactive' | 'new_this_month' | 'has_remaining' | 'no_remaining'>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedWAClient, setSelectedWAClient] = useState<Client | null>(null)

  // Simulate subtle transparent loading state when search text changes
  useEffect(() => {
    if (search) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 150)
      return () => clearTimeout(timer)
    } else {
      setIsSearching(false)
    }
  }, [search])

  // Filter clients with Smart CRM Segmentation
  const filtered = useMemo(() => {
    let result = initialData
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    const currentMonthStart = startOfMonth(now)

    if (filterType === 'low_session') {
      result = result.filter(c => {
        const total = c.packageStats?.total ?? 0
        const used = c.packageStats?.used ?? 0
        const rem = total - used
        return total > 0 && rem <= 2
      })
    } else if (filterType === 'inactive') {
      result = result.filter(c => {
        if (!c.lastSessionAt) return true
        return new Date(c.lastSessionAt) < sevenDaysAgo
      })
    } else if (filterType === 'new_this_month') {
      result = result.filter(c => new Date(c.createdAt) >= currentMonthStart)
    } else if (filterType === 'has_remaining') {
      result = result.filter(c => ((c.packageStats?.total ?? 0) - (c.packageStats?.used ?? 0)) > 0)
    } else if (filterType === 'no_remaining') {
      result = result.filter(c => ((c.packageStats?.total ?? 0) - (c.packageStats?.used ?? 0)) <= 0)
    }

    if (!search.trim()) return result

    const q = search.toLowerCase()
    return result.filter(c =>
      c.user?.fullName?.toLowerCase().includes(q) ||
      c.user?.username?.toLowerCase().includes(q) ||
      c.user?.phone?.toLowerCase().includes(q) ||
      c.fitnessGoal?.toLowerCase().includes(q)
    )
  }, [search, filterType, initialData])

  const openSearchModal = () => {
    setIsSearchModalOpen(true)
  }

  const closeSearchModal = () => {
    setIsSearchModalOpen(false)
  }

  return (
    <div className="cl-root">
      {/* Interactive Search Bar Trigger */}
      <div className="cl-search-trigger" onClick={openSearchModal} id="btn-open-search-modal">
        <div className="search-input-inner">
          <Search size={18} className="search-icon-left" />
          <span className="search-placeholder-text">
            {search ? (
              <span className="search-active-text">"{search}"</span>
            ) : (
              'Cari nama, nomor HP, atau goal client...'
            )}
          </span>
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={(e) => {
                e.stopPropagation()
                setSearch('')
              }}
              title="Bersihkan Pencarian"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Client Cards List */}
      {filtered.length === 0 ? (
        <div className="cl-empty">
          <Dumbbell size={40} style={{ opacity: 0.3 }} />
          <p>Tidak ada client ditemukan.</p>
          {search && (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => setSearch('')}
            >
              Reset Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="cl-list">
          {filtered.map((client, idx) => {
            const name = client.user?.fullName ?? '—'
            const initial = name.charAt(0).toUpperCase()
            const gradient = getGradient(name)
            const stats = client.packageStats
            const total = stats?.total ?? 0
            const used = stats?.used ?? 0
            const remaining = total - used
            const lastPackageName = stats?.lastPackageName ?? null
            const lastSessionAt = client.lastSessionAt

            const goalText = client.fitnessGoal || lastPackageName || 'General Fitness'
            const subtitleText = [
              goalText,
              lastSessionAt
                ? format(new Date(lastSessionAt), 'dd/MM/yyyy', { locale: idLocale })
                : null,
            ].filter(Boolean).join(' · ')

            return (
              <button
                key={client.id}
                className="cl-card"
                onClick={() => router.push(`/clients/${client.id}`)}
                id={`client-card-${client.id}`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Avatar */}
                <div className="cl-avatar" style={{ background: gradient }}>
                  {initial}
                </div>

                {/* Info */}
                <div className="cl-info">
                  <div className="cl-name">{name}</div>
                  <div className="cl-subtitle">
                    {subtitleText || 'Belum ada paket · Belum ada sesi'}
                  </div>
                </div>

                {/* Session Stats Chips */}
                <div className="cl-stats">
                  <div className="cl-stat-chip cl-chip-neutral">
                    <span className="cl-chip-label">BELI</span>
                    <span className="cl-chip-value">{total}</span>
                  </div>
                  <div className="cl-stat-chip cl-chip-warning">
                    <span className="cl-chip-label">PAKAI</span>
                    <span className="cl-chip-value">{used}</span>
                  </div>
                  <div className="cl-stat-chip cl-chip-success">
                    <span className="cl-chip-label">SISA</span>
                    <span className="cl-chip-value">{remaining}</span>
                  </div>
                </div>

                {/* WA Quick Send Button */}
                <button
                  type="button"
                  className="cl-wa-quick-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedWAClient(client)
                  }}
                  title="Kirim WhatsApp"
                >
                  <MessageSquare size={15} />
                </button>

                <ChevronRight size={16} className="cl-arrow" />
              </button>
            )
          })}
        </div>
      )}

      {/* WhatsApp Modal Dialog */}
      {selectedWAClient && (
        <WhatsAppModal
          isOpen={Boolean(selectedWAClient)}
          onClose={() => setSelectedWAClient(null)}
          clientData={{
            id: selectedWAClient.id,
            fullName: selectedWAClient.user?.fullName ?? 'Client',
            phone: selectedWAClient.user?.phone,
            fitnessGoal: selectedWAClient.fitnessGoal,
            remainingSessions: (selectedWAClient.packageStats?.total ?? 0) - (selectedWAClient.packageStats?.used ?? 0),
          }}
          defaultTemplate={
            ((selectedWAClient.packageStats?.total ?? 0) - (selectedWAClient.packageStats?.used ?? 0)) <= 2
              ? 'renewal'
              : 'schedule'
          }
        />
      )}

      {/* Floating Add Button */}
      <button
        className="cl-fab"
        onClick={() => router.push('/clients/new')}
        aria-label="Tambah Client"
        id="btn-add-client-fab"
      >
        <Plus size={24} />
      </button>

      {/* 🚀 MODERN IN-APP SEARCH MODAL DIALOG */}
      {isSearchModalOpen && (
        <div className="search-modal-backdrop animate-fade-in" onClick={closeSearchModal}>
          <div className="search-modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header & Input */}
            <div className="search-modal-header">
              <div className="search-modal-input-wrap">
                <Search size={20} className="search-modal-icon" />
                <input
                  type="text"
                  className="search-modal-input"
                  placeholder="Ketik nama, nomor HP, atau goal client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  id="modal-search-input"
                />
                {isSearching ? (
                  <Loader2 size={18} className="search-spinner spin" />
                ) : search ? (
                  <button
                    type="button"
                    className="search-modal-clear-btn"
                    onClick={() => setSearch('')}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="search-modal-close-btn"
                onClick={closeSearchModal}
                id="btn-close-search-modal"
              >
                Tutup
              </button>
            </div>

            {/* Quick Filter Chips inside Modal */}
            <div className="search-modal-filters">
              <button
                type="button"
                className={`search-filter-chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Semua ({initialData.length})
              </button>
              <button
                type="button"
                className={`search-filter-chip ${filterType === 'has_remaining' ? 'active' : ''}`}
                onClick={() => setFilterType('has_remaining')}
              >
                Ada Sisa Sesi
              </button>
              <button
                type="button"
                className={`search-filter-chip ${filterType === 'no_remaining' ? 'active' : ''}`}
                onClick={() => setFilterType('no_remaining')}
              >
                Sesi Habis
              </button>
            </div>

            {/* Result Info */}
            <div className="search-results-meta">
              <span>
                Menampilkan <strong>{filtered.length}</strong> client
              </span>
              {search && <span className="query-tag">Kueri: "{search}"</span>}
            </div>

            {/* Modal Results List */}
            <div className="search-modal-body">
              {filtered.length === 0 ? (
                <div className="search-modal-empty">
                  <Dumbbell size={36} style={{ opacity: 0.3 }} />
                  <p>Tidak ada client yang cocok dengan pencarian.</p>
                </div>
              ) : (
                <div className="search-results-list">
                  {filtered.map((client) => {
                    const name = client.user?.fullName ?? '—'
                    const initial = name.charAt(0).toUpperCase()
                    const gradient = getGradient(name)
                    const stats = client.packageStats
                    const total = stats?.total ?? 0
                    const used = stats?.used ?? 0
                    const remaining = total - used

                    return (
                      <div
                        key={client.id}
                        className="search-result-item"
                        onClick={() => {
                          closeSearchModal()
                          router.push(`/clients/${client.id}`)
                        }}
                      >
                        <div className="result-avatar" style={{ background: gradient }}>
                          {initial}
                        </div>
                        <div className="result-info">
                          <span className="result-name">{name}</span>
                          <span className="result-sub">
                            {[client.fitnessGoal || 'General Fitness', client.user?.phone].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                        <div className="result-chips">
                          <span className="res-chip res-chip-neutral">BELI {total}</span>
                          <span className="res-chip res-chip-warning">PAKAI {used}</span>
                          <span className="res-chip res-chip-success">SISA {remaining}</span>
                        </div>
                        <ChevronRight size={16} className="result-arrow" />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .cl-root {
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          padding-bottom: 88px;
        }

        /* Search Bar Trigger */
        .cl-search-trigger {
          width: 100%;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 50px;
          padding: 6px;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .cl-search-trigger:hover {
          border-color: var(--border-brand);
          background: var(--bg-elevated);
        }
        .search-input-inner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          width: 100%;
        }
        :global(.search-icon-left) {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .search-placeholder-text {
          flex: 1;
          font-size: 14.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .search-active-text {
          color: var(--brand-primary);
          font-weight: 700;
        }
        :global(.clear-search-btn) {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-muted);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        :global(.clear-search-btn:hover) {
          color: var(--text-primary);
          border-color: var(--border-brand);
        }

        /* Empty state */
        .cl-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 60px 20px;
          color: var(--text-muted);
          background: var(--bg-surface);
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-xl);
          font-size: 14px;
        }

        /* List */
        .cl-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Client Card */
        .cl-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          min-height: 74px;
        }
        .cl-card:hover,
        .cl-card:focus-visible {
          border-color: var(--border-brand);
          background: var(--bg-elevated);
          transform: translateY(-1px);
        }
        .cl-card:active {
          transform: scale(0.985);
        }

        /* Avatar */
        .cl-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 20px;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        /* Info text */
        .cl-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .cl-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.3;
        }
        .cl-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Stats chips */
        .cl-stats {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .cl-stat-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          gap: 1px;
        }
        .cl-chip-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .cl-chip-value {
          font-size: 14px;
          font-weight: 900;
          line-height: 1;
        }
        .cl-chip-neutral {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
        }
        .cl-chip-warning {
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.25);
          color: #f59e0b;
        }
        .cl-chip-success {
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25);
          color: #10b981;
        }
        :global(.cl-wa-quick-btn) {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        :global(.cl-wa-quick-btn:hover) {
          background: #10b981;
          color: white;
        }

        :global(.cl-arrow) {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* Floating Action Button */
        .cl-fab {
          position: fixed;
          right: 20px;
          bottom: 84px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--gradient-brand);
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(99,102,241,0.45);
          transition: all var(--transition-fast);
          z-index: 40;
        }
        .cl-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 12px 32px rgba(99,102,241,0.6);
        }

        /* 🚀 IN-APP SEARCH MODAL DIALOG STYLES */
        .search-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          z-index: 9999;
          padding: 16px;
        }
        .search-modal-card {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 560px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6);
        }

        .search-modal-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface);
        }
        .search-modal-input-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 50px;
          padding: 8px 16px;
          transition: border-color var(--transition-fast);
        }
        .search-modal-input-wrap:focus-within {
          border-color: var(--brand-primary);
        }
        :global(.search-modal-icon) {
          color: var(--brand-primary);
          flex-shrink: 0;
        }
        .search-modal-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 15px;
          outline: none;
          font-weight: 500;
        }
        .search-modal-input::placeholder {
          color: var(--text-muted);
        }
        :global(.search-spinner) {
          color: var(--brand-primary);
          flex-shrink: 0;
        }
        :global(.search-modal-clear-btn) {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }
        :global(.search-modal-clear-btn:hover) {
          color: var(--text-primary);
        }
        :global(.search-modal-close-btn) {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: 50px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        :global(.search-modal-close-btn:hover) {
          background: var(--bg-surface);
          color: var(--text-primary);
          border-color: var(--border-brand);
        }

        .search-modal-filters {
          display: flex;
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-default);
          overflow-x: auto;
        }
        :global(.search-filter-chip) {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all var(--transition-fast);
        }
        :global(.search-filter-chip.active) {
          background: rgba(99,102,241,0.15);
          color: var(--brand-primary);
          border-color: var(--brand-primary);
        }

        .search-results-meta {
          padding: 8px 16px;
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          justify-content: space-between;
          background: rgba(0,0,0,0.15);
        }
        .query-tag {
          color: var(--brand-primary);
          font-weight: 600;
        }

        .search-modal-body {
          overflow-y: auto;
          max-height: 55vh;
          padding: 10px 14px;
        }
        .search-modal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: var(--text-muted);
          font-size: 13.5px;
        }

        .search-results-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .search-result-item:hover {
          background: var(--bg-elevated);
          border-color: var(--border-brand);
        }
        .result-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          color: white;
          flex-shrink: 0;
        }
        .result-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .result-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .result-sub {
          font-size: 11.5px;
          color: var(--text-muted);
        }
        .result-chips {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .res-chip {
          font-size: 9.5px;
          font-weight: 800;
          padding: 3px 6px;
          border-radius: 6px;
        }
        .res-chip-neutral {
          background: rgba(255,255,255,0.06);
          color: var(--text-secondary);
        }
        .res-chip-warning {
          background: rgba(245,158,11,0.15);
          color: #f59e0b;
        }
        .res-chip-success {
          background: rgba(16,185,129,0.15);
          color: #10b981;
        }
        :global(.result-arrow) {
          color: var(--text-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}
