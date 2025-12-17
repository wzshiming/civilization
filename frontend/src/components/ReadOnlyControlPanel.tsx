/**
 * Read-only control panel for viewing simulation status
 * Frontend cannot control speed or generate maps (backend-controlled)
 */

import { useI18n } from '../i18n'
import './ControlPanel.css'

interface ReadOnlyControlPanelProps {
  isConnected: boolean
  onReconnect: () => void
}

export function ReadOnlyControlPanel({ isConnected, onReconnect }: ReadOnlyControlPanelProps) {
  const { t } = useI18n()

  return (
    <div className="control-panel">
      <div className="control-group">
        <h3>{t.simulation}</h3>

        <div className="status-indicator">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
          <span className="status-text">
            {isConnected ? 'Connected to backend' : 'Disconnected'}
          </span>
        </div>

        {!isConnected && (
          <button className="control-button secondary" onClick={onReconnect}>
            🔄 Reconnect
          </button>
        )}

        <div className="info-panel">
          <p>
            <strong>Note:</strong> Simulation controls (start/stop, speed) are managed by the
            backend server.
          </p>
          <p>Maps are pre-generated using the map-generator-cli tool and loaded by the backend.</p>
        </div>
      </div>
    </div>
  )
}
