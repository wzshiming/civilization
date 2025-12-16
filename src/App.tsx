import { useState, useEffect, useCallback } from 'react';
import type { WorldMap, Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { ControlPanel } from './components/ControlPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { useSSESimulation } from './hooks/useSSESimulation';
import { api } from './api/client';
import { useI18n } from './i18n';
import './App.css';

function App() {
  const { t } = useI18n();
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapConfig, setMapConfig] = useState<{ numParcels: number; seed?: number }>({
    numParcels: 500,
  });

  const { isSimulating, simulationSpeed, isConnected, toggleSimulation, changeSpeed } =
    useSSESimulation(worldMap, setWorldMap);

  // Map generation effect - now using backend API
  useEffect(() => {
    const generateMap = async () => {
      try {
        setIsLoading(true);
        const map = await api.generateMap({
          width: 1200,
          height: 800,
          numParcels: mapConfig.numParcels,
          seed: mapConfig.seed,
        });
        setWorldMap(map);
      } catch (error) {
        console.error('Error generating map:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateMap();
  }, [mapConfig]);

  const handleRegenerateMap = useCallback(
    (config: { numParcels: number; seed?: number }) => {
      setSelectedParcel(null);
      setMapConfig(config);
    },
    []
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
      {!isConnected && (
        <div className="connection-status">
          <p>⚠️ Connecting to backend server...</p>
        </div>
      )}
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>{t.loadingMap}</p>
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
