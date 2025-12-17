import { useState, useCallback } from 'react';
import type { Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { ReadOnlyControlPanel } from './components/ReadOnlyControlPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { useSSE } from './hooks/useSSE';
import { useI18n } from './i18n';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function AppSSE() {
  const { t } = useI18n();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  const { worldMap, isConnected, error, connect, disconnect } = useSSE({
    url: `${BACKEND_URL}/events`,
    autoConnect: true,
  });

  const handleParcelClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

  const handleReconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  return (
    <div className="app">
      <LanguageSelector />
      {!worldMap ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>{isConnected ? t.loadingMap : 'Connecting to backend...'}</p>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <ReadOnlyControlPanel
            isConnected={isConnected}
            onReconnect={handleReconnect}
          />
          <MapRenderer worldMap={worldMap} onParcelClick={handleParcelClick} />
          <ParcelDetailPanel parcel={selectedParcel} onClose={handleClosePanel} />
          <div className="map-controls-hint">
            <strong>💡 Tip:</strong> Use <strong>WASD</strong> or <strong>Arrow Keys</strong> to move the map, <strong>Mouse Wheel</strong> or <strong>+/-</strong> to zoom
          </div>
        </>
      )}
    </div>
  );
}

export default AppSSE;
