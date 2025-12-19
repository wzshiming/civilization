import React, { useState } from 'react';
import { GameMap } from '../../src/types';
import { generateMap } from '../../src/generators';
import { executeStep, StepResult } from '../../src/simulation';
import Sidebar from './components/Sidebar';
import MapCanvas from './components/MapCanvas';
import styles from './App.module.css';

// Editor-specific types
export enum Tool {
  SELECT = 'SELECT',
  PAINT = 'PAINT',
  UNIT = 'UNIT',
  CLUSTER = 'CLUSTER',
}

export interface TerrainEdit {
  type: 'terrain';
  plots: Array<{
    plotID: string;
    oldTerrain: string;
    newTerrain: string;
  }>;
}

export interface UnitEdit {
  type: 'unit';
  action: 'add' | 'remove';
  plotID: string;
  unitID: string;
  unitTypeID: string;
}

export interface ClusterEdit {
  type: 'cluster';
  action: 'add' | 'remove';
  plotID: string;
  clusterID: string;
  clusterTypeID: string;
  clusterData?: {
    name: string;
    size: number;
  };
}

export type Edit = TerrainEdit | UnitEdit | ClusterEdit;

export interface EditHistory {
  undoStack: Edit[];
  redoStack: Edit[];
}

function App() {
  const [map, setMap] = useState<GameMap | null>(null);
  const [selectedPlots, setSelectedPlots] = useState<Set<string>>(new Set());
  const [currentTool, setCurrentTool] = useState<Tool>(Tool.SELECT);
  const [selectedTerrain, setSelectedTerrain] = useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);
  const [selectedClusterType, setSelectedClusterType] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<EditHistory>({
    undoStack: [],
    redoStack: [],
  });
  const [zoom, setZoom] = useState(100);
  const [stepCount, setStepCount] = useState(0);
  const [lastStepResult, setLastStepResult] = useState<StepResult | null>(null);

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
    setStepCount(0);
    setLastStepResult(null);
  };

  const handleLoadMap = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedMap = JSON.parse(e.target?.result as string);
        setMap(loadedMap);
        setSelectedPlots(new Set());
        setEditHistory({ undoStack: [], redoStack: [] });
        setStepCount(0);
        setLastStepResult(null);
      } catch (error) {
        console.error('Error loading map:', error);
        alert('Failed to load map file');
      }
    };
    reader.readAsText(file);
  };

  const handleStep = () => {
    if (!map) return;
    const result = executeStep(map);
    // Force re-render by creating new plots array reference (map is mutated in-place by executeStep)
    setMap({ ...map, plots: [...map.plots] });
    setStepCount((prev) => prev + 1);
    setLastStepResult(result);
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

    let newPlots = map.plots;
    let newClusters = map.clusters;

    if (edit.type === 'terrain') {
      // Revert terrain edit
      newPlots = map.plots.map((plot) => {
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
    } else if (edit.type === 'unit') {
      // Revert unit edit
      newPlots = map.plots.map((plot) => {
        if (plot.plotID === edit.plotID) {
          if (edit.action === 'add') {
            // Remove the unit that was added
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                units: plot.plotAttributes.units.filter(u => u.unitID !== edit.unitID),
              },
            };
          } else {
            // Re-add the unit that was removed
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                units: [...plot.plotAttributes.units, { unitID: edit.unitID, unitTypeID: edit.unitTypeID, workerClusterIDs: [] }],
              },
            };
          }
        }
        return plot;
      });
    } else if (edit.type === 'cluster') {
      // Revert cluster edit
      newPlots = map.plots.map((plot) => {
        if (plot.plotID === edit.plotID) {
          if (edit.action === 'add') {
            // Remove the cluster that was added
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                clusters: plot.plotAttributes.clusters.filter(c => c.clusterID !== edit.clusterID),
              },
            };
          } else if (edit.clusterData) {
            // Re-add the cluster that was removed
            const cluster = {
              clusterID: edit.clusterID,
              clusterTypeID: edit.clusterTypeID,
              name: edit.clusterData.name,
              description: '',
              skills: [],
              size: edit.clusterData.size,
              relationships: [],
            };
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                clusters: [...plot.plotAttributes.clusters, cluster],
              },
            };
          }
        }
        return plot;
      });
      if (edit.action === 'add') {
        newClusters = map.clusters.filter(c => c.clusterID !== edit.clusterID);
      } else if (edit.clusterData) {
        newClusters = [...map.clusters, {
          clusterID: edit.clusterID,
          clusterTypeID: edit.clusterTypeID,
          name: edit.clusterData.name,
          description: '',
          skills: [],
          size: edit.clusterData.size,
          relationships: [],
        }];
      }
    }

    setMap({ ...map, plots: newPlots, clusters: newClusters });
    setEditHistory({
      undoStack: newUndoStack,
      redoStack: [...editHistory.redoStack, edit],
    });
  };

  const handleRedo = () => {
    if (editHistory.redoStack.length === 0 || !map) return;

    const edit = editHistory.redoStack[editHistory.redoStack.length - 1];
    const newRedoStack = editHistory.redoStack.slice(0, -1);

    let newPlots = map.plots;
    let newClusters = map.clusters;

    if (edit.type === 'terrain') {
      // Apply terrain edit
      newPlots = map.plots.map((plot) => {
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
    } else if (edit.type === 'unit') {
      // Redo unit edit
      newPlots = map.plots.map((plot) => {
        if (plot.plotID === edit.plotID) {
          if (edit.action === 'add') {
            // Re-add the unit
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                units: [...plot.plotAttributes.units, { unitID: edit.unitID, unitTypeID: edit.unitTypeID, workerClusterIDs: [] }],
              },
            };
          } else {
            // Re-remove the unit
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                units: plot.plotAttributes.units.filter(u => u.unitID !== edit.unitID),
              },
            };
          }
        }
        return plot;
      });
    } else if (edit.type === 'cluster') {
      // Redo cluster edit
      newPlots = map.plots.map((plot) => {
        if (plot.plotID === edit.plotID) {
          if (edit.action === 'add' && edit.clusterData) {
            // Re-add the cluster
            const cluster = {
              clusterID: edit.clusterID,
              clusterTypeID: edit.clusterTypeID,
              name: edit.clusterData.name,
              description: '',
              skills: [],
              size: edit.clusterData.size,
              relationships: [],
            };
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                clusters: [...plot.plotAttributes.clusters, cluster],
              },
            };
          } else {
            // Re-remove the cluster
            return {
              ...plot,
              plotAttributes: {
                ...plot.plotAttributes,
                clusters: plot.plotAttributes.clusters.filter(c => c.clusterID !== edit.clusterID),
              },
            };
          }
        }
        return plot;
      });
      if (edit.action === 'add' && edit.clusterData) {
        newClusters = [...map.clusters, {
          clusterID: edit.clusterID,
          clusterTypeID: edit.clusterTypeID,
          name: edit.clusterData.name,
          description: '',
          skills: [],
          size: edit.clusterData.size,
          relationships: [],
        }];
      } else {
        newClusters = map.clusters.filter(c => c.clusterID !== edit.clusterID);
      }
    }

    setMap({ ...map, plots: newPlots, clusters: newClusters });
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
        selectedUnitType={selectedUnitType}
        selectedClusterType={selectedClusterType}
        editHistory={editHistory}
        stepCount={stepCount}
        lastStepResult={lastStepResult}
        onGenerateMap={handleGenerateMap}
        onLoadMap={handleLoadMap}
        onSaveMap={handleSaveMap}
        onSelectTool={setCurrentTool}
        onSelectTerrain={setSelectedTerrain}
        onSelectUnitType={setSelectedUnitType}
        onSelectClusterType={setSelectedClusterType}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onStep={handleStep}
        onUpdateMap={setMap}
        onUpdateHistory={setEditHistory}
      />
      <div className={styles.main}>
        <MapCanvas
          map={map}
          selectedPlots={selectedPlots}
          currentTool={currentTool}
          selectedTerrain={selectedTerrain}
          selectedUnitType={selectedUnitType}
          selectedClusterType={selectedClusterType}
          onUpdateMap={setMap}
          onUpdateSelection={setSelectedPlots}
          onUpdateHistory={setEditHistory}
          editHistory={editHistory}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  );
}

export default App;
