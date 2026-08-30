export default function DashboardLoading() {
  return (
    <div className="page-container animate-fade-in" style={{ padding: '24px 28px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div className="skeleton" style={{ width: '220px', height: '28px', borderRadius: '8px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '340px', height: '16px', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="skeleton" style={{ width: '110px', height: '40px', borderRadius: '10px' }} />
          <div className="skeleton" style={{ width: '130px', height: '40px', borderRadius: '10px' }} />
        </div>
      </div>

      {/* Metric Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '32px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '16px',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px' }} />
            </div>
            <div className="skeleton" style={{ width: '80px', height: '32px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '140px', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="skeleton" style={{ width: '180px', height: '20px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '240px', height: '36px', borderRadius: '8px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton" style={{ width: '40%', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '25%', height: '12px', borderRadius: '4px' }} />
              </div>
              <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }} />
              <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
