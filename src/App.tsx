import { useState, useEffect, useCallback } from 'react';
import type { WorldMap, Parcel } from './types/map';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { ControlPanel } from './components/ControlPanel';
import { LanguageSelector } from './components/LanguageSelector';
import { useI18n } from './i18n';
import { connectSSE, getCurrentMap, generateMap, startSimulation, stopSimulation, setSimulationSpeed } from './api/client';
import './App.css';

function App() {
  const { t } = useI18n();
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeedState] = useState(1.0);

  // Connect to SSE stream for real-time updates
  useEffect(() => {
    const eventSource = connectSSE({
      onMap: (mapData) => {
        console.log('Received map from backend');
        // Convert parcels array back to Map
        const parcels = new Map(mapData.parcels.map((p: Parcel) => [p.id, p]));
        setWorldMap({
          ...mapData,
          parcels,
        });
        setIsLoading(false);
      },
      onUpdate: (update) => {
        console.log('Received update from backend');
        // Update parcels with new data
        setWorldMap((prevMap) => {
          if (!prevMap) return null;
          const newParcels = new Map(prevMap.parcels);
          update.parcels.forEach((parcel: Parcel) => {
            newParcels.set(parcel.id, parcel);
          });
          return {
            ...prevMap,
            parcels: newParcels,
            lastUpdate: update.lastUpdate,
          };
        });
        
        // Update selected parcel if it exists
        setSelectedParcel((prevSelected) => {
          if (!prevSelected) return null;
          const updatedParcel = update.parcels.find((p: Parcel) => p.id === prevSelected.id);
          return updatedParcel || prevSelected;
        });
      },
      onSimulation: (state) => {
        console.log('Received simulation state:', state);
        setIsSimulating(state.isSimulating);
        setSimulationSpeedState(state.speed);
      },
      onError: (error) => {
        console.error('SSE error:', error);
      },
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, []);

  // Load initial map on mount
  useEffect(() => {
    getCurrentMap()
      .then((response) => {
        if (response.success && response.map) {
          const parcels = new Map(response.map.parcels.map((p: Parcel) => [p.id, p]));
          setWorldMap({
            ...response.map,
            parcels,
          });
        }
      })
      .catch((error) => {
        console.error('Error loading initial map:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleRegenerateMap = useCallback(
    async (config: { numParcels: number; seed?: number }) => {
      setIsLoading(true);
      setSelectedParcel(null);
      
      const response = await generateMap({
        width: 1200,
        height: 800,
        numParcels: config.numParcels,
        seed: config.seed,
      });
      
      if (!response.success) {
        console.error('Failed to generate map:', response.error);
        setIsLoading(false);
      }
      // Map will be updated via SSE
    },
    []
  );

  const handleToggleSimulation = useCallback(async () => {
    if (isSimulating) {
      await stopSimulation();
    } else {
      await startSimulation();
    }
    // State will be updated via SSE
  }, [isSimulating]);

  const handleSpeedChange = useCallback(async (speed: number) => {
    await setSimulationSpeed(speed);
    // State will be updated via SSE
  }, []);

  const handleParcelClick = useCallback((parcel: Parcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedParcel(null);
  }, []);

  return (
    <div className="app">
      <LanguageSelector />
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>{t.loadingMap}</p>
        </div>
      ) : worldMap ? (
        <>
          <ControlPanel
            isSimulating={isSimulating}
            onToggleSimulation={handleToggleSimulation}
            onRegenerateMap={handleRegenerateMap}
            simulationSpeed={simulationSpeed}
            onSpeedChange={handleSpeedChange}
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
