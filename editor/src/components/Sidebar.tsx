import React, { useRef } from 'react';
import { GameMap, Tool, EditHistory } from '../types';
import { getTerrainColor } from '../utils/colors';
import styles from './Sidebar.module.css';

interface SidebarProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  currentTool: Tool;
  selectedTerrain: string | null;
  editHistory: EditHistory;
  onGenerateMap: () => void;
  onLoadMap: (file: File) => void;
  onSaveMap: () => void;
  onSelectTool: (tool: Tool) => void;
  onSelectTerrain: (terrain: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  map,
  selectedPlots,
  currentTool,
  selectedTerrain,
  editHistory,
  onGenerateMap,
  onLoadMap,
  onSaveMap,
  onSelectTool,
  onSelectTerrain,
  onSelectAll,
  onClearSelection,
  onUndo,
  onRedo,
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
        <h2>TERRAIN TYPES</h2>
        <div className={styles.terrainGrid}>
          {map?.terrainTypes.map((terrain) => (
            <button
              key={terrain.terrainTypeID}
              onClick={() => onSelectTerrain(terrain.terrainTypeID)}
              className={`${styles.terrainButton} ${
                selectedTerrain === terrain.terrainTypeID ? styles.selected : ''
              }`}
              style={{
                backgroundColor: getTerrainColor(terrain.terrainTypeID),
              }}
            >
              {terrain.name}
            </button>
          ))}
        </div>
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
    </div>
  );
};

export default Sidebar;
