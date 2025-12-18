import React, { useMemo } from 'react';
import { GameMap } from '../../../src/types';
import { Tool, EditHistory } from '../App';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  zoom: number;
  totalPlots: number;
  selectedCount: number;
  map?: GameMap | null;
  currentTool?: Tool;
  editHistory?: EditHistory;
}

const StatusBar: React.FC<StatusBarProps> = ({
  zoom,
  totalPlots,
  selectedCount,
  map,
  currentTool,
  editHistory,
}) => {
  const terrainStats = useMemo(() => {
    if (!map) return {};
    const stats: Record<string, number> = {};
    map.plots.forEach((plot) => {
      const terrain = map.terrainTypes.find(
        (t) => t.terrainTypeID === plot.plotAttributes.terrainType
      );
      const name = terrain?.name || 'Unknown';
      stats[name] = (stats[name] || 0) + 1;
    });
    return stats;
  }, [map]);

  const selectedPercentage = totalPlots > 0 ? ((selectedCount / totalPlots) * 100).toFixed(1) : '0';

  return (
    <div className={styles.statusBar}>
      <div className={styles.leftSection}>
        <div className={styles.item}>
          <span className={styles.label}>Zoom:</span>
          <span className={styles.value}>{zoom}%</span>
        </div>
        <div className={styles.item}>
          <span className={styles.label}>Tool:</span>
          <span className={styles.value}>{currentTool || 'SELECT'}</span>
        </div>
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.detailsGrid}>
          <div className={styles.detailGroup}>
            <div className={styles.groupTitle}>Map Info</div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total Plots:</span>
              <span className={styles.detailValue}>{totalPlots}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Selected:</span>
              <span className={styles.detailValue}>
                {selectedCount} ({selectedPercentage}%)
              </span>
            </div>
            {editHistory && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Edits:</span>
                <span className={styles.detailValue}>
                  {editHistory.undoStack.length}
                </span>
              </div>
            )}
          </div>
          
          {Object.keys(terrainStats).length > 0 && (
            <div className={styles.detailGroup}>
              <div className={styles.groupTitle}>Terrain Distribution</div>
              {Object.entries(terrainStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => (
                  <div key={name} className={styles.detailItem}>
                    <span className={styles.detailLabel}>{name}:</span>
                    <span className={styles.detailValue}>
                      {count} ({((count / totalPlots) * 100).toFixed(1)}%)
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
