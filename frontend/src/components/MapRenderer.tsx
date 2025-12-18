/**
 * Map renderer using Pixi.js for high-performance polygon rendering
 * with WASD movement, smooth scrolling, and viewport culling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, Graphics, Container, FederatedPointerEvent } from 'pixi.js';
import type { WorldMap, Parcel } from '@civilization/shared';
import { TerrainType } from '../types/map';

// Extended Graphics type to store parcel ID
interface ParcelGraphics extends Graphics {
  parcelId?: string;
}

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

// Constants for rendering
const BORDER_WIDTH = 0.5;
const BORDER_COLOR = 0x000000;
const BORDER_ALPHA = 0.3;
const HIGHLIGHT_WIDTH = 3;
const HIGHLIGHT_COLOR = 0xffff00;

/**
 * Calculate which tile offsets are visible based on camera position and viewport size
 * @param cameraX Camera x position
 * @param cameraY Camera y position
 * @param viewportWidth Viewport width
 * @param viewportHeight Viewport height
 * @param mapWidth Map width
 * @param mapHeight Map height
 * @param zoom Current zoom level
 * @returns Array of tile offsets that are visible
 */
function getVisibleTileOffsets(
  cameraX: number,
  cameraY: number,
  viewportWidth: number,
  viewportHeight: number,
  mapWidth: number,
  mapHeight: number,
  zoom: number
): Array<{ x: number; y: number }> {
  // Calculate the world coordinates of the viewport bounds
  const viewportWorldWidth = viewportWidth / zoom;
  const viewportWorldHeight = viewportHeight / zoom;
  
  // Calculate viewport bounds in world space
  const viewportLeft = -cameraX / zoom;
  const viewportRight = viewportLeft + viewportWorldWidth;
  const viewportTop = -cameraY / zoom;
  const viewportBottom = viewportTop + viewportWorldHeight;
  
  // Determine which tiles are needed
  const visibleTiles: Array<{ x: number; y: number }> = [];
  
  // Calculate tile range
  const minTileX = Math.floor(viewportLeft / mapWidth);
  const maxTileX = Math.floor(viewportRight / mapWidth);
  const minTileY = Math.floor(viewportTop / mapHeight);
  const maxTileY = Math.floor(viewportBottom / mapHeight);
  
  // Add all tiles that intersect with the viewport
  for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
    for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
      visibleTiles.push({ x: tileX, y: tileY });
    }
  }
  
  return visibleTiles;
}

// Interface for tracking tile containers
interface TileContainers {
  tileContainer: Container;
  highlightTileContainer: Container;
}

export function MapRenderer({ worldMap, onParcelClick }: MapRendererProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const parcelGraphicsRef = useRef<Map<string, Graphics[]>>(new Map());
  const parcelContainerRef = useRef<Container | null>(null);
  const highlightContainerRef = useRef<Container | null>(null);
  const highlightGraphicsRef = useRef<Map<string, Graphics[]>>(new Map());
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  
  // Track active tiles by their offset key (e.g., "0,0", "1,0", etc.)
  const activeTilesRef = useRef<Map<string, TileContainers>>(new Map());

  // Store worldMap dimensions to avoid recreating updateCameraLoop when worldMap changes
  const worldMapDimensionsRef = useRef({ width: worldMap.width, height: worldMap.height });
  worldMapDimensionsRef.current = { width: worldMap.width, height: worldMap.height };

  // Store onParcelClick in ref to avoid recreating click handlers
  const onParcelClickRef = useRef(onParcelClick);
  onParcelClickRef.current = onParcelClick;

  // Consolidated camera and zoom state
  const viewStateRef = useRef({
    camera: { x: 0, y: 0 },
    targetCamera: { x: 0, y: 0 },
    zoom: MIN_ZOOM,
    targetZoom: MIN_ZOOM,
    zoomPoint: null as { x: number; y: number } | null,
  });
  const keysRef = useRef<Set<string>>(new Set()); // pressed keys

  // Helper to update container position and scale
  const updateContainer = useCallback((container: Container, x: number, y: number, scale: number) => {
    container.x = x;
    container.y = y;
    container.scale.set(scale);
  }, []);

  // Callback to update visible tiles based on current viewport
  const updateVisibleTilesRef = useRef<(() => void) | null>(null);
  
  // Track when tiles were last updated to avoid excessive updates
  const lastTileUpdateRef = useRef({ camera: { x: 0, y: 0 }, zoom: MIN_ZOOM });
  
  // Camera movement update function for Pixi ticker
  // Note: worldMapDimensionsRef and onParcelClickRef are intentionally not in dependencies
  // to keep this callback stable and prevent MapRenderer re-initialization on clicks/updates
  const updateCameraLoop = useCallback(() => {
    const state = viewStateRef.current;

    // Calculate movement based on pressed keys
    const moveX = (keysRef.current.has('d') || keysRef.current.has('D') || keysRef.current.has('ArrowRight') ? -MOVE_SPEED : 0) +
      (keysRef.current.has('a') || keysRef.current.has('A') || keysRef.current.has('ArrowLeft') ? MOVE_SPEED : 0);
    const moveY = (keysRef.current.has('s') || keysRef.current.has('S') || keysRef.current.has('ArrowDown') ? -MOVE_SPEED : 0) +
      (keysRef.current.has('w') || keysRef.current.has('W') || keysRef.current.has('ArrowUp') ? MOVE_SPEED : 0);

    state.targetCamera.x += moveX;
    state.targetCamera.y += moveY;

    // Apply wrapping for circular map (toroidal topology)
    const { width: mapWidth, height: mapHeight } = worldMapDimensionsRef.current;
    const halfWidth = mapWidth / 2;
    const halfHeight = mapHeight / 2;

    // Wrap horizontally and vertically
    if (state.targetCamera.x > halfWidth) {
      state.targetCamera.x -= mapWidth;
      state.camera.x -= mapWidth;
    } else if (state.targetCamera.x < -halfWidth) {
      state.targetCamera.x += mapWidth;
      state.camera.x += mapWidth;
    }

    if (state.targetCamera.y > halfHeight) {
      state.targetCamera.y -= mapHeight;
      state.camera.y -= mapHeight;
    } else if (state.targetCamera.y < -halfHeight) {
      state.targetCamera.y += mapHeight;
      state.camera.y += mapHeight;
    }

    // Smooth zoom with easing
    const oldZoom = state.zoom;
    state.zoom += (state.targetZoom - state.zoom) * ZOOM_SMOOTH_FACTOR;

    // Adjust camera position when zooming to keep zoom point fixed
    const isZooming = state.zoomPoint !== null && Math.abs(state.zoom - oldZoom) > ZOOM_CHANGE_THRESHOLD;

    if (isZooming && state.zoomPoint) {
      const { x: pointX, y: pointY } = state.zoomPoint;
      const worldX = (pointX - state.camera.x) / oldZoom;
      const worldY = (pointY - state.camera.y) / oldZoom;

      state.camera.x = pointX - worldX * state.zoom;
      state.camera.y = pointY - worldY * state.zoom;
      state.targetCamera.x = state.camera.x;
      state.targetCamera.y = state.camera.y;
    } else {
      // Apply smooth camera movement when not zooming
      state.camera.x += (state.targetCamera.x - state.camera.x) * SMOOTH_FACTOR;
      state.camera.y += (state.targetCamera.y - state.camera.y) * SMOOTH_FACTOR;
    }

    // Update containers
    if (parcelContainerRef.current) {
      updateContainer(parcelContainerRef.current, state.camera.x, state.camera.y, state.zoom);
    }
    if (highlightContainerRef.current) {
      updateContainer(highlightContainerRef.current, state.camera.x, state.camera.y, state.zoom);
    }
    
    // Update visible tiles when camera or zoom changes significantly
    const lastUpdate = lastTileUpdateRef.current;
    const cameraMoved = Math.abs(state.camera.x - lastUpdate.camera.x) > mapWidth / 4 ||
                       Math.abs(state.camera.y - lastUpdate.camera.y) > mapHeight / 4;
    const zoomChanged = Math.abs(state.zoom - lastUpdate.zoom) > 0.2;
    
    if (cameraMoved || zoomChanged) {
      if (updateVisibleTilesRef.current) {
        updateVisibleTilesRef.current();
      }
      lastTileUpdateRef.current = {
        camera: { x: state.camera.x, y: state.camera.y },
        zoom: state.zoom
      };
    }
  }, [updateContainer]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup = false;
    const localParcelGraphics = new Map<string, Graphics[]>();
    const localHighlightGraphics = new Map<string, Graphics[]>();

    // Store reference to container element
    const container = canvasRef.current;

    // Create Pixi application
    const app = new Application();
    appRef.current = app;

    (async () => {
      try {
        // Use window dimensions instead of map dimensions for adaptive sizing
        const containerWidth = container.clientWidth || window.innerWidth;
        const containerHeight = container.clientHeight || window.innerHeight;

        await app.init({
          width: containerWidth,
          height: containerHeight,
          backgroundColor: 0x1a1a1a,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (cleanup) {
          return;
        }

        container.appendChild(app.canvas);

        // Create main container for all map tiles (terrain layer)
        const mainContainer = new Container();
        app.stage.addChild(mainContainer);

        // Create highlight container on top of terrain (selection layer)
        const highlightContainer = new Container();
        app.stage.addChild(highlightContainer);

        // Create tile containers for toroidal wrapping (3x3 grid)
        const createTileContainers = (offsetX: number, offsetY: number) => {
          if (!worldMap) {
            throw new Error('worldMap is null');
          }
          const tileContainer = new Container();
          tileContainer.x = offsetX * worldMap.width;
          tileContainer.y = offsetY * worldMap.height;
          mainContainer.addChild(tileContainer);

          const highlightTileContainer = new Container();
          highlightTileContainer.x = offsetX * worldMap.width;
          highlightTileContainer.y = offsetY * worldMap.height;
          highlightContainer.addChild(highlightTileContainer);

          return { tileContainer, highlightTileContainer };
        };

        // Shared click handler for all parcel graphics
        const handleParcelClick = (event: FederatedPointerEvent) => {
          if (!worldMap) return;
          const graphics = event.currentTarget as ParcelGraphics;
          const parcelId = graphics.parcelId;
          if (parcelId !== undefined) {
            event.stopPropagation();
            setSelectedParcelId(parcelId);
            const parcel = worldMap.parcels.get(parcelId);
            if (parcel) {
              onParcelClickRef.current?.(parcel);
            }
          }
        };
        
        // Function to create a tile at a specific offset
        const createTile = (offsetX: number, offsetY: number) => {
          const tileKey = `${offsetX},${offsetY}`;
          
          // Skip if tile already exists
          if (activeTilesRef.current.has(tileKey)) {
            return;
          }
          
          const { tileContainer, highlightTileContainer } = createTileContainers(offsetX, offsetY);
          
          // Render all parcels in this tile
          worldMap.parcels.forEach((parcel) => {
            // Create and configure parcel graphics
            const graphics = new Graphics() as ParcelGraphics;
            renderParcel(graphics, parcel);
            graphics.eventMode = 'static';
            graphics.cursor = 'pointer';
            graphics.parcelId = parcel.id;
            graphics.on('pointerdown', handleParcelClick);

            // Store and add to container
            if (!localParcelGraphics.has(parcel.id)) {
              localParcelGraphics.set(parcel.id, []);
            }
            localParcelGraphics.get(parcel.id)!.push(graphics);
            tileContainer.addChild(graphics);

            // Create highlight graphics
            const highlightGraphics = new Graphics();
            if (!localHighlightGraphics.has(parcel.id)) {
              localHighlightGraphics.set(parcel.id, []);
            }
            localHighlightGraphics.get(parcel.id)!.push(highlightGraphics);
            highlightTileContainer.addChild(highlightGraphics);
          });
          
          // Store tile containers
          activeTilesRef.current.set(tileKey, { tileContainer, highlightTileContainer });
        };
        
        // Function to hide a tile at a specific offset
        const hideTile = (tileKey: string) => {
          const tile = activeTilesRef.current.get(tileKey);
          if (!tile) return;
          
          // Hide instead of destroy to avoid issues with references
          tile.tileContainer.visible = false;
          tile.highlightTileContainer.visible = false;
        };
        
        // Function to show a tile at a specific offset
        const showTile = (tileKey: string) => {
          const tile = activeTilesRef.current.get(tileKey);
          if (!tile) return;
          
          tile.tileContainer.visible = true;
          tile.highlightTileContainer.visible = true;
        };
        
        // Function to update visible tiles
        const updateVisibleTiles = () => {
          if (!app.screen) return;
          
          const state = viewStateRef.current;
          const visibleOffsets = getVisibleTileOffsets(
            state.camera.x,
            state.camera.y,
            app.screen.width,
            app.screen.height,
            worldMap.width,
            worldMap.height,
            state.zoom
          );
          
          // Create set of visible tile keys
          const visibleKeys = new Set(visibleOffsets.map(({ x, y }) => `${x},${y}`));
          
          // Hide tiles that are no longer visible
          const currentKeys = Array.from(activeTilesRef.current.keys());
          for (const key of currentKeys) {
            if (!visibleKeys.has(key)) {
              hideTile(key);
            }
          }
          
          // Show or create visible tiles
          for (const offset of visibleOffsets) {
            const tileKey = `${offset.x},${offset.y}`;
            if (activeTilesRef.current.has(tileKey)) {
              showTile(tileKey);
            } else {
              createTile(offset.x, offset.y);
            }
          }
        };
        
        // Set container refs before creating tiles
        parcelContainerRef.current = mainContainer;
        highlightContainerRef.current = highlightContainer;
        
        // Store graphics refs for use in other effects
        parcelGraphicsRef.current = localParcelGraphics;
        highlightGraphicsRef.current = localHighlightGraphics;
        
        // Store update function in ref for use in camera loop
        updateVisibleTilesRef.current = updateVisibleTiles;
        
        // Initial tile setup
        updateVisibleTiles();

        // Use Pixi's ticker for camera updates
        app.ticker.add(updateCameraLoop);
      } catch (error) {
        console.error('Failed to initialize Pixi application:', error);
      }
    })();

    // Helper to handle window resize
    const handleResize = () => {
      if (appRef.current) {
        const newWidth = container.clientWidth || window.innerWidth;
        const newHeight = container.clientHeight || window.innerHeight;
        appRef.current.renderer.resize(newWidth, newHeight);
      }
    };

    // Helper to adjust zoom level
    const adjustZoom = (delta: number) => {
      const state = viewStateRef.current;
      state.targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.targetZoom + delta));
    };

    // Helper to set zoom point to viewport center
    const setZoomPointToCenter = () => {
      if (appRef.current) {
        viewStateRef.current.zoomPoint = {
          x: appRef.current.screen.width / 2,
          y: appRef.current.screen.height / 2
        };
      }
    };

    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;

      // Prevent default scrolling for arrow keys
      if (key.startsWith('Arrow')) {
        e.preventDefault();
      }

      // Handle zoom with + and - keys
      if (key === '+' || key === '=') {
        e.preventDefault();
        setZoomPointToCenter();
        adjustZoom(ZOOM_SPEED);
        return;
      }

      if (key === '-' || key === '_') {
        e.preventDefault();
        setZoomPointToCenter();
        adjustZoom(-ZOOM_SPEED);
        return;
      }

      keysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    // Mouse wheel event handler for zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (!appRef.current?.canvas) return;

      const rect = appRef.current.canvas.getBoundingClientRect();
      viewStateRef.current.zoomPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      adjustZoom(e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);

    // Add wheel listener to container
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      cleanup = true;

      // Cleanup event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('wheel', handleWheel);

      // Cleanup Pixi application
      try {
        if (app?.ticker) {
          app.ticker.remove(updateCameraLoop);
        }
        if (app?.stage) {
          app.destroy(true, { children: true, texture: true });
        }
      } catch {
        // Silently ignore cleanup errors
      }

      // Clear all graphics maps
      localParcelGraphics.clear();
      localHighlightGraphics.clear();
      parcelGraphicsRef.current.clear();
      highlightGraphicsRef.current.clear();
    };
  }, [worldMap, updateCameraLoop]);

  // Update selected parcel highlighting
  const prevSelectedParcelIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!worldMap) return;
    const prevId = prevSelectedParcelIdRef.current;


    // Clear previous selection highlight
    if (prevId !== null) {
      const prevHighlightArray = highlightGraphicsRef.current.get(prevId);
      prevHighlightArray?.forEach(graphics => graphics.clear());
    }

    // Draw highlight for new selected parcel
    if (selectedParcelId !== null) {
      const parcel = worldMap.parcels.get(selectedParcelId);
      const highlightArray = highlightGraphicsRef.current.get(selectedParcelId);

      if (parcel && highlightArray) {
        highlightArray.forEach(graphics => renderHighlight(graphics, parcel));
      }
    }

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
 * Render a single parcel with terrain, border, and resource indicators
 */
function renderParcel(graphics: Graphics, parcel: Parcel): void {
  if (parcel.vertices.length < 3) return;

  // Build vertices array efficiently
  const vertexCount = parcel.vertices.length;
  const vertices = new Array(vertexCount * 2);
  for (let i = 0; i < vertexCount; i++) {
    const vertex = parcel.vertices[i];
    vertices[i * 2] = vertex.x;
    vertices[i * 2 + 1] = vertex.y;
  }

  // Fill the polygon with terrain color
  graphics.poly(vertices);
  graphics.fill({ color: TERRAIN_COLORS[parcel.terrain], alpha: 1 });

  // Draw subtle border
  graphics.poly(vertices);
  graphics.stroke({ width: BORDER_WIDTH, color: BORDER_COLOR, alpha: BORDER_ALPHA });
}

/**
 * Render selection highlight for a parcel
 */
function renderHighlight(graphics: Graphics, parcel: Parcel): void {
  if (parcel.vertices.length < 3) return;

  // Build vertices array efficiently
  const vertexCount = parcel.vertices.length;
  const vertices = new Array(vertexCount * 2);
  for (let i = 0; i < vertexCount; i++) {
    const vertex = parcel.vertices[i];
    vertices[i * 2] = vertex.x;
    vertices[i * 2 + 1] = vertex.y;
  }

  graphics.poly(vertices);
  graphics.stroke({ width: HIGHLIGHT_WIDTH, color: HIGHLIGHT_COLOR, alpha: 1 });
}
