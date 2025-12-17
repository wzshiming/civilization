/**
 * Language selector component
 */

import { memo } from 'react';
import { useI18n, type Locale } from '../i18n';
import './LanguageSelector.css';

function LanguageSelectorComponent() {
  const { locale, setLocale, t } = useI18n();

  const languages: { value: Locale; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'zh-CN', label: '简体中文' },
  ];

  return (
    <div className="language-selector">
      <label htmlFor="language-select">{t.language}:</label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const LanguageSelector = memo(LanguageSelectorComponent);
