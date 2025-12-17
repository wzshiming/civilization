/**
 * Configuration tab content - the content previously shown in ReadOnlyControlPanel
 * Now displayed inside a tab instead of floating
 */

import { useI18n } from '../i18n';

interface ConfigurationTabContentProps {
  isConnected: boolean;
  onReconnect: () => void;
}

export function ConfigurationTabContent({
  isConnected,
  onReconnect,
}: ConfigurationTabContentProps) {
  const { t } = useI18n();

  return (
    <div className="config-tab-content">
      <div className="config-section">
        <h3>{t.simulation}</h3>
        
        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? t.connectedStatus : t.disconnectedStatus}
          </span>
        </div>

        {!isConnected && (
          <button
            className="control-button secondary"
            onClick={onReconnect}
          >
            {'🔄 ' + t.reconnect}
          </button>
        )}
      </div>
    </div>
  );
}
