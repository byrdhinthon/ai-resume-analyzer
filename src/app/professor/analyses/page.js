'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import AuthLayout from '@/components/AuthLayout'
import AnalysisHistoryTable from '@/components/AnalysisHistoryTable'
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
        .select('*, profiles(first_name, last_name, student_id, username, role)')
        .order('created_at', { ascending: false })

      if (error) {
        const res = await supabase
          .from('analyses')
          .select('*')
          .order('created_at', { ascending: false })
        data = res.data
      }

      setAnalyses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Get unique positions for dropdown
  const positions = useMemo(() => {
    const set = new Set(analyses.map(a => a.job_position).filter(Boolean))
    return [...set].sort()
  }, [analyses])

  // Filtered analyses
  const filtered = useMemo(() => {
    return analyses.filter(item => {
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
        if (item.job_position !== positionFilter) return false
      }

      // Score filter
      if (scoreMin !== '') {
        const min = Number(scoreMin)
        if (item.total_score === null || item.total_score < min) return false
      }
      if (scoreMax !== '') {
        const max = Number(scoreMax)
        if (item.total_score === null || item.total_score > max) return false
      }

      return true
    })
  }, [analyses, search, roleFilter, positionFilter, scoreMin, scoreMax])

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
                    {t('filter.of') || 'จาก'} {analyses.length} {t('filter.items') || 'รายการ'}
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
          <AnalysisHistoryTable
            analyses={filtered}
            detailPath={(id) => `/professor/analyze/${id}`}
            showStudent={true}
          />
        )}
      </div>
    </AuthLayout>
  )
}
