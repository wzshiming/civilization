import React, { useRef } from 'react';
import { GameMap } from '../../../src/types';
import { StepResult } from '../../../src/simulation';
import { Tool, EditHistory } from '../App';
import styles from './Sidebar.module.css';

interface SidebarProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  currentTool: Tool;
  selectedTerrain: string | null;
  editHistory: EditHistory;
  stepCount: number;
  lastStepResult: StepResult | null;
  onGenerateMap: () => void;
  onLoadMap: (file: File) => void;
  onSaveMap: () => void;
  onSelectTool: (tool: Tool) => void;
  onSelectTerrain: (terrain: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onStep: () => void;
  onUpdateMap: (map: GameMap) => void;
  onUpdateHistory: (history: EditHistory) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  map,
  selectedPlots,
  currentTool,
  selectedTerrain,
  editHistory,
  stepCount,
  lastStepResult,
  onGenerateMap,
  onLoadMap,
  onSaveMap,
  onSelectTool,
  onSelectTerrain,
  onSelectAll,
  onClearSelection,
  onUndo,
  onRedo,
  onStep,
  onUpdateMap,
  onUpdateHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadMap(file);
    }
  };

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

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

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

  // Get the first selected plot for display in properties
  const selectedPlot = map && selectedPlots.size > 0 
    ? map.plots.find((p) => selectedPlots.has(p.plotID))
    : null;

  const selectedTerr = selectedPlot && map
    ? map.terrainTypes.find((t) => t.terrainTypeID === selectedPlot.plotAttributes.terrainType)
    : null;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1>🗺️ Map Editor</h1>
        <p>Interactive Civilization Map Editor</p>
      </div>

      <div className={styles.panel}>
        <h2>FILE</h2>
        <button onClick={onGenerateMap} className={styles.button}>
          🎲 Generate New Map
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className={styles.button}
        >
          📂 Load Map
        </button>
        <button onClick={onSaveMap} className={styles.button}>
          💾 Save Map
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
      </div>

      <div className={styles.panel}>
        <h2>TOOLS</h2>
        <button
          onClick={() => onSelectTool(Tool.SELECT)}
          className={`${styles.button} ${
            currentTool === Tool.SELECT ? styles.active : ''
          }`}
        >
          🎯 Select Tool
        </button>
        <button
          onClick={() => onSelectTool(Tool.PAINT)}
          className={`${styles.button} ${
            currentTool === Tool.PAINT ? styles.active : ''
          }`}
        >
          🖌️ Paint Tool
        </button>
      </div>

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

      <div className={styles.panel}>
        <h2>HISTORY</h2>
        <div className={styles.historyButtons}>
          <button
            onClick={onUndo}
            disabled={editHistory.undoStack.length === 0}
            className={styles.button}
          >
            ↶ Undo
          </button>
          <button
            onClick={onRedo}
            disabled={editHistory.redoStack.length === 0}
            className={styles.button}
          >
            ↷ Redo
          </button>
        </div>
        <div className={styles.stat}>
          <span>Edits:</span>
          <span>{editHistory.undoStack.length}</span>
        </div>
      </div>

      <div className={styles.panel}>
        <h2>SELECTION</h2>
        <div className={styles.stat}>
          <span>Selected:</span>
          <span>{selectedPlots.size}</span>
        </div>
        <button onClick={onSelectAll} className={styles.button}>
          Select All
        </button>
        <button onClick={onClearSelection} className={styles.button}>
          Clear Selection
        </button>
      </div>

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

      {/* Plot Properties Section */}
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
            {selectedPlot.plotAttributes.units.length > 0 && (
              <div className={styles.subsection}>
                <h3>Units</h3>
                {selectedPlot.plotAttributes.units.map((unit, idx) => (
                  <div key={idx} className={styles.stat}>
                    <span>{unit.unitTypeID}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Cluster */}
            {selectedPlot.plotAttributes.clusters.length > 0 && (
              <div className={styles.subsection}>
                <h3>Clusters</h3>
                {selectedPlot.plotAttributes.clusters.map((cluster, idx) => (
                  <div key={idx} className={styles.stat}>
                    <span>{cluster.clusterTypeID}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clusters */}
            {selectedPlot.plotAttributes.clusters.length > 0 && (
              <div className={styles.subsection}>
                <h3>Clusters</h3>
                {selectedPlot.plotAttributes.clusters.map((pop, idx) => (
                  <div key={idx} className={styles.stat}>
                    <span>{pop.clusterTypeID}:</span>
                    <span>{pop.size}</span>
                  </div>
                ))}
              </div>
            )}

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
    </div>
  );
};

export default Sidebar;
