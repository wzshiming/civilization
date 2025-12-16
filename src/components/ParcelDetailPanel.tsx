/**
 * Detail panel showing information about a selected parcel
 */

import type { Parcel, ResourceType } from '../types/map';
import './ParcelDetailPanel.css';

interface ParcelDetailPanelProps {
  parcel: Parcel | null;
  onClose: () => void;
}

export function ParcelDetailPanel({ parcel, onClose }: ParcelDetailPanelProps) {
  if (!parcel) {
    return null;
  }

  return (
    <div className="parcel-detail-panel">
      <div className="panel-header">
        <h2>Parcel #{parcel.id}</h2>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        <section className="terrain-section">
          <h3>Terrain</h3>
          <div className="info-row">
            <span className="label">Type:</span>
            <span className="value">{formatTerrainType(parcel.terrain)}</span>
          </div>
          <div className="info-row">
            <span className="label">Elevation:</span>
            <span className="value">{(parcel.elevation * 100).toFixed(1)}%</span>
          </div>
          <div className="info-row">
            <span className="label">Moisture:</span>
            <span className="value">{(parcel.moisture * 100).toFixed(1)}%</span>
          </div>
          <div className="info-row">
            <span className="label">Temperature:</span>
            <span className="value">{(parcel.temperature * 100).toFixed(1)}%</span>
          </div>
        </section>

        <section className="resources-section">
          <h3>Resources ({parcel.resources.length})</h3>
          {parcel.resources.length === 0 ? (
            <p className="no-resources">No resources available</p>
          ) : (
            <div className="resources-list">
              {parcel.resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <div className="resource-header">
                    <span className="resource-type">
                      {formatResourceType(resource.type)}
                    </span>
                    <span className="resource-change">
                      {resource.changeRate > 0 ? '+' : ''}
                      {resource.changeRate.toFixed(2)}/s
                    </span>
                  </div>
                  <div className="resource-bar">
                    <div
                      className="resource-fill"
                      style={{
                        width: `${(resource.current / resource.maximum) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="resource-stats">
                    <span>
                      {resource.current.toFixed(0)} / {resource.maximum}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="location-section">
          <h3>Location</h3>
          <div className="info-row">
            <span className="label">Center:</span>
            <span className="value">
              ({parcel.center.x.toFixed(1)}, {parcel.center.y.toFixed(1)})
            </span>
          </div>
          <div className="info-row">
            <span className="label">Neighbors:</span>
            <span className="value">{parcel.neighbors.length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

function formatTerrainType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatResourceType(type: ResourceType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
