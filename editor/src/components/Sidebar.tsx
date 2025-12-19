import React from 'react';
import { GameMap } from '../../../src/types';
import { StepResult } from '../../../src/simulation';
import { Tool, EditHistory } from '../App';
import {
  FilePanel,
  ToolsPanel,
  UnitTypesPanel,
  ClusterTypesPanel,
  SimulationPanel,
  HistoryPanel,
  SelectionPanel,
  MapStatisticsPanel,
  PlotPropertiesPanel,
} from './sidebar';
import styles from './Sidebar.module.css';

interface SidebarProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  currentTool: Tool;
  selectedTerrain: string | null;
  selectedUnitType: string | null;
  selectedClusterType: string | null;
  editHistory: EditHistory;
  stepCount: number;
  lastStepResult: StepResult | null;
  onGenerateMap: () => void;
  onLoadMap: (file: File) => void;
  onSaveMap: () => void;
  onSelectTool: (tool: Tool) => void;
  onSelectTerrain: (terrain: string) => void;
  onSelectUnitType: (unitType: string | null) => void;
  onSelectClusterType: (clusterType: string | null) => void;
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
  selectedUnitType,
  selectedClusterType,
  editHistory,
  stepCount,
  lastStepResult,
  onGenerateMap,
  onLoadMap,
  onSaveMap,
  onSelectTool,
  onSelectTerrain,
  onSelectUnitType,
  onSelectClusterType,
  onSelectAll,
  onClearSelection,
  onUndo,
  onRedo,
  onStep,
  onUpdateMap,
  onUpdateHistory,
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1>🗺️ Map Editor</h1>
        <p>Interactive Civilization Map Editor</p>
      </div>

      <FilePanel
        onGenerateMap={onGenerateMap}
        onLoadMap={onLoadMap}
        onSaveMap={onSaveMap}
      />

      <ToolsPanel
        currentTool={currentTool}
        onSelectTool={onSelectTool}
      />

      {/* Unit Type Selection (shown when Unit tool is active) */}
      {currentTool === Tool.UNIT && map && (
        <UnitTypesPanel
          map={map}
          selectedUnitType={selectedUnitType}
          onSelectUnitType={onSelectUnitType}
        />
      )}

      {/* Cluster Type Selection (shown when Cluster tool is active) */}
      {currentTool === Tool.CLUSTER && map && (
        <ClusterTypesPanel
          map={map}
          selectedClusterType={selectedClusterType}
          onSelectClusterType={onSelectClusterType}
        />
      )}

      <SimulationPanel
        map={!!map}
        stepCount={stepCount}
        lastStepResult={lastStepResult}
        onStep={onStep}
      />

      <HistoryPanel
        editHistory={editHistory}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      <SelectionPanel
        selectedCount={selectedPlots.size}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
      />

      <MapStatisticsPanel map={map} />

      <PlotPropertiesPanel
        map={map}
        selectedPlots={selectedPlots}
        selectedUnitType={selectedUnitType}
        selectedClusterType={selectedClusterType}
        editHistory={editHistory}
        onUpdateMap={onUpdateMap}
        onUpdateHistory={onUpdateHistory}
      />
    </div>
  );
};

export default Sidebar;
