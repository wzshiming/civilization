/**
 * Settings tab content - includes language selection and other settings
 */

import { LanguageSelector } from './LanguageSelector';
import './SettingsTabContent.css';

export function SettingsTabContent() {
  return (
    <div className="settings-tab-content">
      <div className="settings-section">
        <h3>Language</h3>
        <div className="settings-item">
          <LanguageSelector />
        </div>
      </div>
    </div>
  );
}
