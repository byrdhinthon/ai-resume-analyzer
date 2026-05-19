'use client'
import Link from 'next/link'

export default function DashboardError({ error, reset }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
        <div style={{
          width: 56, height: 56, background: '#FEE2E2', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#DC2626" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="#DC2626" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', marginBottom: 8 }}>
          เกิดข้อผิดพลาด
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-gray)', marginBottom: 20 }}>
          {error?.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={reset} className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }}>
            ลองใหม่
          </button>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '8px 20px', fontSize: 13, textDecoration: 'none' }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  )
}
