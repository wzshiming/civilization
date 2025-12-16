/**
 * Custom hook for managing world simulation
 */

import { useState, useEffect, useCallback } from 'react';
import type { WorldMap } from '../types/map';
import { simulateWorld } from '../map-generator';

interface UseSimulationOptions {
  initialSpeed?: number;
  initialTimeFlowRate?: number;
}

export function useSimulation(worldMap: WorldMap | null, options: UseSimulationOptions = {}) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(options.initialSpeed || 1.0);
  const [timeFlowRate, setTimeFlowRate] = useState(options.initialTimeFlowRate || 1.0);
  const [lastUpdateTime, setLastUpdateTime] = useState(() => Date.now());

  useEffect(() => {
    if (!isSimulating || !worldMap) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = ((now - lastUpdateTime) / 1000) * simulationSpeed;

      simulateWorld(worldMap, deltaTime, timeFlowRate);
      setLastUpdateTime(now);

      // Force a re-render by triggering a state update
      // This is a workaround since WorldMap is mutated in place
      setIsSimulating((prev) => prev);
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [isSimulating, worldMap, simulationSpeed, timeFlowRate, lastUpdateTime]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
    if (!isSimulating) {
      setLastUpdateTime(Date.now());
    }
  }, [isSimulating]);

  const changeSpeed = useCallback((speed: number) => {
    setSimulationSpeed(speed);
  }, []);

  const changeTimeFlowRate = useCallback((rate: number) => {
    setTimeFlowRate(rate);
  }, []);

  return {
    isSimulating,
    simulationSpeed,
    timeFlowRate,
    toggleSimulation,
    changeSpeed,
    changeTimeFlowRate,
  };
}
