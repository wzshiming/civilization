import { useState, useCallback, useMemo } from 'react';
import type { Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { TabPanel } from './components/TabPanel';
import type { Tab } from './components/TabPanel';
import { ConfigurationTabContent } from './components/ConfigurationTabContent';
import { SettingsTabContent } from './components/SettingsTabContent';
import { useSSE } from './hooks/useSSE';
import { useI18n } from './i18n';
import './App.css';
import './components/ConfigurationTabContent.css';
import './components/SettingsTabContent.css';

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
  const tabs: Tab[] = useMemo(() => [
    {
      id: 'config',
      label: t.config,
      icon: '⚙️',
      content: (
        <ConfigurationTabContent
          isConnected={isConnected}
          onReconnect={handleReconnect}
        />
      ),
    },
    {
      id: 'settings',
      label: t.settings,
      icon: '🔧',
      content: <SettingsTabContent />,
    },
  ], [isConnected, handleReconnect, t.config, t.settings]);

  return (
    <div className="app">
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
        </>
      )}
    </div>
  );
}

export default AppSSE;
