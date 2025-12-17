/**
 * Detail panel showing information about a selected parcel
 */

import { memo } from 'react';
import type { Parcel, ResourceType, TerrainType } from '../types/map';
import { useI18n } from '../i18n';
import './ParcelDetailPanel.css';

interface ParcelDetailPanelProps {
  parcel: Parcel | null;
  onClose: () => void;
}

function ParcelDetailPanelComponent({ parcel, onClose }: ParcelDetailPanelProps) {
  const { t } = useI18n();
  
  if (!parcel) {
    return null;
  }

  const formatTerrainType = (type: TerrainType): string => {
    return t.terrainTypes[type] || type;
  };

  const formatResourceType = (type: ResourceType): string => {
    return t.resourceTypes[type] || type;
  };

  return (
    <div className="parcel-detail-panel">
      <div className="panel-header">
        <h2>{t.parcel} #{parcel.id}</h2>
        <button className="close-button" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="panel-content">
        <section className="terrain-section">
          <h3>{t.terrain}</h3>
          <div className="info-row">
            <span className="label">{t.type}</span>
            <span className="value">{formatTerrainType(parcel.terrain)}</span>
          </div>
          <div className="info-row">
            <span className="label">{t.elevation}</span>
            <span className="value">{(parcel.elevation * 100).toFixed(1)}%</span>
          </div>
          <div className="info-row">
            <span className="label">{t.moisture}</span>
            <span className="value">{(parcel.moisture * 100).toFixed(1)}%</span>
          </div>
          <div className="info-row">
            <span className="label">{t.temperature}</span>
            <span className="value">{(parcel.temperature * 100).toFixed(1)}%</span>
          </div>
        </section>

        <section className="resources-section">
          <h3>{t.resources} ({parcel.resources.length})</h3>
          {parcel.resources.length === 0 ? (
            <p className="no-resources">{t.noResources}</p>
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
                  {resource.attributes.length > 0 && (
                    <div className="resource-attributes">
                      {resource.attributes.map((attr, attrIndex) => (
                        <div key={attrIndex} className="attribute-item">
                          <span className="attribute-name">{attr.name}</span>
                          <span className="attribute-efficiency">
                            {(attr.efficiency * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="location-section">
          <h3>{t.location}</h3>
          <div className="info-row">
            <span className="label">{t.center}</span>
            <span className="value">
              ({parcel.center.x.toFixed(1)}, {parcel.center.y.toFixed(1)})
            </span>
          </div>
          <div className="info-row">
            <span className="label">{t.neighbors}</span>
            <span className="value">{parcel.neighbors.length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parcel or onClose haven't changed
export const ParcelDetailPanel = memo(ParcelDetailPanelComponent);


