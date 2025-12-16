import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { GeoJsonObject, Feature, Geometry } from 'geojson';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './InteractiveMap.css';

interface ParcelProperties {
  name: string;
  owner: string;
  population: number;
  resources: string[];
  description: string;
  color: string;
}

interface ParcelInfo {
  id: string | number;
  properties: ParcelProperties;
}

// Component to lock zoom when needed
function ZoomControl({ zoomLocked }: { zoomLocked: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (zoomLocked) {
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoom.disable();
    } else {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
    }
  }, [zoomLocked, map]);
  
  return null;
}

export default function InteractiveMap() {
  const [mapData, setMapData] = useState<GeoJsonObject | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  const [hoveredParcel, setHoveredParcel] = useState<string | number | null>(null);
  const [zoomLocked, setZoomLocked] = useState(false);

  useEffect(() => {
    // Load the GeoJSON data
    fetch('/map.json')
      .then(response => response.json())
      .then(data => setMapData(data))
      .catch(error => console.error('Error loading map data:', error));
  }, []);

  const getFeatureStyle = (feature?: Feature<Geometry, ParcelProperties>) => {
    if (!feature || !feature.properties) {
      return {
        fillColor: '#3388ff',
        weight: 2,
        opacity: 1,
        color: '#666',
        fillOpacity: 0.5
      };
    }
    
    const isSelected = selectedParcel?.id === feature.id;
    const isHovered = hoveredParcel === feature.id;
    
    return {
      fillColor: feature.properties.color,
      weight: isSelected ? 4 : isHovered ? 3 : 2,
      opacity: 1,
      color: isSelected ? '#ff0000' : isHovered ? '#ff6600' : '#666',
      fillOpacity: isSelected ? 0.8 : isHovered ? 0.7 : 0.5
    };
  };

  const onEachFeature = (feature: Feature<Geometry, ParcelProperties>, layer: L.Layer) => {
    layer.on({
      click: () => {
        setSelectedParcel({
          id: feature.id || 'unknown',
          properties: feature.properties
        });
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        setHoveredParcel(feature.id || null);
        
        // Show brief tooltip on hover
        if (feature.properties) {
          const tooltip = L.tooltip({
            permanent: false,
            direction: 'top',
            className: 'parcel-tooltip'
          })
          .setContent(`
            <strong>${feature.properties.name}</strong><br/>
            Owner: ${feature.properties.owner}<br/>
            Population: ${feature.properties.population.toLocaleString()}
          `)
          .setLatLng(e.latlng);
          
          tooltip.addTo(e.target._map);
        }
      },
      mouseout: () => {
        setHoveredParcel(null);
      }
    });
  };

  if (!mapData) {
    return <div className="loading">Loading map data...</div>;
  }

  return (
    <div className="map-container">
      <div className="map-controls">
        <button 
          className={`lock-button ${zoomLocked ? 'locked' : ''}`}
          onClick={() => setZoomLocked(!zoomLocked)}
          title={zoomLocked ? 'Unlock zoom and drag' : 'Lock zoom and drag'}
        >
          {zoomLocked ? '🔒 Locked' : '🔓 Unlocked'}
        </button>
      </div>
      
      <MapContainer
        center={[52, 3]}
        zoom={8}
        style={{ height: '600px', width: '100%' }}
        scrollWheelZoom={!zoomLocked}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={mapData}
          style={getFeatureStyle}
          onEachFeature={onEachFeature}
          key={selectedParcel?.id || hoveredParcel || 'default'}
        />
        <ZoomControl zoomLocked={zoomLocked} />
      </MapContainer>

      {selectedParcel && (
        <div className="parcel-info-panel">
          <div className="panel-header">
            <h2>{selectedParcel.properties.name}</h2>
            <button 
              className="close-button"
              onClick={() => setSelectedParcel(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="panel-content">
            <div className="info-section">
              <h3>Ownership</h3>
              <p>{selectedParcel.properties.owner}</p>
            </div>
            
            <div className="info-section">
              <h3>Population</h3>
              <p>{selectedParcel.properties.population.toLocaleString()} inhabitants</p>
            </div>
            
            <div className="info-section">
              <h3>Resources</h3>
              <ul className="resources-list">
                {selectedParcel.properties.resources.map((resource, index) => (
                  <li key={index} className="resource-item">{resource}</li>
                ))}
              </ul>
            </div>
            
            <div className="info-section">
              <h3>Description</h3>
              <p>{selectedParcel.properties.description}</p>
            </div>
            
            <div className="info-section">
              <h3>Territory ID</h3>
              <p><code>{selectedParcel.id}</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
