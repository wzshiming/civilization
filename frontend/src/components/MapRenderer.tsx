/**
 * Map renderer using @pixi/react for high-performance polygon rendering
 * with WASD movement, smooth scrolling, and viewport culling
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js';
import type { WorldMap, Parcel } from '@civilization/shared';
import { TerrainType } from '../types/map';

// Register PixiJS components with @pixi/react
extend({ Container, Graphics });

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

// Tile offsets for toroidal wrapping (center + 8 surrounding tiles)
// Ordered intentionally: center tile first, then cardinal directions, then diagonals
const TILE_OFFSETS = [
  { x: 0, y: 0 },     // center
  { x: -1, y: 0 },    // left
  { x: 1, y: 0 },     // right
  { x: 0, y: -1 },    // top
  { x: 0, y: 1 },     // bottom
  { x: -1, y: -1 },   // top-left
  { x: 1, y: -1 },    // top-right
  { x: -1, y: 1 },    // bottom-left
  { x: 1, y: 1 },     // bottom-right
] as const;

/**
 * Component for rendering a single parcel
 */
interface ParcelGraphicProps {
  parcel: Parcel;
  onClick: (parcelId: string) => void;
}

function ParcelGraphic({ parcel, onClick }: ParcelGraphicProps) {
  const handleClick = useCallback((event: FederatedPointerEvent) => {
    event.stopPropagation();
    onClick(parcel.id);
  }, [parcel.id, onClick]);

  const draw = useCallback((g: Graphics) => {
    g.clear();
    renderParcel(g, parcel);
  }, [parcel]);

  return (
    <pixiGraphics
      draw={draw}
      eventMode="static"
      cursor="pointer"
      onPointerDown={handleClick}
    />
  );
}

/**
 * Component for rendering highlight on selected parcel
 */
interface HighlightGraphicProps {
  parcel: Parcel;
}

function HighlightGraphic({ parcel }: HighlightGraphicProps) {
  const draw = useCallback((g: Graphics) => {
    g.clear();
    renderHighlight(g, parcel);
  }, [parcel]);

  return <pixiGraphics draw={draw} />;
}

export function MapRenderer({ worldMap, onParcelClick }: MapRendererProps) {
  const appRef = useRef<any>(null);
  const parcelContainerRef = useRef<Container | null>(null);
  const highlightContainerRef = useRef<Container | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

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
  const updateContainer = useCallback((container: Container | null, x: number, y: number, scale: number) => {
    if (container) {
      container.x = x;
      container.y = y;
      container.scale.set(scale);
    }
  }, []);

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
  }, [updateContainer]);

  // Set up camera animation ticker
  useEffect(() => {
    if (!appRef.current) return;

    const app = appRef.current;
    app.ticker.add(updateCameraLoop);

    return () => {
      app.ticker.remove(updateCameraLoop);
    };
  }, [updateCameraLoop]);

  // Set up event handlers for keyboard and wheel
  useEffect(() => {
    // Helper to adjust zoom level
    const adjustZoom = (delta: number) => {
      const state = viewStateRef.current;
      state.targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.targetZoom + delta));
    };

    // Helper to set zoom point to viewport center
    const setZoomPointToCenter = () => {
      viewStateRef.current.zoomPoint = {
        x: dimensions.width / 2,
        y: dimensions.height / 2
      };
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

      viewStateRef.current.zoomPoint = { x: e.clientX, y: e.clientY };
      adjustZoom(e.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [dimensions]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle parcel click
  const handleParcelClick = useCallback((parcelId: string) => {
    setSelectedParcelId(parcelId);
    const parcel = worldMap.parcels.get(parcelId);
    if (parcel) {
      onParcelClickRef.current?.(parcel);
    }
  }, [worldMap]);

  return (
    <Application
      ref={appRef}
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={0x1a1a1a}
      antialias={true}
      resolution={window.devicePixelRatio || 1}
      autoDensity={true}
    >
      {/* Main container for terrain layer */}
      <pixiContainer ref={parcelContainerRef}>
        {TILE_OFFSETS.map(({ x, y }, tileIdx) => (
          <pixiContainer key={`tile-${tileIdx}`} x={x * worldMap.width} y={y * worldMap.height}>
            {Array.from(worldMap.parcels.values()).map((parcel) => (
              <ParcelGraphic
                key={`${tileIdx}-${parcel.id}`}
                parcel={parcel}
                onClick={handleParcelClick}
              />
            ))}
          </pixiContainer>
        ))}
      </pixiContainer>

      {/* Highlight container on top */}
      <pixiContainer ref={highlightContainerRef}>
        {TILE_OFFSETS.map(({ x, y }, tileIdx) => (
          <pixiContainer key={`highlight-tile-${tileIdx}`} x={x * worldMap.width} y={y * worldMap.height}>
            {selectedParcelId && worldMap.parcels.get(selectedParcelId) && (
              <HighlightGraphic
                key={`highlight-${tileIdx}-${selectedParcelId}`}
                parcel={worldMap.parcels.get(selectedParcelId)!}
              />
            )}
          </pixiContainer>
        ))}
      </pixiContainer>
    </Application>
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
