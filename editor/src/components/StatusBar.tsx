import React from 'react';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  zoom: number;
  totalPlots: number;
  selectedCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
  zoom,
  totalPlots,
  selectedCount,
}) => {
  return (
    <div className={styles.statusBar}>
      <div className={styles.item}>
        <span className={styles.label}>Zoom:</span>
        <span className={styles.value}>{zoom}%</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Total Plots:</span>
        <span className={styles.value}>{totalPlots}</span>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Selected:</span>
        <span className={styles.value}>{selectedCount}</span>
      </div>
    </div>
  );
};

export default StatusBar;
