'use client'

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 24 }}>
        <div style={{
          width: 64, height: 64, background: '#FEE2E2', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
          เกิดข้อผิดพลาด
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-gray)', marginBottom: 24, lineHeight: 1.6 }}>
          {error?.message || 'มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง'}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: 14 }}
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="btn-secondary"
            style={{ padding: '10px 24px', fontSize: 14, textDecoration: 'none' }}
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  )
}
