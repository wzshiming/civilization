import React from 'react';
import { GameMap } from '../../../../src/types';
import styles from '../Sidebar.module.css';

interface MapStatisticsPanelProps {
  map: GameMap | null;
}

const MapStatisticsPanel: React.FC<MapStatisticsPanelProps> = ({ map }) => {
  const getTerrainStats = () => {
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
  };

  const terrainStats = getTerrainStats();

  return (
    <div className={styles.panel}>
      <h2>MAP STATISTICS</h2>
      <div className={styles.stats}>
        {Object.entries(terrainStats).map(([name, count]) => (
          <div key={name} className={styles.stat}>
            <span>{name}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MapStatisticsPanel;
