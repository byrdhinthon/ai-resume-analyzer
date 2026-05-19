'use client'
import { useLanguage } from '@/lib/LanguageContext'

export default function LanguageToggle() {
  const { locale, toggleLanguage, t } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      aria-label={locale === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
      style={{
        background: 'var(--input-bg)',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '6px 14px',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-gray)',
        cursor: 'pointer'
      }}
    >
      {t('nav.language')}
    </button>
  )
}
