'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import Link from 'next/link'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorHistoryPage() {
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState('all')
  const [scoreMin, setScoreMin] = useState('')
  const [scoreMax, setScoreMax] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    async function load() {
      let { data, error } = await supabase
        .from('analyses')
        .select('id, user_id, file_name, job_position, total_score, status, created_at, profiles(first_name, last_name, student_id, username, role, email)')
        .order('created_at', { ascending: false })

      if (error) {
        const res = await supabase
          .from('analyses')
          .select('id, user_id, file_name, job_position, total_score, status, created_at')
          .order('created_at', { ascending: false })
        data = res.data
      }

      setAnalyses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Group analyses by user — one row per person with highest score
  const userSummaries = useMemo(() => {
    const map = {}
    analyses.forEach(a => {
      const uid = a.user_id
      if (!uid) return
      if (!map[uid]) {
        map[uid] = {
          user_id: uid,
          profiles: a.profiles,
          highestScore: a.total_score,
          bestPosition: a.total_score !== null ? a.job_position : null,
          bestAnalysisId: (a.status === 'completed' && a.total_score !== null) ? a.id : null,
          latestDate: a.created_at,
        }
      } else {
        const u = map[uid]
        if (a.total_score !== null && (u.highestScore === null || a.total_score > u.highestScore)) {
          u.highestScore = a.total_score
          u.bestPosition = a.job_position
          u.bestAnalysisId = a.id
        }
        if (a.created_at > u.latestDate) u.latestDate = a.created_at
      }
    })
    return Object.values(map).sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate))
  }, [analyses])

  // Get unique positions for dropdown
  const positions = useMemo(() => {
    const set = new Set(analyses.map(a => a.job_position).filter(Boolean))
    return [...set].sort()
  }, [analyses])

  // Filtered user summaries
  const filtered = useMemo(() => {
    return userSummaries.filter(item => {
      // Search filter (name, student_id)
      if (search.trim()) {
        const q = search.toLowerCase()
        const name = item.profiles?.first_name
          ? `${item.profiles.first_name} ${item.profiles.last_name || ''}`.toLowerCase()
          : (item.profiles?.username || '').toLowerCase()
        const sid = (item.profiles?.student_id || '').toLowerCase()
        if (!name.includes(q) && !sid.includes(q)) return false
      }

      // Role filter
      if (roleFilter !== 'all') {
        if ((item.profiles?.role || 'member') !== roleFilter) return false
      }

      // Position filter
      if (positionFilter !== 'all') {
        if (item.bestPosition !== positionFilter) return false
      }

      // Score filter
      if (scoreMin !== '') {
        const min = Number(scoreMin)
        if (item.highestScore === null || item.highestScore < min) return false
      }
      if (scoreMax !== '') {
        const max = Number(scoreMax)
        if (item.highestScore === null || item.highestScore > max) return false
      }

      return true
    })
  }, [userSummaries, search, roleFilter, positionFilter, scoreMin, scoreMax])

  const hasActiveFilter = search || roleFilter !== 'all' || positionFilter !== 'all' || scoreMin !== '' || scoreMax !== ''

  function clearFilters() {
    setSearch('')
    setRoleFilter('all')
    setPositionFilter('all')
    setScoreMin('')
    setScoreMax('')
  }

  return (
    <AuthLayout requiredRole="professor">
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-dark)' }}>
            {t('professor.historyTitle')}
          </h1>
          <Link href="/professor/analyze" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 18px', fontSize: 13 }}>
            {t('history.newAnalysis')}
          </Link>
        </div>

        {/* Filter section */}
        {!loading && analyses.length > 0 && (
          <div className="card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="var(--text-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)' }}>
                  {t('filter.title') || 'ตัวกรอง'}
                </span>
                {hasActiveFilter && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                    background: 'var(--primary)', color: '#fff'
                  }}>
                    {t('filter.active') || 'กำลังกรอง'}
                  </span>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M6 9l6 6 6-6" stroke="var(--text-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showFilters && (
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Row 1: Search + Role */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 6 }}>
                      {t('filter.search') || 'ค้นหาชื่อ / รหัสนักศึกษา'}
                    </label>
                    <div className="input-wrap">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--text-light)' }}>
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('filter.searchPlaceholder') || 'พิมพ์ชื่อหรือรหัส...'}
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 6 }}>
                      {t('filter.role') || 'ประเภทผู้ใช้'}
                    </label>
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 13,
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        background: 'var(--input-bg)', color: 'var(--text-dark)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">{t('filter.allRoles') || 'ทั้งหมด'}</option>
                      <option value="member">{t('filter.member') || 'นักศึกษา (Member)'}</option>
                      <option value="professor">{t('filter.professor') || 'อาจารย์ (Professor)'}</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Position + Score range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 6 }}>
                      {t('filter.position') || 'ตำแหน่งงาน'}
                    </label>
                    <select
                      value={positionFilter}
                      onChange={e => setPositionFilter(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', fontSize: 13,
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        background: 'var(--input-bg)', color: 'var(--text-dark)',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">{t('filter.allPositions') || 'ทุกตำแหน่ง'}</option>
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-gray)', display: 'block', marginBottom: 6 }}>
                      {t('filter.scoreRange') || 'ช่วงคะแนน'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreMin}
                        onChange={e => setScoreMin(e.target.value)}
                        placeholder="0"
                        style={{
                          flex: 1, padding: '10px 14px', fontSize: 13,
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          background: 'var(--input-bg)', color: 'var(--text-dark)',
                          width: '100%'
                        }}
                      />
                      <span style={{ color: 'var(--text-light)', fontSize: 13 }}>—</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreMax}
                        onChange={e => setScoreMax(e.target.value)}
                        placeholder="100"
                        style={{
                          flex: 1, padding: '10px 14px', fontSize: 13,
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          background: 'var(--input-bg)', color: 'var(--text-dark)',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter summary + clear */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-gray)' }}>
                    {t('filter.showing') || 'แสดง'}{' '}
                    <strong style={{ color: 'var(--text-dark)' }}>{filtered.length}</strong>{' '}
                    {t('filter.of') || 'จาก'} {userSummaries.length} {t('filter.people') || 'คน'}
                  </p>
                  {hasActiveFilter && (
                    <button
                      onClick={clearFilters}
                      style={{
                        fontSize: 13, color: '#DC2626', background: 'none',
                        border: 'none', cursor: 'pointer', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      {t('filter.clear') || 'ล้างตัวกรอง'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid var(--primary-light)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : analyses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 56, height: 56, background: 'var(--primary-light)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', marginBottom: 4 }}>
              {t('professor.noHistory')}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              {t('professor.startNow')}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 15, color: 'var(--text-gray)', marginBottom: 8 }}>
              {t('filter.noResults') || 'ไม่พบผลลัพธ์ที่ตรงกับตัวกรอง'}
            </p>
            <button
              onClick={clearFilters}
              style={{
                fontSize: 13, color: 'var(--primary)', background: 'none',
                border: 'none', cursor: 'pointer', fontWeight: 600
              }}
            >
              {t('filter.clear') || 'ล้างตัวกรอง'}
            </button>
          </div>
        ) : (
          <UserSummaryTable
            users={filtered}
            t={t}
          />
        )}
      </div>
    </AuthLayout>
  )
}

function UserSummaryTable({ users, t }) {
  const [copied, setCopied] = useState(false)

  const getScoreColor = (score) => {
    if (score >= 80) return '#16A34A'
    if (score >= 60) return '#D97706'
    return '#DC2626'
  }

  const getRoleLabel = (role) => {
    if (role === 'professor') return 'Professor'
    if (role === 'admin') return 'Admin'
    return 'Member'
  }

  const getName = (u) => {
    if (u.profiles?.first_name) return `${u.profiles.first_name} ${u.profiles.last_name || ''}`.trim()
    return u.profiles?.username || '-'
  }

  function copyToExcel() {
    const header = ['ประเภท', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'อีเมล', 'คะแนนสูงสุด', 'ตำแหน่งงาน']
    const rows = users.map(u => [
      getRoleLabel(u.profiles?.role),
      u.profiles?.student_id || '-',
      getName(u),
      u.profiles?.email || '-',
      u.highestScore !== null ? u.highestScore : '-',
      u.bestPosition || '-'
    ])
    const tsv = [header, ...rows].map(row => row.join('\t')).join('\n')
    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const headers = [
    t('history.role') || 'ประเภท',
    t('history.studentId') || 'รหัสนักศึกษา',
    t('history.student') || 'ชื่อ-นามสกุล',
    t('history.email') || 'อีเมล',
    t('history.highScore') || 'คะแนนสูงสุด',
    t('history.position') || 'ตำแหน่งงาน',
    ''
  ]

  return (
    <>
      {/* Copy to Excel */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={copyToExcel}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', fontSize: 13, fontWeight: 500,
            background: copied ? '#DCFCE7' : 'var(--surface)',
            color: copied ? '#16A34A' : 'var(--text-gray)',
            border: `1px solid ${copied ? '#16A34A' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('history.copied') || 'คัดลอกแล้ว!'}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {t('history.copyExcel') || 'Copy สำหรับ Excel'}
            </>
          )}
        </button>
      </div>

      {/* Desktop table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'none' }} id="desktop-user-table">
        <style>{`@media (min-width: 768px) { #desktop-user-table { display: block !important; } #mobile-user-cards { display: none !important; } }`}</style>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{
                    textAlign: i === 4 ? 'center' : 'left',
                    padding: '14px 16px', fontSize: 13, fontWeight: 600,
                    color: 'var(--text-gray)', background: 'var(--input-bg)',
                    whiteSpace: 'nowrap'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
                      background: u.profiles?.role === 'professor' ? '#DBEAFE' : 'var(--primary-light)',
                      color: u.profiles?.role === 'professor' ? '#2563EB' : 'var(--primary)'
                    }}>
                      {getRoleLabel(u.profiles?.role)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-gray)', fontFamily: 'monospace' }}>
                    {u.profiles?.student_id || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)', fontWeight: 500 }}>
                    {getName(u)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-gray)' }}>
                    {u.profiles?.email || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {u.highestScore !== null ? (
                      <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(u.highestScore) }}>
                        {u.highestScore}/100
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-dark)' }}>
                    {u.bestPosition || '-'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {u.bestAnalysisId && (
                      <Link href={`/professor/analyze/${u.bestAnalysisId}`}
                        style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {t('history.viewDetail')}
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div id="mobile-user-cards" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {users.map((u) => (
          <div key={u.user_id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 2 }}>
                  {getName(u)}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-light)', fontFamily: 'monospace' }}>
                    {u.profiles?.student_id || ''}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
                    background: u.profiles?.role === 'professor' ? '#DBEAFE' : 'var(--primary-light)',
                    color: u.profiles?.role === 'professor' ? '#2563EB' : 'var(--primary)'
                  }}>
                    {getRoleLabel(u.profiles?.role)}
                  </span>
                </div>
                {u.profiles?.email && (
                  <p style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{u.profiles.email}</p>
                )}
              </div>
              {u.highestScore !== null ? (
                <span style={{ fontSize: 16, fontWeight: 700, color: getScoreColor(u.highestScore), flexShrink: 0, marginLeft: 8 }}>
                  {u.highestScore}/100
                </span>
              ) : (
                <span style={{ color: 'var(--text-light)', flexShrink: 0, marginLeft: 8 }}>—</span>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: 'var(--text-gray)' }}>
                {u.bestPosition || '-'}
              </p>
              {u.bestAnalysisId && (
                <Link href={`/professor/analyze/${u.bestAnalysisId}`}
                  style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                  {t('history.viewDetail')}
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
