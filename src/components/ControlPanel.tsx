/**
 * Control panel for simulation controls and map configuration
 */

import { useState } from 'react';
import { useI18n } from '../i18n';
import './ControlPanel.css';

interface ControlPanelProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onRegenerateMap: (config: { numParcels: number; seed?: number }) => void;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  timeFlowRate: number;
  onTimeFlowRateChange: (rate: number) => void;
  currentGameDay: number;
}

export function ControlPanel({
  isSimulating,
  onToggleSimulation,
  onRegenerateMap,
  simulationSpeed,
  onSpeedChange,
  timeFlowRate,
  onTimeFlowRateChange,
  currentGameDay,
}: ControlPanelProps) {
  const { t } = useI18n();
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
        <h3>{t.simulation}</h3>
        <button
          className={`control-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={onToggleSimulation}
        >
          {isSimulating ? t.pause : t.start}
        </button>

        <div className="time-display">
          <label>{t.gameDay}: {Math.floor(currentGameDay)}</label>
        </div>

        <div className="speed-control">
          <label>{t.speed}: {simulationSpeed.toFixed(1)}x</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={simulationSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          />
        </div>

        <div className="speed-control">
          <label>{t.timeFlowRate}: {timeFlowRate.toFixed(1)} {t.gameDaysPerSecond}</label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={timeFlowRate}
            onChange={(e) => onTimeFlowRateChange(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="control-group">
        <button
          className="control-button secondary"
          onClick={() => setShowConfig(!showConfig)}
        >
          {showConfig ? t.closeConfig : t.mapConfig}
        </button>

        {showConfig && (
          <div className="config-panel">
            <div className="config-field">
              <label htmlFor="numParcels">{t.numberOfParcels}</label>
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
              <label htmlFor="seed">{t.seedOptional}</label>
              <input
                id="seed"
                type="text"
                placeholder={t.random}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </div>

            <button className="control-button primary" onClick={handleRegenerate}>
              {t.regenerateMap}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
