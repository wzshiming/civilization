import React from 'react';
import { GameMap, Plot } from '../../../../src/types';
import { EditHistory } from '../../App';
import styles from '../Sidebar.module.css';

interface PlotPropertiesPanelProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  selectedUnitType: string | null;
  selectedClusterType: string | null;
  editHistory: EditHistory;
  onUpdateMap: (map: GameMap) => void;
  onUpdateHistory: (history: EditHistory) => void;
}

// Generate unique ID
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatNumber = (num: number) => {
  return num.toFixed(2);
};

const PlotPropertiesPanel: React.FC<PlotPropertiesPanelProps> = ({
  map,
  selectedPlots,
  selectedUnitType,
  selectedClusterType,
  editHistory,
  onUpdateMap,
  onUpdateHistory,
}) => {
  const selectedPlot = map && selectedPlots.size > 0 
    ? map.plots.find((p) => selectedPlots.has(p.plotID))
    : null;

  const selectedTerr = selectedPlot && map
    ? map.terrainTypes.find((t) => t.terrainTypeID === selectedPlot.plotAttributes.terrainType)
    : null;

  const handleTerrainChange = (newTerrainTypeID: string) => {
    if (!map) return;

    const changes = Array.from(selectedPlots).map((plotID) => {
      const p = map.plots.find((plot) => plot.plotID === plotID);
      if (!p) return null;
      return {
        plotID,
        oldTerrain: p.plotAttributes.terrainType,
        newTerrain: newTerrainTypeID,
      };
    }).filter((c): c is { plotID: string; oldTerrain: string; newTerrain: string } => c !== null);

    const newPlots = map.plots.map((p) => {
      if (selectedPlots.has(p.plotID)) {
        return {
          ...p,
          plotAttributes: {
            ...p.plotAttributes,
            terrainType: newTerrainTypeID,
          },
        };
      }
      return p;
    });

    const edit = {
      type: 'terrain' as const,
      plots: changes,
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const handleAddUnit = (unitTypeID: string) => {
    if (!map || selectedPlots.size === 0) return;
    
    const plotID = Array.from(selectedPlots)[0];
    const unitID = generateId();
    
    const newPlots = map.plots.map((p) => {
      if (p.plotID === plotID) {
        return {
          ...p,
          plotAttributes: {
            ...p.plotAttributes,
            units: [...p.plotAttributes.units, { unitID, unitTypeID, workerClusterIDs: [] }],
          },
        };
      }
      return p;
    });

    const edit = {
      type: 'unit' as const,
      action: 'add' as const,
      plotID,
      unitID,
      unitTypeID,
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const handleRemoveUnit = (unitID: string, unitTypeID: string) => {
    if (!map || selectedPlots.size === 0) return;
    
    const plotID = Array.from(selectedPlots)[0];
    
    const newPlots = map.plots.map((p) => {
      if (p.plotID === plotID) {
        return {
          ...p,
          plotAttributes: {
            ...p.plotAttributes,
            units: p.plotAttributes.units.filter(u => u.unitID !== unitID),
          },
        };
      }
      return p;
    });

    const edit = {
      type: 'unit' as const,
      action: 'remove' as const,
      plotID,
      unitID,
      unitTypeID,
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const handleAddCluster = (clusterTypeID: string) => {
    if (!map || selectedPlots.size === 0) return;
    
    const plotID = Array.from(selectedPlots)[0];
    const clusterID = generateId();
    const clusterType = map.clusterTypes.find(ct => ct.clusterTypeID === clusterTypeID);
    const clusterName = `${clusterType?.name || 'Unknown'} Group`;
    const initialSize = 10;
    
    const cluster = {
      clusterID,
      clusterTypeID,
      name: clusterName,
      description: '',
      skills: [],
      size: initialSize,
      relationships: [],
    };
    
    const newPlots = map.plots.map((p) => {
      if (p.plotID === plotID) {
        return {
          ...p,
          plotAttributes: {
            ...p.plotAttributes,
            clusters: [...p.plotAttributes.clusters, cluster],
          },
        };
      }
      return p;
    });

    const edit = {
      type: 'cluster' as const,
      action: 'add' as const,
      plotID,
      clusterID,
      clusterTypeID,
      clusterData: {
        name: clusterName,
        size: initialSize,
      },
    };

    onUpdateMap({ ...map, plots: newPlots, clusters: [...map.clusters, cluster] });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const handleRemoveCluster = (clusterID: string, clusterTypeID: string, name: string, size: number) => {
    if (!map || selectedPlots.size === 0) return;
    
    const plotID = Array.from(selectedPlots)[0];
    
    const newPlots = map.plots.map((p) => {
      if (p.plotID === plotID) {
        return {
          ...p,
          plotAttributes: {
            ...p.plotAttributes,
            clusters: p.plotAttributes.clusters.filter(c => c.clusterID !== clusterID),
          },
        };
      }
      return p;
    });

    const edit = {
      type: 'cluster' as const,
      action: 'remove' as const,
      plotID,
      clusterID,
      clusterTypeID,
      clusterData: {
        name,
        size,
      },
    };

    onUpdateMap({ ...map, plots: newPlots, clusters: map.clusters.filter(c => c.clusterID !== clusterID) });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  return (
    <div className={styles.panel}>
      <h2>
        PLOT PROPERTIES
        {selectedPlots.size > 1 && (
          <span className={styles.badge}> {selectedPlots.size}</span>
        )}
      </h2>
      {!selectedPlot ? (
        <div className={styles.emptyState}>
          <p>No plot selected</p>
        </div>
      ) : (
        <>
          {/* Basic Information */}
          <div className={styles.subsection}>
            <h3>Basic Info</h3>
            <div className={styles.stat}>
              <span>Area:</span>
              <span>{formatNumber(selectedPlot.area)}</span>
            </div>
            <div className={styles.stat}>
              <span>Perimeter:</span>
              <span>{formatNumber(selectedPlot.perimeter)}</span>
            </div>
            <div className={styles.stat}>
              <span>Neighbors:</span>
              <span>{selectedPlot.plotAttributes.neighborPlots.length}</span>
            </div>
          </div>

          {/* Terrain */}
          <div className={styles.subsection}>
            <h3>Terrain</h3>
            <select
              className={styles.select}
              value={selectedPlot.plotAttributes.terrainType}
              onChange={(e) => handleTerrainChange(e.target.value)}
            >
              {map?.terrainTypes.map((t) => (
                <option key={t.terrainTypeID} value={t.terrainTypeID}>
                  {t.name}
                </option>
              ))}
            </select>
            {selectedTerr && (
              <div className={styles.terrainPreview}>
                <div
                  className={styles.terrainColor}
                  style={{ backgroundColor: selectedTerr.color || '#888' }}
                />
                <span>{selectedTerr.name}</span>
              </div>
            )}
          </div>

          {/* Storage with detailed info */}
          <div className={styles.subsection}>
            <h3>Storage</h3>
            {selectedPlot.plotAttributes.storages.length === 0 ? (
              <div className={styles.stat}>
                <span>No storage</span>
              </div>
            ) : (
              selectedPlot.plotAttributes.storages.map((storage, idx) => {
                const resourceType = map?.resourceTypes.find(
                  (rt) => rt.resourceTypeID === storage.resourceType
                );
                return (
                  <div key={idx} className={styles.storageItem}>
                    <div className={styles.storageName}>
                      {resourceType?.name || storage.resourceType}
                    </div>
                    <div className={styles.storageBar}>
                      <div
                        className={styles.storageProgress}
                        style={{
                          width: `${Math.min((storage.size / storage.capacity) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <div className={styles.storageStats}>
                      <span>{formatNumber(storage.size)}</span>
                      <span>/</span>
                      <span>{formatNumber(storage.capacity)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Units */}
          <div className={styles.subsection}>
            <h3>Units ({selectedPlot.plotAttributes.units.length})</h3>
            {selectedPlot.plotAttributes.units.length === 0 ? (
              <div className={styles.stat}>
                <span>No units</span>
              </div>
            ) : (
              selectedPlot.plotAttributes.units.map((unit, idx) => {
                const unitType = map?.unitTypes.find(ut => ut.unitTypeID === unit.unitTypeID);
                return (
                  <div key={idx} className={styles.entityItem}>
                    <span className={styles.entityName}>{unitType?.name || unit.unitTypeID}</span>
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveUnit(unit.unitID, unit.unitTypeID)}
                      title="Remove unit"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
            {selectedUnitType && (
              <button 
                className={`${styles.button} ${styles.small}`}
                onClick={() => handleAddUnit(selectedUnitType)}
              >
                + Add {map?.unitTypes.find(ut => ut.unitTypeID === selectedUnitType)?.name || 'Unit'}
              </button>
            )}
          </div>

          {/* Clusters */}
          <div className={styles.subsection}>
            <h3>Clusters ({selectedPlot.plotAttributes.clusters.length})</h3>
            {selectedPlot.plotAttributes.clusters.length === 0 ? (
              <div className={styles.stat}>
                <span>No clusters</span>
              </div>
            ) : (
              selectedPlot.plotAttributes.clusters.map((cluster, idx) => {
                const clusterType = map?.clusterTypes.find(ct => ct.clusterTypeID === cluster.clusterTypeID);
                return (
                  <div key={idx} className={styles.entityItem}>
                    <div className={styles.entityInfo}>
                      <span className={styles.entityName}>{cluster.name || clusterType?.name || cluster.clusterTypeID}</span>
                      <span className={styles.entitySize}>Size: {cluster.size}</span>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveCluster(cluster.clusterID, cluster.clusterTypeID, cluster.name, cluster.size)}
                      title="Remove cluster"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
            {selectedClusterType && (
              <button 
                className={`${styles.button} ${styles.small}`}
                onClick={() => handleAddCluster(selectedClusterType)}
              >
                + Add {map?.clusterTypes.find(ct => ct.clusterTypeID === selectedClusterType)?.name || 'Cluster'}
              </button>
            )}
          </div>

          {/* Ownership */}
          <div className={styles.subsection}>
            <h3>Ownership</h3>
            <div className={styles.stat}>
              <span>{selectedPlot.plotAttributes.ownerClusterID || 'Unowned'}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PlotPropertiesPanel;
