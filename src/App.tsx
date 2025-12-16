import { useState, useEffect, useCallback } from 'react';
import MapView from './MapView';
import UIPanel from './UIPanel';
import { GameState, MapData } from './types';
import {
  initializeGame,
  generateResources,
  RESOURCE_GENERATION_INTERVAL,
  getAdjacentProvinces,
  canExplore,
  explore,
  getTribeResources,
} from './game';

export default function App() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Load map data
  useEffect(() => {
    fetch('/map.json')
      .then((response) => response.json())
      .then((data) => {
        setMapData(data);
        setGameState(initializeGame(data));
      })
      .catch((error) => {
        console.error('Failed to load map data:', error);
      });
  }, []);

  // Resource generation timer
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      setGameState((prevState) => {
        if (!prevState) return null;
        const newProvinces = new Map(prevState.provinces);
        generateResources(newProvinces);
        return {
          ...prevState,
          provinces: newProvinces,
        };
      });
    }, RESOURCE_GENERATION_INTERVAL);

    return () => clearInterval(interval);
  }, [gameState]);

  const handleProvinceClick = useCallback(
    (provinceId: string) => {
      if (!gameState || !mapData) return;

      const clickedProvince = gameState.provinces.get(provinceId);
      if (!clickedProvince) return;

      console.log('Province clicked:', {
        id: clickedProvince.id,
        name: clickedProvince.name,
        type: clickedProvince.type,
        owner: clickedProvince.owner,
        population: clickedProvince.population,
        food: clickedProvince.food,
        flint: clickedProvince.flint,
      });

      // If clicking on an unowned province, try to explore from selected province
      if (!clickedProvince.owner && gameState.selectedProvinceId) {
        const fromProvince = gameState.provinces.get(gameState.selectedProvinceId);
        if (fromProvince && fromProvince.owner) {
          const adjacentProvinces = getAdjacentProvinces(gameState.selectedProvinceId, mapData);
          
          if (adjacentProvinces.includes(provinceId)) {
            if (canExplore(fromProvince, clickedProvince)) {
              setGameState((prevState) => {
                if (!prevState) return null;
                const newProvinces = new Map(prevState.provinces);
                const newFromProvince = newProvinces.get(fromProvince.id)!;
                const newToProvince = newProvinces.get(clickedProvince.id)!;
                explore(newFromProvince, newToProvince);
                return {
                  ...prevState,
                  provinces: newProvinces,
                  selectedProvinceId: clickedProvince.id,
                };
              });
            } else {
              console.log('Cannot explore: insufficient resources or invalid target');
            }
          } else {
            console.log('Province is not adjacent');
          }
        }
      } else {
        // Just select the province
        setGameState((prevState) => {
          if (!prevState) return null;
          return {
            ...prevState,
            selectedProvinceId: provinceId,
          };
        });
      }
    },
    [gameState, mapData]
  );

  const handleProvinceHover = useCallback(
    (provinceId: string | null) => {
      setGameState((prevState) => {
        if (!prevState) return null;
        return {
          ...prevState,
          hoveredProvinceId: provinceId,
        };
      });
    },
    []
  );

  if (!mapData || !gameState) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
          color: '#666',
        }}
      >
        Loading...
      </div>
    );
  }

  const selectedProvince = gameState.selectedProvinceId
    ? gameState.provinces.get(gameState.selectedProvinceId) || null
    : null;

  const tribeResources = getTribeResources(gameState.provinces, 'tribe_1');

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <MapView
        mapData={mapData}
        provinces={gameState.provinces}
        selectedProvinceId={gameState.selectedProvinceId}
        hoveredProvinceId={gameState.hoveredProvinceId}
        onProvinceClick={handleProvinceClick}
        onProvinceHover={handleProvinceHover}
      />
      <UIPanel
        selectedProvince={selectedProvince}
        totalPopulation={tribeResources.totalPopulation}
        totalFood={tribeResources.totalFood}
        totalFlint={tribeResources.totalFlint}
      />
    </div>
  );
}
