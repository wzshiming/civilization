import { useState, useCallback } from 'react';
import type { Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { TabPanel } from './components/TabPanel';
import type { Tab } from './components/TabPanel';
import { ConfigurationTabContent } from './components/ConfigurationTabContent';
import { LanguageSelector } from './components/LanguageSelector';
import { useSSE } from './hooks/useSSE';
import { useI18n } from './i18n';
import './App.css';
import './components/ConfigurationTabContent.css';

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
    setTimeout(() => connect(), 100);
  }, [connect, disconnect]);

  // Define tabs for the left sidebar
  const tabs: Tab[] = [
    {
      id: 'config',
      label: 'Config',
      icon: '⚙️',
      content: (
        <ConfigurationTabContent
          isConnected={isConnected}
          onReconnect={handleReconnect}
        />
      ),
    },
    // Additional tabs can be added here in the future
  ];

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
          <TabPanel tabs={tabs} />
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
