/**
 * Map renderer using Pixi.js for high-performance polygon rendering
 */

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container, FederatedPointerEvent } from 'pixi.js';
import type { WorldMap, Parcel } from '../types/map';
import { TerrainType } from '../types/map';

interface MapRendererProps {
  worldMap: WorldMap;
  onParcelClick?: (parcel: Parcel) => void;
}

// Color scheme for different terrain types
const TERRAIN_COLORS: Record<TerrainType, number> = {
  [TerrainType.OCEAN]: 0x1a5490,
  [TerrainType.SHALLOW_WATER]: 0x3a7ca8,
  [TerrainType.BEACH]: 0xf4e7c7,
  [TerrainType.GRASSLAND]: 0x7ec850,
  [TerrainType.FOREST]: 0x2d6b22,
  [TerrainType.JUNGLE]: 0x1a5018,
  [TerrainType.DESERT]: 0xe8c878,
  [TerrainType.TUNDRA]: 0xb8c8d0,
  [TerrainType.MOUNTAIN]: 0x8b7355,
  [TerrainType.SNOW]: 0xf0f8ff,
};

export function MapRenderer({ worldMap, onParcelClick }: MapRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const parcelGraphicsRef = useRef<Map<number, Graphics>>(new Map());
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup = false;
    const localParcelGraphics = new Map<number, Graphics>();

    // Create Pixi application
    const app = new Application();
    appRef.current = app;

    (async () => {
      try {
        await app.init({
          width: worldMap.width,
          height: worldMap.height,
          backgroundColor: 0x1a1a1a,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (cleanup) {
          return;
        }

        if (canvasRef.current) {
          canvasRef.current.appendChild(app.canvas);
        }

        // Create container for parcels
        const parcelContainer = new Container();
        parcelContainer.eventMode = 'static';
        app.stage.addChild(parcelContainer);

        // Add pan and zoom functionality
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let containerStart = { x: 0, y: 0 };

        // Enable dragging on the stage background
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        
        app.stage.on('pointerdown', (event: FederatedPointerEvent) => {
          isDragging = true;
          dragStart = { x: event.global.x, y: event.global.y };
          containerStart = { x: parcelContainer.x, y: parcelContainer.y };
        });

        app.stage.on('pointermove', (event: FederatedPointerEvent) => {
          if (isDragging) {
            parcelContainer.x = containerStart.x + (event.global.x - dragStart.x);
            parcelContainer.y = containerStart.y + (event.global.y - dragStart.y);
          }
        });

        app.stage.on('pointerup', () => {
          isDragging = false;
        });

        app.stage.on('pointerupoutside', () => {
          isDragging = false;
        });

        // Add zoom with mouse wheel
        app.canvas.addEventListener('wheel', (event: WheelEvent) => {
          event.preventDefault();
          
          const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
          const newScale = Math.max(0.5, Math.min(3, parcelContainer.scale.x * zoomFactor));
          
          // Zoom towards mouse position
          const mouseX = event.offsetX;
          const mouseY = event.offsetY;
          
          const worldPos = {
            x: (mouseX - parcelContainer.x) / parcelContainer.scale.x,
            y: (mouseY - parcelContainer.y) / parcelContainer.scale.y,
          };
          
          parcelContainer.scale.set(newScale);
          
          parcelContainer.x = mouseX - worldPos.x * newScale;
          parcelContainer.y = mouseY - worldPos.y * newScale;
        });

        // Render parcels with repetitive tiling (left, center, right for horizontal wrapping)
        const tiledContainers: Container[] = [];
        
        for (let tileX = -1; tileX <= 1; tileX++) {
          const tileContainer = new Container();
          tileContainer.x = tileX * worldMap.width;
          parcelContainer.addChild(tileContainer);
          tiledContainers.push(tileContainer);

          // Render all parcels in this tile
          worldMap.parcels.forEach((parcel) => {
            const graphics = new Graphics();
            renderParcel(graphics, parcel, false, worldMap.width);

            // Make interactive
            graphics.eventMode = 'static';
            graphics.cursor = 'pointer';
            graphics.on('pointerdown', (event: FederatedPointerEvent) => {
              event.stopPropagation();
              setSelectedParcelId(parcel.id);
              onParcelClick?.(parcel);
            });

            tileContainer.addChild(graphics);
            
            // Store only center tile graphics for selection updates
            if (tileX === 0) {
              localParcelGraphics.set(parcel.id, graphics);
            }
          });

          // Render boundaries (for rivers) in this tile
          const boundaryGraphics = new Graphics();
          worldMap.boundaries.forEach((boundary) => {
            if (boundary.resources.length > 0) {
              // Draw river
              if (boundary.edge.length >= 2) {
                boundaryGraphics.moveTo(boundary.edge[0].x, boundary.edge[0].y);
                for (let i = 1; i < boundary.edge.length; i++) {
                  boundaryGraphics.lineTo(boundary.edge[i].x, boundary.edge[i].y);
                }
                boundaryGraphics.stroke({ width: 2, color: 0x4a9eff, alpha: 0.8 });
              }
            }
          });
          tileContainer.addChild(boundaryGraphics);
        }

        // Store in ref for use in other effect
        parcelGraphicsRef.current = localParcelGraphics;
      } catch (error) {
        console.error('Failed to initialize Pixi application:', error);
      }
    })();

    return () => {
      cleanup = true;
      try {
        if (app && app.stage) {
          app.destroy(true, { children: true, texture: true });
        }
      } catch {
        // Ignore cleanup errors
      }
      localParcelGraphics.clear();
    };
  }, [worldMap, onParcelClick]);

  // Update selected parcel highlighting
  useEffect(() => {
    parcelGraphicsRef.current.forEach((graphics, parcelId) => {
      const parcel = worldMap.parcels.get(parcelId);
      if (parcel) {
        graphics.clear();
        renderParcel(graphics, parcel, parcelId === selectedParcelId, worldMap.width);
      }
    });
  }, [selectedParcelId, worldMap]);

  return (
    <div
      ref={canvasRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    />
  );
}

/**
 * Render a single parcel, handling wrapping for circular maps
 */
function renderParcel(graphics: Graphics, parcel: Parcel, isSelected: boolean, worldWidth?: number): void {
  if (parcel.vertices.length < 3) return;

  const color = TERRAIN_COLORS[parcel.terrain];
  const borderColor = isSelected ? 0xffff00 : 0x000000;
  const borderWidth = isSelected ? 3 : 0.5;
  const borderAlpha = isSelected ? 1 : 0.3;

  // Check if polygon wraps around the boundary
  if (worldWidth) {
    const minX = Math.min(...parcel.vertices.map(v => v.x));
    const maxX = Math.max(...parcel.vertices.map(v => v.x));
    
    // If vertices span more than half the map width, the polygon wraps
    if (maxX - minX > worldWidth * 0.5) {
      // Split into left and right pieces
      const leftVertices = parcel.vertices.filter(v => v.x > worldWidth * 0.5);
      const rightVertices = parcel.vertices.filter(v => v.x <= worldWidth * 0.5);
      
      // Render left piece (shifted to appear on right side for tiling)
      if (leftVertices.length >= 3) {
        graphics.poly(leftVertices.map(v => [v.x, v.y]).flat());
        graphics.fill({ color, alpha: 1 });
        graphics.poly(leftVertices.map(v => [v.x, v.y]).flat());
        graphics.stroke({ width: borderWidth, color: borderColor, alpha: borderAlpha });
      }
      
      // Render right piece (shifted to appear on left side for tiling)
      if (rightVertices.length >= 3) {
        graphics.poly(rightVertices.map(v => [v.x, v.y]).flat());
        graphics.fill({ color, alpha: 1 });
        graphics.poly(rightVertices.map(v => [v.x, v.y]).flat());
        graphics.stroke({ width: borderWidth, color: borderColor, alpha: borderAlpha });
      }
      
      // Draw resources at center (adjust for wrapping)
      if (parcel.resources.length > 0) {
        const centerX = parcel.center.x;
        const centerY = parcel.center.y;
        const radius = 3;

        parcel.resources.forEach((resource, index) => {
          const angle = (index / parcel.resources.length) * Math.PI * 2;
          const offsetX = Math.cos(angle) * 8;
          const offsetY = Math.sin(angle) * 8;

          graphics.circle(centerX + offsetX, centerY + offsetY, radius);
          graphics.fill({ color: getResourceColor(resource.type), alpha: 1 });
        });
      }
      return;
    }
  }

  // Normal polygon rendering (no wrapping)
  graphics.poly(parcel.vertices.map(v => [v.x, v.y]).flat());
  graphics.fill({ color, alpha: 1 });

  graphics.poly(parcel.vertices.map(v => [v.x, v.y]).flat());
  graphics.stroke({ width: borderWidth, color: borderColor, alpha: borderAlpha });

  // Draw resource indicators
  if (parcel.resources.length > 0) {
    const centerX = parcel.center.x;
    const centerY = parcel.center.y;
    const radius = 3;

    // Draw a small circle for each resource
    parcel.resources.forEach((resource, index) => {
      const angle = (index / parcel.resources.length) * Math.PI * 2;
      const offsetX = Math.cos(angle) * 8;
      const offsetY = Math.sin(angle) * 8;

      graphics.circle(centerX + offsetX, centerY + offsetY, radius);
      graphics.fill({ color: getResourceColor(resource.type), alpha: 1 });
    });
  }
}

/**
 * Get color for resource type
 */
function getResourceColor(type: string): number {
  const colors: Record<string, number> = {
    water: 0x4a9eff,
    wood: 0x8b4513,
    stone: 0x808080,
    iron: 0xb87333,
    gold: 0xffd700,
    oil: 0x1a1a1a,
    coal: 0x2f2f2f,
    fertile_soil: 0x654321,
    fish: 0x00bfff,
    game: 0x8b6914,
  };
  return colors[type] || 0xffffff;
}
