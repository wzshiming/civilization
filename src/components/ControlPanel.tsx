/**
 * Control panel for simulation controls and map configuration
 */

import { useState } from 'react';
import './ControlPanel.css';

interface ControlPanelProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onRegenerateMap: (config: { numParcels: number; seed?: number }) => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export function ControlPanel({
  isSimulating,
  onToggleSimulation,
  onRegenerateMap,
  simulationSpeed,
  onSpeedChange,
}: ControlPanelProps) {
  const [numParcels, setNumParcels] = useState(500);
  const [seed, setSeed] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleRegenerate = () => {
    onRegenerateMap({
      numParcels,
      seed: seed ? parseInt(seed) : undefined,
    });
    setShowConfig(false);
  };

  return (
    <div className="control-panel">
      <div className="control-group">
        <h3>Simulation</h3>
        <button
          className={`control-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={onToggleSimulation}
        >
          {isSimulating ? '⏸ Pause' : '▶ Start'}
        </button>

        <div className="speed-control">
          <label>Speed: {simulationSpeed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={simulationSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="control-group">
        <button
          className="control-button secondary"
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? '✕ Close Config' : '⚙ Map Config'}
        </button>

        {showConfig && (
          <div className="config-panel">
            <div className="config-field">
              <label htmlFor="numParcels">Number of Parcels:</label>
              <input
                id="numParcels"
                type="number"
                min="100"
                max="2000"
                value={numParcels}
                onChange={(e) => setNumParcels(parseInt(e.target.value) || 500)}
              />
            </div>

            <div className="config-field">
              <label htmlFor="seed">Seed (optional):</label>
              <input
                id="seed"
                type="text"
                placeholder="Random"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </div>

            <button className="control-button primary" onClick={handleRegenerate}>
              🔄 Regenerate Map
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
