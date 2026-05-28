'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname, useRouter } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import AnalysisDetailView from '@/components/AnalysisDetailView'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorAnalysisDetail({ params }) {
  const { id } = use(params)
  const pathname = usePathname()
  const router = useRouter()
  const basePath = pathname.startsWith('/admin') ? '/admin' : '/professor'
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState(null)
  const [student, setStudent] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Batch navigation
  const [batchIds, setBatchIds] = useState([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    async function load() {
      // Join analysis + profile in one query
      const { data: a } = await supabase
        .from('analyses')
        .select('id, user_id, file_name, file_url, job_position, total_score, scores, suggestions, status, created_at, batch_id, extracted_name, skills_analysis, evaluation_mode, pass_threshold, profiles(first_name, last_name, student_id, username)')
        .eq('id', id)
        .single()

      if (!a) { setLoading(false); return }

      const p = a.profiles || null

      // ถ้ามี batch_id → โหลด list ของ IDs ใน batch เดียวกัน
      if (a.batch_id) {
        const { data: batchData } = await supabase
          .from('analyses')
          .select('id')
          .eq('batch_id', a.batch_id)
          .order('created_at', { ascending: true })
        if (batchData) {
          const ids = batchData.map(b => b.id)
          setBatchIds(ids)
          setCurrentIndex(ids.indexOf(a.id))
        }
      } else {
        setBatchIds([])
        setCurrentIndex(-1)
      }

      const { data: c } = await supabase
        .from('scoring_criteria')
        .select('category, max_score')
        .order('id')

      setAnalysis({ ...a, profiles: undefined })
      setStudent(p)
      if (c && c.length > 0) {
        setCategories(c.map(x => ({
          key: x.category,
          label: t(`result.${x.category}`) || x.category,
          max: x.max_score
        })))
      } else {
        setCategories([
          { key: 'contactInfo', label: t('result.contactInfo'), max: 10 },
          { key: 'skills', label: t('result.skills'), max: 25 },
          { key: 'experience', label: t('result.experience'), max: 30 },
          { key: 'education', label: t('result.education'), max: 15 },
          { key: 'structure', label: t('result.structure'), max: 20 },
        ])
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function goToBatchItem(index) {
    if (index >= 0 && index < batchIds.length) {
      router.push(`${basePath}/analyze/${batchIds[index]}`)
    }
  }

  if (loading) {
    return (
      <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
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
      </AuthLayout>
    )
  }

  if (!analysis) {
    return (
      <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
        <p style={{ textAlign: 'center', color: 'var(--text-gray)', padding: 60 }}>
          {t('result.notFound')}
        </p>
      </AuthLayout>
    )
  }

  // ใช้ extracted_name (จาก Resume) ถ้ามี, fallback เป็นชื่อ profile
  const studentName = analysis?.extracted_name
    || (student?.first_name ? `${student.first_name} ${student.last_name || ''}` : null)
    || student?.username || '-'

  return (
    <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
      {/* Batch navigation */}
      {batchIds.length > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--primary-light)', border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 16
        }}>
          <button
            onClick={() => goToBatchItem(currentIndex - 1)}
            disabled={currentIndex <= 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 14px', fontSize: 13, fontWeight: 500,
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              background: currentIndex <= 0 ? 'var(--surface)' : '#fff',
              color: currentIndex <= 0 ? 'var(--text-light)' : 'var(--primary)',
              cursor: currentIndex <= 0 ? 'default' : 'pointer'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t('common.prev')}
          </button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
              {currentIndex + 1} / {batchIds.length}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-gray)' }}>
              {analysis?.file_name}
            </p>
          </div>
          <button
            onClick={() => goToBatchItem(currentIndex + 1)}
            disabled={currentIndex >= batchIds.length - 1}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 14px', fontSize: 13, fontWeight: 500,
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
              background: currentIndex >= batchIds.length - 1 ? 'var(--surface)' : '#fff',
              color: currentIndex >= batchIds.length - 1 ? 'var(--text-light)' : 'var(--primary)',
              cursor: currentIndex >= batchIds.length - 1 ? 'default' : 'pointer'
            }}
          >
            {t('common.next')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      <AnalysisDetailView
        analysis={analysis}
        categories={categories}
        backLink={`${basePath}/analyses`}
        newLink={`${basePath}/analyze`}
        extraHeader={student && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, color: 'var(--primary)' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-dark)', fontWeight: 500 }}>
                {t('professor.student')}: <strong>{studentName}</strong>
              </p>
              {student.student_id && (
                <p style={{ fontSize: 12, color: 'var(--text-gray)' }}>
                  {t('professor.studentId')}: {student.student_id}
                </p>
              )}
            </div>
          </div>
        )}
      />
    </AuthLayout>
  )
}
