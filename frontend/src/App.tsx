import { useState, useCallback, useMemo } from 'react';
import type { Parcel } from '@civilization/shared';
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
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const { worldMap, isConnected, error, connect, disconnect, updateCounter } = useSSE({
    url: `${BACKEND_URL}/events`,
    autoConnect: true,
  });

  // Get the current parcel from worldMap based on selectedParcelId
  // updateCounter ensures this re-computes when worldMap is updated in place
  const selectedParcel = useMemo(() => {
    if (!selectedParcelId || !worldMap) return null;
    return worldMap.parcels.get(selectedParcelId) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParcelId, worldMap, updateCounter]);

  const handleParcelClick = useCallback((parcel: Parcel) => {
    setSelectedParcelId(parcel.id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedParcelId(null);
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
          <MapRenderer worldMap={worldMap} onParcelClick={handleParcelClick} updateCounter={updateCounter} />
          <ParcelDetailPanel parcel={selectedParcel} onClose={handleClosePanel} />
        </>
      )}
    </div>
  );
}

export default AppSSE;
