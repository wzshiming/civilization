/**
 * Map renderer using Pixi.js for high-performance polygon rendering
 * with WASD movement, smooth scrolling, and viewport culling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
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

// Constants for camera movement
const MOVE_SPEED = 5; // pixels per frame
const SMOOTH_FACTOR = 0.15; // easing factor for smooth movement

export function MapRenderer({ worldMap, onParcelClick }: MapRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const parcelGraphicsRef = useRef<Map<number, Graphics[]>>(new Map());
  const parcelContainerRef = useRef<Container | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  
  // Camera state
  const cameraRef = useRef({ x: 0, y: 0 }); // current position
  const targetCameraRef = useRef({ x: 0, y: 0 }); // target position
  const keysRef = useRef<Set<string>>(new Set()); // pressed keys

  // Camera movement update function for Pixi ticker
  const updateCameraLoop = useCallback(() => {
    // Update target based on keys pressed
    const moveX = (keysRef.current.has('d') || keysRef.current.has('D') || keysRef.current.has('ArrowRight') ? -MOVE_SPEED : 0) +
                  (keysRef.current.has('a') || keysRef.current.has('A') || keysRef.current.has('ArrowLeft') ? MOVE_SPEED : 0);
    const moveY = (keysRef.current.has('s') || keysRef.current.has('S') || keysRef.current.has('ArrowDown') ? -MOVE_SPEED : 0) +
                  (keysRef.current.has('w') || keysRef.current.has('W') || keysRef.current.has('ArrowUp') ? MOVE_SPEED : 0);
    
    targetCameraRef.current.x += moveX;
    targetCameraRef.current.y += moveY;
    
    // Apply wrapping for circular map (toroidal topology)
    const mapWidth = worldMap.width;
    const mapHeight = worldMap.height;
    
    // Wrap horizontally (east-west) - keep camera within one map width
    while (targetCameraRef.current.x > mapWidth / 2) {
      targetCameraRef.current.x -= mapWidth;
      cameraRef.current.x -= mapWidth;
    }
    while (targetCameraRef.current.x < -mapWidth / 2) {
      targetCameraRef.current.x += mapWidth;
      cameraRef.current.x += mapWidth;
    }
    
    // Wrap vertically (north-south) - keep camera within one map height
    while (targetCameraRef.current.y > mapHeight / 2) {
      targetCameraRef.current.y -= mapHeight;
      cameraRef.current.y -= mapHeight;
    }
    while (targetCameraRef.current.y < -mapHeight / 2) {
      targetCameraRef.current.y += mapHeight;
      cameraRef.current.y += mapHeight;
    }
    
    // Smooth camera movement with easing
    cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * SMOOTH_FACTOR;
    cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * SMOOTH_FACTOR;
    
    // Update container position
    if (parcelContainerRef.current) {
      parcelContainerRef.current.x = cameraRef.current.x;
      parcelContainerRef.current.y = cameraRef.current.y;
    }
  }, [worldMap.width, worldMap.height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup = false;
    const localParcelGraphics = new Map<number, Graphics[]>();

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

        // Create main container for all map tiles
        const mainContainer = new Container();
        app.stage.addChild(mainContainer);
        
        // Create 9 containers for toroidal wrapping (3x3 grid)
        // Center, and 8 surrounding tiles
        const tileOffsets = [
          { x: 0, y: 0 },           // center
          { x: -1, y: 0 },          // left
          { x: 1, y: 0 },           // right
          { x: 0, y: -1 },          // top
          { x: 0, y: 1 },           // bottom
          { x: -1, y: -1 },         // top-left
          { x: 1, y: -1 },          // top-right
          { x: -1, y: 1 },          // bottom-left
          { x: 1, y: 1 },           // bottom-right
        ];
        
        tileOffsets.forEach((offset) => {
          const tileContainer = new Container();
          tileContainer.x = offset.x * worldMap.width;
          tileContainer.y = offset.y * worldMap.height;
          mainContainer.addChild(tileContainer);
          
          // Render all parcels in this tile
          worldMap.parcels.forEach((parcel) => {
            const graphics = new Graphics();
            renderParcel(graphics, parcel, false);

            // Make all tiles interactive so clicks work on wrapped tiles too
            graphics.eventMode = 'static';
            graphics.cursor = 'pointer';
            graphics.on('pointerdown', (event: FederatedPointerEvent) => {
              event.stopPropagation();
              setSelectedParcelId(parcel.id);
              onParcelClick?.(parcel);
            });
            
            // Store all graphics instances for each parcel (across all tiles)
            if (!localParcelGraphics.has(parcel.id)) {
              localParcelGraphics.set(parcel.id, []);
            }
            localParcelGraphics.get(parcel.id)!.push(graphics);

            tileContainer.addChild(graphics);
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
        });
        
        parcelContainerRef.current = mainContainer;

        // Store in ref for use in other effect
        parcelGraphicsRef.current = localParcelGraphics;
        
        // Use Pixi's ticker for camera updates
        app.ticker.add(updateCameraLoop);
      } catch (error) {
        console.error('Failed to initialize Pixi application:', error);
      }
    })();
    
    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current.add(e.key);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cleanup = true;
      
      // Cleanup keyboard listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      try {
        if (app) {
          // Remove ticker before destroying
          if (app.ticker) {
            app.ticker.remove(updateCameraLoop);
          }
          if (app.stage) {
            app.destroy(true, { children: true, texture: true });
          }
        }
      } catch {
        // Ignore cleanup errors
      }
      localParcelGraphics.clear();
    };
  }, [worldMap, onParcelClick, updateCameraLoop]);

  // Update selected parcel highlighting
  useEffect(() => {
    parcelGraphicsRef.current.forEach((graphicsArray, parcelId) => {
      const parcel = worldMap.parcels.get(parcelId);
      if (parcel) {
        // Update all instances of this parcel across all tiles
        graphicsArray.forEach((graphics) => {
          graphics.clear();
          renderParcel(graphics, parcel, parcelId === selectedParcelId);
        });
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
 * Render a single parcel
 */
function renderParcel(graphics: Graphics, parcel: Parcel, isSelected: boolean): void {
  if (parcel.vertices.length < 3) return;

  const color = TERRAIN_COLORS[parcel.terrain];

  // Fill the polygon
  graphics.poly(parcel.vertices.map(v => [v.x, v.y]).flat());
  graphics.fill({ color, alpha: 1 });

  // Draw border
  const borderColor = isSelected ? 0xffff00 : 0x000000;
  const borderWidth = isSelected ? 3 : 0.5;
  const borderAlpha = isSelected ? 1 : 0.3;

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


