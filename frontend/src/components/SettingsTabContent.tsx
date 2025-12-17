/**
 * Settings tab content - includes language selection and other settings
 */

import { useI18n } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import './SettingsTabContent.css';

export function SettingsTabContent() {
  const { t } = useI18n();
  
  return (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>{t.language}</h3>
        <div className="settings-item">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}
