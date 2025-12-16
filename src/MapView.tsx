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

export default function MapView({
  mapData,
  provinces,
  hoveredProvinceId,
  onProvinceClick,
  onProvinceHover,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Initialize map only once

    // Note: In production, you would need a Mapbox access token
    // For this prototype, we'll use the map without authentication
    // which will show a warning but still work for local development
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {},
        layers: [],
      },
      center: [-7.5, 47.5],
      zoom: 5,
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
