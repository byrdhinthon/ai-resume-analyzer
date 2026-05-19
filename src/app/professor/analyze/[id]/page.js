'use client'
import { useState, useEffect, use } from 'react'
import { supabase } from '@/lib/supabase'
import { usePathname } from 'next/navigation'
import AuthLayout from '@/components/AuthLayout'
import AnalysisDetailView from '@/components/AnalysisDetailView'
import { useLanguage } from '@/lib/LanguageContext'

export default function ProfessorAnalysisDetail({ params }) {
  const { id } = use(params)
  const pathname = usePathname()
  const basePath = pathname.startsWith('/admin') ? '/admin' : '/professor'
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState(null)
  const [student, setStudent] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // Join analysis + profile in one query (eliminates N+1)
      const { data: a } = await supabase
        .from('analyses')
        .select('id, user_id, file_name, file_url, job_position, total_score, scores, suggestions, status, created_at, profiles(first_name, last_name, student_id, username)')
        .eq('id', id)
        .single()

      if (!a) { setLoading(false); return }

      const p = a.profiles || null

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
  }, [id, t])

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

  const studentName = student?.first_name
    ? `${student.first_name} ${student.last_name || ''}`
    : student?.username || '-'

  return (
    <AuthLayout requiredRole={basePath === '/admin' ? 'admin' : 'professor'}>
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
