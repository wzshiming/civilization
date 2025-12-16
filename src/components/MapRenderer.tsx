import { useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import { TerrainType, ResourceType } from '../types/terrain';
import type { TerrainProperties } from '../types/terrain';
import './MapRenderer.css';

interface MapRendererProps {
  mapData: FeatureCollection<Polygon, TerrainProperties>;
  onTileClick?: (tileId: string) => void;
}

/**
 * Get color for terrain type
 */
function getTerrainColor(terrainType: TerrainType): string {
  const colorMap: Record<TerrainType, string> = {
    [TerrainType.OCEAN]: '#1e40af',
    [TerrainType.CONTINENT]: '#8b7355',
    [TerrainType.ISLAND]: '#a0826d',
    [TerrainType.MOUNTAIN]: '#6b7280',
    [TerrainType.RIVER]: '#3b82f6',
    [TerrainType.JUNGLE]: '#166534',
    [TerrainType.DESERT]: '#fbbf24',
    [TerrainType.GRASSLAND]: '#84cc16',
    [TerrainType.FOREST]: '#15803d',
    [TerrainType.TUNDRA]: '#e0f2fe',
  };
  return colorMap[terrainType] || '#9ca3af';
}

/**
 * Get symbol for resource type
 */
function getResourceSymbol(resourceType: ResourceType): string {
  const symbolMap: Record<ResourceType, string> = {
    [ResourceType.GOLD]: '🪙',
    [ResourceType.IRON]: '⚒️',
    [ResourceType.COAL]: '⚫',
    [ResourceType.OIL]: '🛢️',
    [ResourceType.WHEAT]: '🌾',
    [ResourceType.CATTLE]: '🐄',
    [ResourceType.FISH]: '🐟',
    [ResourceType.STONE]: '🪨',
    [ResourceType.GEMS]: '💎',
    [ResourceType.SPICES]: '🌶️',
  };
  return symbolMap[resourceType] || '❓';
}

export default function MapRenderer({ mapData, onTileClick }: MapRendererProps) {
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [showResources, setShowResources] = useState(true);

  const handleTileClick = (tileId: string) => {
    setSelectedTile(tileId);
    if (onTileClick) {
      onTileClick(tileId);
    }
  };

  const selectedFeature = mapData.features.find(
    (f) => f.properties.id === selectedTile
  );

  return (
    <div className="map-renderer">
      <div className="map-controls">
        <h2>Civilization Map</h2>
        <label>
          <input
            type="checkbox"
            checked={showResources}
            onChange={(e) => setShowResources(e.target.checked)}
          />
          Show Resources
        </label>
      </div>

      <div className="map-container">
        <svg
          viewBox={`0 0 ${mapData.features.length > 0 ? 
            Math.max(...mapData.features.map(f => f.geometry.coordinates[0][1][0])) : 1000} ${
            mapData.features.length > 0 ? 
            Math.max(...mapData.features.map(f => f.geometry.coordinates[0][2][1])) : 1000
          }`}
          className="map-svg"
        >
          {mapData.features.map((feature) => {
            const coords = feature.geometry.coordinates[0];
            const pathData = coords.map((coord, i) => 
              `${i === 0 ? 'M' : 'L'} ${coord[0]} ${coord[1]}`
            ).join(' ') + ' Z';

            return (
              <g key={feature.properties.id}>
                <path
                  d={pathData}
                  fill={getTerrainColor(feature.properties.terrainType)}
                  stroke="#000"
                  strokeWidth="0.2"
                  className={`terrain-tile ${
                    selectedTile === feature.properties.id ? 'selected' : ''
                  }`}
                  onClick={() => handleTileClick(feature.properties.id)}
                  style={{ cursor: 'pointer' }}
                />
                {showResources && feature.properties.resources.length > 0 && (
                  <>
                    {feature.properties.resources.map((resource, idx) => {
                      // Calculate center position (excluding the last duplicate point)
                      const uniqueCoords = coords.slice(0, -1);
                      const centerX = uniqueCoords.reduce((sum, coord) => sum + coord[0], 0) / uniqueCoords.length;
                      const centerY = uniqueCoords.reduce((sum, coord) => sum + coord[1], 0) / uniqueCoords.length;
                      
                      // Offset multiple resources in a circle around center
                      const numResources = feature.properties.resources.length;
                      const angle = (idx / numResources) * 2 * Math.PI;
                      const offsetRadius = numResources > 1 ? 2 : 0;
                      const x = centerX + Math.cos(angle) * offsetRadius;
                      const y = centerY + Math.sin(angle) * offsetRadius;
                      
                      return (
                        <text
                          key={idx}
                          x={x}
                          y={y}
                          fontSize="5"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          pointerEvents="none"
                        >
                          {getResourceSymbol(resource.type)}
                        </text>
                      );
                    })}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedFeature && (
        <div className="tile-info">
          <h3>Tile Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Type:</strong> {selectedFeature.properties.terrainType}
            </div>
            <div className="info-item">
              <strong>Elevation:</strong> {(selectedFeature.properties.elevation * 100).toFixed(1)}%
            </div>
            <div className="info-item">
              <strong>Temperature:</strong> {(selectedFeature.properties.temperature * 100).toFixed(1)}%
            </div>
            <div className="info-item">
              <strong>Humidity:</strong> {(selectedFeature.properties.humidity * 100).toFixed(1)}%
            </div>
            <div className="info-item">
              <strong>Fertility:</strong> {(selectedFeature.properties.fertility * 100).toFixed(1)}%
            </div>
          </div>

          {selectedFeature.properties.resources.length > 0 && (
            <div className="resources-info">
              <h4>Resources</h4>
              {selectedFeature.properties.resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <div>
                    <strong>{getResourceSymbol(resource.type)} {resource.type}</strong>
                  </div>
                  <div className="resource-details">
                    <span>Reserves: {resource.currentReserves}/{resource.reserves}</span>
                    {resource.regenerationRate > 0 && (
                      <span>Regen: +{resource.regenerationRate.toFixed(2)}/turn</span>
                    )}
                    <span>Status: {resource.isDiscovered ? 'Discovered' : 'Hidden'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-items">
          {Object.values(TerrainType).map((terrain) => (
            <div key={terrain} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: getTerrainColor(terrain) }}
              ></div>
              <span>{terrain}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
