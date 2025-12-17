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

// Constants for zoom
const MIN_ZOOM = 1.0; // minimum zoom level (current level)
const MAX_ZOOM = 4.0; // maximum zoom level (4x zoom in)
const ZOOM_SPEED = 0.1; // zoom increment/decrement per step
const ZOOM_SMOOTH_FACTOR = 0.15; // easing factor for smooth zoom
const ZOOM_CHANGE_THRESHOLD = 0.001; // minimum zoom change to trigger position adjustment

export function MapRenderer({ worldMap, onParcelClick }: MapRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const parcelGraphicsRef = useRef<Map<number, Graphics[]>>(new Map());
  const parcelContainerRef = useRef<Container | null>(null);
  const highlightContainerRef = useRef<Container | null>(null);
  const highlightGraphicsRef = useRef<Map<number, Graphics[]>>(new Map());
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  
  // Camera state
  const cameraRef = useRef({ x: 0, y: 0 }); // current position
  const targetCameraRef = useRef({ x: 0, y: 0 }); // target position
  const keysRef = useRef<Set<string>>(new Set()); // pressed keys
  
  // Zoom state
  const zoomRef = useRef(MIN_ZOOM); // current zoom level
  const targetZoomRef = useRef(MIN_ZOOM); // target zoom level
  const zoomPointRef = useRef<{ x: number; y: number } | null>(null); // point to zoom towards

  // Helper to update container position and scale
  const updateContainer = useCallback((container: Container, x: number, y: number, scale: number) => {
    container.x = x;
    container.y = y;
    container.scale.set(scale);
  }, []);

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
    const { width: mapWidth, height: mapHeight } = worldMap;
    
    // Wrap horizontally and vertically
    while (targetCameraRef.current.x > mapWidth / 2) {
      targetCameraRef.current.x -= mapWidth;
      cameraRef.current.x -= mapWidth;
    }
    while (targetCameraRef.current.x < -mapWidth / 2) {
      targetCameraRef.current.x += mapWidth;
      cameraRef.current.x += mapWidth;
    }
    while (targetCameraRef.current.y > mapHeight / 2) {
      targetCameraRef.current.y -= mapHeight;
      cameraRef.current.y -= mapHeight;
    }
    while (targetCameraRef.current.y < -mapHeight / 2) {
      targetCameraRef.current.y += mapHeight;
      cameraRef.current.y += mapHeight;
    }
    
    // Smooth zoom with easing
    const oldZoom = zoomRef.current;
    zoomRef.current += (targetZoomRef.current - zoomRef.current) * ZOOM_SMOOTH_FACTOR;
    
    // Adjust camera position when zooming to keep zoom point fixed
    const isZooming = zoomPointRef.current !== null && Math.abs(zoomRef.current - oldZoom) > ZOOM_CHANGE_THRESHOLD;
    
    if (isZooming && zoomPointRef.current) {
      const { x: pointX, y: pointY } = zoomPointRef.current;
      const worldX = (pointX - cameraRef.current.x) / oldZoom;
      const worldY = (pointY - cameraRef.current.y) / oldZoom;
      
      cameraRef.current.x = pointX - worldX * zoomRef.current;
      cameraRef.current.y = pointY - worldY * zoomRef.current;
      targetCameraRef.current.x = cameraRef.current.x;
      targetCameraRef.current.y = cameraRef.current.y;
    } else {
      // Apply smooth camera movement when not zooming
      cameraRef.current.x += (targetCameraRef.current.x - cameraRef.current.x) * SMOOTH_FACTOR;
      cameraRef.current.y += (targetCameraRef.current.y - cameraRef.current.y) * SMOOTH_FACTOR;
    }
    
    // Update containers
    if (parcelContainerRef.current) {
      updateContainer(parcelContainerRef.current, cameraRef.current.x, cameraRef.current.y, zoomRef.current);
    }
    if (highlightContainerRef.current) {
      updateContainer(highlightContainerRef.current, cameraRef.current.x, cameraRef.current.y, zoomRef.current);
    }
  }, [worldMap, updateContainer]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup = false;
    const localParcelGraphics = new Map<number, Graphics[]>();
    const localHighlightGraphics = new Map<number, Graphics[]>();

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

        // Create main container for all map tiles (terrain layer)
        const mainContainer = new Container();
        app.stage.addChild(mainContainer);
        
        // Create highlight container on top of terrain (selection layer)
        const highlightContainer = new Container();
        app.stage.addChild(highlightContainer);
        
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
          
          // Create highlight tile container at same position
          const highlightTileContainer = new Container();
          highlightTileContainer.x = offset.x * worldMap.width;
          highlightTileContainer.y = offset.y * worldMap.height;
          highlightContainer.addChild(highlightTileContainer);
          
          // Render all parcels in this tile
          worldMap.parcels.forEach((parcel) => {
            const graphics = new Graphics();
            renderParcel(graphics, parcel);

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
            
            // Create highlight graphics for this parcel in the highlight layer
            const highlightGraphics = new Graphics();
            if (!localHighlightGraphics.has(parcel.id)) {
              localHighlightGraphics.set(parcel.id, []);
            }
            localHighlightGraphics.get(parcel.id)!.push(highlightGraphics);
            highlightTileContainer.addChild(highlightGraphics);
          });
        });
        
        parcelContainerRef.current = mainContainer;
        highlightContainerRef.current = highlightContainer;

        // Store in ref for use in other effect
        parcelGraphicsRef.current = localParcelGraphics;
        highlightGraphicsRef.current = localHighlightGraphics;
        
        // Use Pixi's ticker for camera updates
        app.ticker.add(updateCameraLoop);
      } catch (error) {
        console.error('Failed to initialize Pixi application:', error);
      }
    })();
    
    // Helper to adjust zoom level
    const adjustZoom = (delta: number) => {
      targetZoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoomRef.current + delta));
    };

    // Helper to set zoom point to viewport center
    const setZoomPointToCenter = () => {
      if (appRef.current) {
        zoomPointRef.current = {
          x: appRef.current.screen.width / 2,
          y: appRef.current.screen.height / 2
        };
      }
    };

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      // Handle zoom with + and - keys
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoomPointToCenter();
        adjustZoom(ZOOM_SPEED);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoomPointToCenter();
        adjustZoom(-ZOOM_SPEED);
      }
      
      keysRef.current.add(e.key);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    
    // Mouse wheel event handler for zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (!appRef.current?.canvas) return;
      
      const rect = appRef.current.canvas.getBoundingClientRect();
      zoomPointRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      
      adjustZoom(e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Capture canvas element for cleanup
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      cleanup = true;
      
      // Cleanup keyboard listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // Cleanup wheel listener
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
      
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
      localHighlightGraphics.clear();
      parcelGraphicsRef.current.clear();
      highlightGraphicsRef.current.clear();
    };
  }, [worldMap, onParcelClick, updateCameraLoop]);

  // Update selected parcel highlighting
  const prevSelectedParcelIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Clear previous selection highlight if it exists
    if (prevSelectedParcelIdRef.current !== null) {
      const prevHighlightArray = highlightGraphicsRef.current.get(prevSelectedParcelIdRef.current);
      if (prevHighlightArray) {
        prevHighlightArray.forEach((graphics) => {
          graphics.clear();
        });
      }
    }
    
    // Draw highlight for new selected parcel if any
    if (selectedParcelId !== null) {
      const parcel = worldMap.parcels.get(selectedParcelId);
      const highlightArray = highlightGraphicsRef.current.get(selectedParcelId);
      
      if (parcel && highlightArray) {
        // Draw highlight on all tile instances
        highlightArray.forEach((graphics) => {
          renderHighlight(graphics, parcel);
        });
      }
    }
    
    // Update previous selection reference
    prevSelectedParcelIdRef.current = selectedParcelId;
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
function renderParcel(graphics: Graphics, parcel: Parcel): void {
  if (parcel.vertices.length < 3) return;

  const color = TERRAIN_COLORS[parcel.terrain];
  const vertices = parcel.vertices.map(v => [v.x, v.y]).flat();

  // Fill the polygon
  graphics.poly(vertices);
  graphics.fill({ color, alpha: 1 });

  // Draw border (subtle border for all parcels)
  graphics.poly(vertices);
  graphics.stroke({ width: 0.5, color: 0x000000, alpha: 0.3 });

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
 * Render selection highlight for a parcel
 */
function renderHighlight(graphics: Graphics, parcel: Parcel): void {
  if (parcel.vertices.length < 3) return;

  const vertices = parcel.vertices.map(v => [v.x, v.y]).flat();

  // Draw bright yellow border on top of everything
  graphics.poly(vertices);
  graphics.stroke({ width: 3, color: 0xffff00, alpha: 1 });
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


