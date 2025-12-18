import React, { useMemo } from 'react';
import { GameMap, Plot } from '../../../src/types';
import { Tool, EditHistory } from '../App';
import styles from './StatusBar.module.css';

const MAX_DISPLAYED_PLOTS = 3;
const PLOT_ID_DISPLAY_LENGTH = 8;

interface StatusBarProps {
  zoom: number;
  totalPlots: number;
  selectedCount: number;
  map?: GameMap | null;
  currentTool?: Tool;
  editHistory?: EditHistory;
  selectedPlots?: Set<string>;
  onUpdateMap?: (map: GameMap) => void;
  onUpdateHistory?: (history: EditHistory) => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  zoom,
  totalPlots,
  selectedCount,
  map,
  currentTool,
  editHistory,
  selectedPlots,
  onUpdateMap,
  onUpdateHistory,
}) => {
  const selectedPlotDetails = useMemo(() => {
    if (!map || !selectedPlots || selectedPlots.size === 0) return null;
    
    // Get all selected plot objects
    const plots = map.plots.filter(plot => selectedPlots.has(plot.plotID));
    return plots;
  }, [map, selectedPlots]);

  const handleTerrainChange = (plotID: string, newTerrainType: string) => {
    if (!map || !onUpdateMap || !editHistory || !onUpdateHistory) return;

    const plot = map.plots.find(p => p.plotID === plotID);
    if (!plot) return;

    const oldTerrain = plot.plotAttributes.terrainType;
    if (oldTerrain === newTerrainType) return;

    const newPlots = map.plots.map(p =>
      p.plotID === plotID
        ? {
            ...p,
            plotAttributes: {
              ...p.plotAttributes,
              terrainType: newTerrainType,
            },
          }
        : p
    );

    const edit = {
      type: 'terrain' as const,
      plots: [{ plotID, oldTerrain, newTerrain: newTerrainType }],
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

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
        {selectedPlotDetails && selectedPlotDetails.length > 0 ? (
          <div className={styles.detailsGrid}>
            <div className={styles.detailGroup}>
              <div className={styles.groupTitle}>
                {selectedPlotDetails.length === 1 ? 'Selected Plot' : `${selectedPlotDetails.length} Plots Selected`}
              </div>
              {selectedPlotDetails.slice(0, MAX_DISPLAYED_PLOTS).map((plot) => {
                const terrain = map?.terrainTypes.find(
                  t => t.terrainTypeID === plot.plotAttributes.terrainType
                );
                return (
                  <div key={plot.plotID} className={styles.plotCard}>
                    <div className={styles.plotHeader}>
                      <span className={styles.plotID}>ID: {plot.plotID.substring(0, PLOT_ID_DISPLAY_LENGTH)}...</span>
                    </div>
                    <div className={styles.editableField}>
                      <span className={styles.fieldLabel}>Terrain:</span>
                      <select 
                        className={styles.fieldSelect}
                        value={plot.plotAttributes.terrainType}
                        onChange={(e) => handleTerrainChange(plot.plotID, e.target.value)}
                      >
                        {map?.terrainTypes.map(t => (
                          <option key={t.terrainTypeID} value={t.terrainTypeID}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Area:</span>
                      <span className={styles.detailValue}>{plot.area.toFixed(2)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Perimeter:</span>
                      <span className={styles.detailValue}>{plot.perimeter.toFixed(2)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Neighbors:</span>
                      <span className={styles.detailValue}>{plot.plotAttributes.neighborPlots.length}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Buildings:</span>
                      <span className={styles.detailValue}>{plot.plotAttributes.buildings.length}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Species:</span>
                      <span className={styles.detailValue}>{plot.plotAttributes.species.length}</span>
                    </div>
                    {plot.plotAttributes.ownerPlayerID && (
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Owner:</span>
                        <span className={styles.detailValue}>{plot.plotAttributes.ownerPlayerID}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {selectedPlotDetails.length > MAX_DISPLAYED_PLOTS && (
                <div className={styles.moreIndicator}>
                  + {selectedPlotDetails.length - MAX_DISPLAYED_PLOTS} more plots
                </div>
              )}
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default StatusBar;
