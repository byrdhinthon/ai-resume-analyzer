'use client'
import { useEffect } from 'react'
import { useLanguage } from '@/lib/LanguageContext'

export default function HtmlLang() {
  const { locale } = useLanguage()

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
