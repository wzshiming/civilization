/**
 * i18n system for managing translations
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './locales/en'
import { zhCN } from './locales/zh-CN'
import type { TranslationKeys } from './locales/en'
import type { Locale } from './types'

export type { Locale } from './types'

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

const locales: Record<Locale, TranslationKeys> = {
  en,
  'zh-CN': zhCN,
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'civilization-locale'

// Get initial locale from localStorage or browser language
function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
  if (stored && (stored === 'en' || stored === 'zh-CN')) {
    return stored
  }

  // Check browser language
  const browserLang = navigator.language
  if (browserLang.startsWith('zh')) {
    return 'zh-CN'
  }

  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
  }

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: locales[locale],
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
