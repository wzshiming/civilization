import React, { useState } from 'react';
import { GameMap } from '../../src/types';
import { generateMap } from '../../src/generators';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import StatusBar from './components/StatusBar';
import styles from './App.module.css';

// Editor-specific types
export enum Tool {
  SELECT = 'SELECT',
  PAINT = 'PAINT',
}

export interface Edit {
  type: 'terrain';
  plots: Array<{
    plotID: string;
    oldTerrain: string;
    newTerrain: string;
  }>;
}

export interface EditHistory {
  undoStack: Edit[];
  redoStack: Edit[];
}

function App() {
  const [map, setMap] = useState<GameMap | null>(null);
  const [selectedPlots, setSelectedPlots] = useState<Set<string>>(new Set());
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.SELECT);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory>({
    undoStack: [],
    redoStack: [],
  });
  const [zoom, setZoom] = useState(100);

  React.useEffect(() => {
    // Generate initial map
    handleGenerateMap();
  }, []);

  const handleGenerateMap = () => {
    const newMap = generateMap({
      plotCount: 100,
      randomSeed: Date.now(),
      terrain: {
        oceanPercentage: 0.65,
        continentCount: 2,
        islandFrequency: 0.15,
        coastalRoughness: 0.3,
      },
      relaxationSteps: 2,
    });
    setMap(newMap);
    setSelectedPlots(new Set());
    setEditHistory({ undoStack: [], redoStack: [] });
  };

  const handleLoadMap = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedMap = JSON.parse(e.target?.result as string);
        setMap(loadedMap);
        setSelectedPlots(new Set());
        setEditHistory({ undoStack: [], redoStack: [] });
      } catch (error) {
        console.error('Error loading map:', error);
        alert('Failed to load map file');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveMap = () => {
    if (!map) return;
    const dataStr = JSON.stringify(map, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'civilization-map.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectAll = () => {
    if (!map) return;
    setSelectedPlots(new Set(map.plots.map((p) => p.plotID)));
  };

  const handleClearSelection = () => {
    setSelectedPlots(new Set());
  };

  const handleUndo = () => {
    if (editHistory.undoStack.length === 0 || !map) return;

    const edit = editHistory.undoStack[editHistory.undoStack.length - 1];
    const newUndoStack = editHistory.undoStack.slice(0, -1);

    // Revert the edit
    const newPlots = map.plots.map((plot) => {
      const change = edit.plots.find((p) => p.plotID === plot.plotID);
      if (change) {
        return {
          ...plot,
          plotAttributes: {
            ...plot.plotAttributes,
            terrainType: change.oldTerrain,
          },
        };
      }
      return plot;
    });

    setMap({ ...map, plots: newPlots });
    setEditHistory({
      undoStack: newUndoStack,
      redoStack: [...editHistory.redoStack, edit],
    });
  };

  const handleRedo = () => {
    if (editHistory.redoStack.length === 0 || !map) return;

    const edit = editHistory.redoStack[editHistory.redoStack.length - 1];
    const newRedoStack = editHistory.redoStack.slice(0, -1);

    // Apply the edit
    const newPlots = map.plots.map((plot) => {
      const change = edit.plots.find((p) => p.plotID === plot.plotID);
      if (change) {
        return {
          ...plot,
          plotAttributes: {
            ...plot.plotAttributes,
            terrainType: change.newTerrain,
          },
        };
      }
      return plot;
    });

    setMap({ ...map, plots: newPlots });
    setEditHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: newRedoStack,
    });
  };

  return (
    <div className={styles.container}>
      <Sidebar
        map={map}
        selectedPlots={selectedPlots}
        currentTool={currentTool}
        selectedTerrain={selectedTerrain}
        editHistory={editHistory}
        onGenerateMap={handleGenerateMap}
        onLoadMap={handleLoadMap}
        onSaveMap={handleSaveMap}
        onSelectTool={setCurrentTool}
        onSelectTerrain={setSelectedTerrain}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className={styles.main}>
        <MapCanvas
          map={map}
          selectedPlots={selectedPlots}
          currentTool={currentTool}
          selectedTerrain={selectedTerrain}
          onUpdateMap={setMap}
          onUpdateSelection={setSelectedPlots}
          onUpdateHistory={setEditHistory}
          editHistory={editHistory}
          onZoomChange={setZoom}
        />
        <StatusBar
          zoom={zoom}
          totalPlots={map?.plots.length ?? 0}
          selectedCount={selectedPlots.size}
          map={map}
          currentTool={currentTool}
          editHistory={editHistory}
        />
      </div>
    </div>
  );
}

export default App;
