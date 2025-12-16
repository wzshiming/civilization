import { useState, useCallback } from 'react';
import type { Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { ControlPanel } from './components/ControlPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { useBackend } from './hooks/useBackend';
import { useI18n } from './i18n';
import './App.css';

function App() {
  const { t } = useI18n();
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);

  const {
    worldMap,
    isSimulating,
    simulationSpeed,
    isConnected,
    error,
    toggleSimulation,
    changeSpeed,
    generateMap,
  } = useBackend();

  const handleRegenerateMap = useCallback(
    (config: { numParcels: number; seed?: number }) => {
      setSelectedParcel(null);
      generateMap(config);
    },
    [generateMap]
  );

  const handleParcelClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

  return (
    <div className="app">
      <LanguageSelector />
      {!isConnected ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>{error || t.loadingMap}</p>
        </div>
      ) : worldMap ? (
        <>
          <ControlPanel
            isSimulating={isSimulating}
            onToggleSimulation={toggleSimulation}
            onRegenerateMap={handleRegenerateMap}
            simulationSpeed={simulationSpeed}
            onSpeedChange={changeSpeed}
          />
          <MapRenderer worldMap={worldMap} onParcelClick={handleParcelClick} />
          <ParcelDetailPanel parcel={selectedParcel} onClose={handleClosePanel} />
          <div className="map-controls-hint">
            <strong>💡 Tip:</strong> Use <strong>WASD</strong> or <strong>Arrow Keys</strong> to move the map, <strong>Mouse Wheel</strong> or <strong>+/-</strong> to zoom
          </div>
        </>
      ) : (
        <div className="error-screen">
          <p>{t.mapGenerationFailed}</p>
        </div>
      )}
    </div>
  );
}

export default App;
