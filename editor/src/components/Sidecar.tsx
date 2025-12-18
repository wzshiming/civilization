import React, { useState } from 'react';
import { GameMap, Plot } from '../../../src/types';
import { Edit, EditHistory } from '../App';
import styles from './Sidecar.module.css';

interface SidecarProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  onUpdateMap: (map: GameMap) => void;
  onUpdateHistory: (history: EditHistory) => void;
  editHistory: EditHistory;
}

const Sidecar: React.FC<SidecarProps> = ({
  map,
  selectedPlots,
  onUpdateMap,
  onUpdateHistory,
  editHistory,
}) => {
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (!map || selectedPlots.size === 0) {
    return (
      <div className={styles.sidecar}>
        <div className={styles.header}>
          <h2>Plot Properties</h2>
        </div>
        <div className={styles.emptyState}>
          <p>No plot selected</p>
          <p className={styles.hint}>Click on a plot to view and edit its properties</p>
        </div>
      </div>
    );
  }

  // Get the first selected plot for display
  const selectedPlotIds = Array.from(selectedPlots);
  const plots = map.plots.filter((p) => selectedPlots.has(p.plotID));
  const plot = plots[0];

  if (!plot) {
    return (
      <div className={styles.sidecar}>
        <div className={styles.header}>
          <h2>Plot Properties</h2>
        </div>
        <div className={styles.emptyState}>
          <p>Plot not found</p>
        </div>
      </div>
    );
  }

  const terrain = map.terrainTypes.find(
    (t) => t.terrainTypeID === plot.plotAttributes.terrainType
  );

  const handleTerrainChange = (newTerrainTypeID: string) => {
    if (!map) return;

    const changes = selectedPlotIds.map((plotID) => {
      const p = map.plots.find((plot) => plot.plotID === plotID);
      if (!p) return null;
      return {
        plotID,
        oldTerrain: p.plotAttributes.terrainType,
        newTerrain: newTerrainTypeID,
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);

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

    const edit: Edit = {
      type: 'terrain',
      plots: changes,
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const formatNumber = (num: number) => {
    return num.toFixed(2);
  };

  return (
    <div className={styles.sidecar}>
      <div className={styles.header}>
        <h2>Plot Properties</h2>
        {selectedPlots.size > 1 && (
          <span className={styles.badge}>{selectedPlots.size} plots</span>
        )}
      </div>

      <div className={styles.content}>
        {/* Basic Information */}
        <div className={styles.section}>
          <h3>Basic Information</h3>
          <div className={styles.property}>
            <label>Plot ID</label>
            <div className={styles.value}>{plot.plotID}</div>
          </div>
          <div className={styles.property}>
            <label>Area</label>
            <div className={styles.value}>{formatNumber(plot.area)}</div>
          </div>
          <div className={styles.property}>
            <label>Perimeter</label>
            <div className={styles.value}>{formatNumber(plot.perimeter)}</div>
          </div>
          <div className={styles.property}>
            <label>Center</label>
            <div className={styles.value}>
              ({formatNumber(plot.center.x)}, {formatNumber(plot.center.y)})
            </div>
          </div>
        </div>

        {/* Terrain Type */}
        <div className={styles.section}>
          <h3>Terrain</h3>
          <div className={styles.property}>
            <label>Terrain Type</label>
            <select
              className={styles.select}
              value={plot.plotAttributes.terrainType}
              onChange={(e) => handleTerrainChange(e.target.value)}
            >
              {map.terrainTypes.map((t) => (
                <option key={t.terrainTypeID} value={t.terrainTypeID}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {terrain && (
            <div className={styles.terrainPreview}>
              <div
                className={styles.terrainColor}
                style={{ backgroundColor: terrain.color || '#888' }}
              />
              <span>{terrain.name}</span>
            </div>
          )}
        </div>

        {/* Neighbors */}
        <div className={styles.section}>
          <h3>Neighbors</h3>
          <div className={styles.property}>
            <label>Neighbor Count</label>
            <div className={styles.value}>
              {plot.plotAttributes.neighborPlots.length}
            </div>
          </div>
          <div className={styles.neighborList}>
            {plot.plotAttributes.neighborPlots.slice(0, 5).map((neighborID) => (
              <div key={neighborID} className={styles.neighbor}>
                {neighborID}
              </div>
            ))}
            {plot.plotAttributes.neighborPlots.length > 5 && (
              <div className={styles.neighbor}>
                +{plot.plotAttributes.neighborPlots.length - 5} more
              </div>
            )}
          </div>
        </div>

        {/* Ownership */}
        <div className={styles.section}>
          <h3>Ownership</h3>
          <div className={styles.property}>
            <label>Owner</label>
            <div className={styles.value}>
              {plot.plotAttributes.ownerPlayerID || 'Unowned'}
            </div>
          </div>
        </div>

        {/* Buildings */}
        <div className={styles.section}>
          <h3>Buildings</h3>
          <div className={styles.property}>
            <label>Building Count</label>
            <div className={styles.value}>
              {plot.plotAttributes.buildings.length}
            </div>
          </div>
          {plot.plotAttributes.buildings.length > 0 && (
            <div className={styles.list}>
              {plot.plotAttributes.buildings.map((building, idx) => (
                <div key={idx} className={styles.listItem}>
                  {building.buildingTypeID}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Species */}
        <div className={styles.section}>
          <h3>Species</h3>
          <div className={styles.property}>
            <label>Species Count</label>
            <div className={styles.value}>
              {plot.plotAttributes.species.length}
            </div>
          </div>
          {plot.plotAttributes.species.length > 0 && (
            <div className={styles.list}>
              {plot.plotAttributes.species.map((species, idx) => (
                <div key={idx} className={styles.listItem}>
                  {species.speciesTypeID}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storage */}
        <div className={styles.section}>
          <h3>Storage</h3>
          <div className={styles.property}>
            <label>Storage Count</label>
            <div className={styles.value}>
              {plot.plotAttributes.storages.length}
            </div>
          </div>
          {plot.plotAttributes.storages.length > 0 && (
            <div className={styles.list}>
              {plot.plotAttributes.storages.map((storage, idx) => (
                <div key={idx} className={styles.listItem}>
                  {storage.resourceTypeID}: {storage.amount}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Populations */}
        <div className={styles.section}>
          <h3>Populations</h3>
          <div className={styles.property}>
            <label>Population Count</label>
            <div className={styles.value}>
              {plot.plotAttributes.populations.length}
            </div>
          </div>
          {plot.plotAttributes.populations.length > 0 && (
            <div className={styles.list}>
              {plot.plotAttributes.populations.map((pop, idx) => (
                <div key={idx} className={styles.listItem}>
                  {pop.speciesTypeID}: {pop.count}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidecar;
