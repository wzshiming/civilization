import { useState, useEffect, useCallback } from 'react';
import type { WorldMap, Parcel } from './types/map';
import { generateWorldMap } from './map-generator';
import { MapRenderer } from './components/MapRenderer';
import { ParcelDetailPanel } from './components/ParcelDetailPanel';
import { ControlPanel } from './components/ControlPanel';
import { useSimulation } from './hooks/useSimulation';
import './App.css';

function App() {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(() => {
    // Generate initial map on mount
    return null;
  });
  const [selectedParcel, setSelectedParcel] = useState<Parcel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapConfig, setMapConfig] = useState<{ numParcels: number; seed?: number }>({
    numParcels: 500,
  });

  const { isSimulating, simulationSpeed, toggleSimulation, changeSpeed } = useSimulation(worldMap);

  // Map generation effect
  useEffect(() => {
    // Use setTimeout to allow UI to update
    const timer = setTimeout(() => {
      const map = generateWorldMap({
        width: 1200,
        height: 800,
        numParcels: mapConfig.numParcels,
        seed: mapConfig.seed,
      });
      setWorldMap(map);
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [mapConfig]);

  const handleRegenerateMap = useCallback(
    (config: { numParcels: number; seed?: number }) => {
      setIsLoading(true);
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
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Generating world map...</p>
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
          <p>Failed to generate map</p>
        </div>
      )}
    </div>
  );
}

export default App;
