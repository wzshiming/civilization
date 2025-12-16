import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Province, MapData } from './types';

interface MapViewProps {
  mapData: MapData;
  provinces: Map<string, Province>;
  selectedProvinceId: string | null;
  hoveredProvinceId: string | null;
  onProvinceClick: (provinceId: string) => void;
  onProvinceHover: (provinceId: string | null) => void;
}

// Calculate the center point of a province from its GeoJSON coordinates
function getProvinceCenter(coordinates: number[][][]): [number, number] {
  const coords = coordinates[0]; // Get the outer ring of the polygon
  let totalLng = 0;
  let totalLat = 0;
  
  coords.forEach(([lng, lat]) => {
    totalLng += lng;
    totalLat += lat;
  });
  
  return [totalLng / coords.length, totalLat / coords.length];
}

export default function MapView({
  mapData,
  provinces,
  selectedProvinceId,
  hoveredProvinceId,
  onProvinceClick,
  onProvinceHover,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    // Note: In production, you would need a Mapbox access token
    // For this prototype, we'll use the map without authentication
    // which will show a warning but still work for local development
    
    // Find the starting province to center the map on it
    let initialCenter: [number, number] = [-7.5, 47.5];
    let initialZoom = 5;
    
    if (selectedProvinceId) {
      const startingFeature = mapData.features.find(f => f.properties.id === selectedProvinceId);
      if (startingFeature) {
        initialCenter = getProvinceCenter(startingFeature.geometry.coordinates);
        initialZoom = 7; // Zoom in closer to the starting province
      }
    }
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.on('load', () => {
      if (!map.current) return;

      // Add province source
      map.current.addSource('provinces', {
        type: 'geojson',
        data: mapData,
      });

      // Add province fill layer
      map.current.addLayer({
        id: 'province-fills',
        type: 'fill',
        source: 'provinces',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'type'], 'water'],
            '#3498db',
            '#f0f0f0'
          ],
          'fill-opacity': 0.7,
        },
      });

      // Add province border layer
      map.current.addLayer({
        id: 'province-borders',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#333',
          'line-width': 2,
        },
      });

      // Add hover layer
      map.current.addLayer({
        id: 'province-hover',
        type: 'line',
        source: 'provinces',
        paint: {
          'line-color': '#ffeb3b',
          'line-width': 3,
        },
        filter: ['==', ['get', 'id'], ''],
      });

      // Handle click events
      map.current.on('click', 'province-fills', (e) => {
        if (e.features && e.features[0]) {
          const provinceId = e.features[0].properties?.id;
          if (provinceId) {
            onProvinceClick(provinceId);
          }
        }
      });

      // Handle hover events
      map.current.on('mousemove', 'province-fills', (e) => {
        if (map.current) {
          map.current.getCanvas().style.cursor = 'pointer';
        }
        if (e.features && e.features[0]) {
          const provinceId = e.features[0].properties?.id;
          if (provinceId) {
            onProvinceHover(provinceId);
          }
        }
      });

      map.current.on('mouseleave', 'province-fills', () => {
        if (map.current) {
          map.current.getCanvas().style.cursor = '';
        }
        onProvinceHover(null);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update province colors based on ownership
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const colorExpression: any = ['match', ['get', 'id']];

    provinces.forEach((province) => {
      if (province.owner) {
        // Find the tribe color
        colorExpression.push(province.id, '#4CAF50');
      }
    });

    // Default color for unowned provinces
    colorExpression.push([
      'case',
      ['==', ['get', 'type'], 'water'],
      '#3498db',
      '#f0f0f0'
    ]);

    if (map.current.getLayer('province-fills')) {
      map.current.setPaintProperty('province-fills', 'fill-color', colorExpression as any);
    }
  }, [provinces]);

  // Update hover highlight
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (map.current.getLayer('province-hover')) {
      map.current.setFilter('province-hover', [
        '==',
        ['get', 'id'],
        hoveredProvinceId || ''
      ]);
    }
  }, [hoveredProvinceId]);

  // Fly to selected province when it changes (except on initial load)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    if (!selectedProvinceId) return;
    
    // Skip the initial selection to avoid double animation
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const feature = mapData.features.find(f => f.properties.id === selectedProvinceId);
    if (feature) {
      const center = getProvinceCenter(feature.geometry.coordinates);
      map.current.flyTo({
        center,
        zoom: 7,
        duration: 1000, // 1 second animation
      });
    }
  }, [selectedProvinceId, mapData]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
