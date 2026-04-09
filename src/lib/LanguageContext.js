'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { t } from './i18n'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState('th')

  useEffect(() => {
    const saved = localStorage.getItem('locale')
    if (saved) setLocale(saved)
  }, [])

  const toggleLanguage = () => {
    const newLocale = locale === 'th' ? 'en' : 'th'
    setLocale(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  return (
    <LanguageContext.Provider value={{ locale, toggleLanguage, t: t(locale) }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
