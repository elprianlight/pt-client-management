import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function ClientDetail({ 
  clientData, 
  packages, 
  sessions, 
  measurements 
}: { 
  clientData: any
  packages: any[]
  sessions: any[]
  measurements: any[]
}) {
  return (
    <div className="client-detail-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION: Basic Info */}
      <div className="detail-section">
        <h3 className="detail-section-title">Informasi Akun</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Nama Lengkap</span>
            <span className="detail-value">{clientData.user?.fullName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Username</span>
            <span className="detail-value">@{clientData.user?.username}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nomor HP</span>
            <span className="detail-value">{clientData.user?.phone || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status Akun</span>
            <span className={`badge ${clientData.user?.isActive ? 'badge-success' : 'badge-error'}`}>
              {clientData.user?.isActive ? 'Aktif' : 'Non-aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: Physical Data */}
      <div className="detail-section">
        <h3 className="detail-section-title">Data Fisik & Medis</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Jenis Kelamin</span>
            <span className="detail-value">
              {clientData.gender === 'male' ? 'Laki-laki' : clientData.gender === 'female' ? 'Perempuan' : clientData.gender === 'other' ? 'Lainnya' : '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Tanggal Lahir</span>
            <span className="detail-value">
              {clientData.dateOfBirth ? format(new Date(clientData.dateOfBirth), 'dd MMMM yyyy', { locale: id }) : '—'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Tinggi Badan</span>
            <span className="detail-value">{clientData.heightCm ? `${clientData.heightCm} cm` : '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Berat Badan (Awal)</span>
            <span className="detail-value">{clientData.weightKg ? `${clientData.weightKg} kg` : '—'}</span>
          </div>
          <div className="detail-item" style={{ gridColumn: 'span 2' }}>
            <span className="detail-label">Catatan Medis</span>
            <span className="detail-value" style={{ whiteSpace: 'pre-wrap' }}>{clientData.notes || '—'}</span>
          </div>
        </div>
      </div>

      {/* SECTION: Emergency Contact */}
      <div className="detail-section">
        <h3 className="detail-section-title">Kontak Darurat</h3>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Nama Kontak</span>
            <span className="detail-value">{clientData.emergencyContactName || '—'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Nomor HP Darurat</span>
            <span className="detail-value">{clientData.emergencyContactPhone || '—'}</span>
          </div>
        </div>
      </div>

      {/* SECTION: Active Packages */}
      <div className="detail-section">
        <h3 className="detail-section-title">Paket Aktif</h3>
        {packages.length === 0 ? (
          <p className="detail-value" style={{ color: 'var(--text-muted)' }}>Belum ada paket aktif.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {packages.map(pkg => (
              <div key={pkg.id} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{pkg.packageName}</strong>
                  <span className="badge badge-brand">{pkg.usedSessions} / {pkg.totalSessions} Sesi</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Berlaku hingga: {format(new Date(pkg.expiresAt), 'dd MMM yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: Recent Sessions */}
      <div className="detail-section">
        <h3 className="detail-section-title">5 Sesi Terakhir</h3>
        {sessions.length === 0 ? (
          <p className="detail-value" style={{ color: 'var(--text-muted)' }}>Belum ada riwayat sesi.</p>
        ) : (
          <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '8px' }}>Tanggal</th>
                <th style={{ padding: '8px' }}>Paket</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(sess => (
                <tr key={sess.id} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{format(new Date(sess.scheduledAt), 'dd MMM yyyy, HH:mm')}</td>
                  <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{sess.packageName}</td>
                  <td style={{ padding: '8px' }}>
                    <span className={`badge ${sess.status === 'completed' ? 'badge-success' : sess.status === 'scheduled' ? 'badge-brand' : 'badge-error'}`}>
                      {sess.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
