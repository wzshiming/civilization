import React from 'react';
import { StepResult } from '../../../../src/simulation';
import styles from '../Sidebar.module.css';

interface SimulationPanelProps {
  map: boolean;
  stepCount: number;
  lastStepResult: StepResult | null;
  onStep: () => void;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  map,
  stepCount,
  lastStepResult,
  onStep,
}) => {
  return (
    <div className={styles.panel}>
      <h2>SIMULATION</h2>
      <button onClick={onStep} className={styles.button} disabled={!map}>
        ⏭️ Step
      </button>
      <div className={styles.stat}>
        <span>Steps:</span>
        <span>{stepCount}</span>
      </div>
      {lastStepResult && (
        <>
          <div className={styles.stat}>
            <span>Processed:</span>
            <span>{lastStepResult.processedPlots} plots</span>
          </div>
          <div className={styles.stat}>
            <span>Changes:</span>
            <span>{lastStepResult.resourceChanges.length}</span>
          </div>
          {lastStepResult.errors.length > 0 && (
            <div className={styles.stat}>
              <span>Errors:</span>
              <span>{lastStepResult.errors.length}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SimulationPanel;
