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

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const parcelContainerRef = useRef<Container | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Viewport state for panning and dragging
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastPointerPosRef = useRef({ x: 0, y: 0 });

  // Handle keyboard controls (WASD)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const moveSpeed = 20;
      let newX = viewport.x;
      let newY = viewport.y;

      switch (event.key.toLowerCase()) {
        case 'w':
          newY -= moveSpeed;
          break;
        case 's':
          newY += moveSpeed;
          break;
        case 'a':
          newX -= moveSpeed;
          break;
        case 'd':
          newX += moveSpeed;
          break;
        default:
          return;
      }

      // Update viewport (wrapping handled by container positioning)
      setViewport(prev => ({ ...prev, x: newX, y: newY }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewport]);

  // Update viewport dimensions on resize
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setViewport(prev => ({ ...prev, width: rect.width, height: rect.height }));
      }
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    let cleanup = false;
    const localParcelGraphics = new Map<number, Graphics>();

    // Create Pixi application
    const app = new Application();
    appRef.current = app;

    (async () => {
      try {
        const rect = canvasRef.current?.getBoundingClientRect();
        const canvasWidth = rect?.width || worldMap.width;
        const canvasHeight = rect?.height || worldMap.height;

        await app.init({
          width: canvasWidth,
          height: canvasHeight,
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

        // Create main container for all map content
        const mainContainer = new Container();
        parcelContainerRef.current = mainContainer;
        app.stage.addChild(mainContainer);

        // Make stage interactive for drag functionality
        app.stage.eventMode = 'static';
        app.stage.hitArea = app.screen;
        
        // Handle pointer down for drag start
        app.stage.on('pointerdown', (event: FederatedPointerEvent) => {
          isDraggingRef.current = true;
          setIsDragging(true);
          lastPointerPosRef.current = { x: event.global.x, y: event.global.y };
          app.stage.cursor = 'grabbing';
        });

        // Handle pointer move for dragging
        app.stage.on('pointermove', (event: FederatedPointerEvent) => {
          if (isDraggingRef.current) {
            const dx = event.global.x - lastPointerPosRef.current.x;
            const dy = event.global.y - lastPointerPosRef.current.y;
            
            lastPointerPosRef.current = { x: event.global.x, y: event.global.y };
            
            // Update viewport (no wrapping logic here, just accumulate)
            setViewport(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
          }
        });

        // Handle pointer up for drag end
        app.stage.on('pointerup', () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          app.stage.cursor = 'default';
        });

        app.stage.on('pointerupoutside', () => {
          isDraggingRef.current = false;
          setIsDragging(false);
          app.stage.cursor = 'default';
        });

        // Create 3x3 grid of map copies for seamless wrapping
        for (let yOffset = -1; yOffset <= 1; yOffset++) {
          for (let xOffset = -1; xOffset <= 1; xOffset++) {
            const offsetX = xOffset * worldMap.width;
            const offsetY = yOffset * worldMap.height;
            
            // Render all parcels for this offset
            worldMap.parcels.forEach((parcel) => {
              const graphics = new Graphics();
              renderParcel(graphics, parcel, false, { x: offsetX, y: offsetY });

              // Make interactive for parcel selection (only for center copy)
              if (xOffset === 0 && yOffset === 0) {
                graphics.eventMode = 'static';
                graphics.cursor = 'pointer';
                graphics.on('pointerdown', (event: FederatedPointerEvent) => {
                  // Only select parcel if not dragging
                  if (!isDraggingRef.current) {
                    event.stopPropagation();
                    setSelectedParcelId(parcel.id);
                    onParcelClick?.(parcel);
                  }
                });
                localParcelGraphics.set(parcel.id, graphics);
              }

              mainContainer.addChild(graphics);
            });

            // Render boundaries (for rivers) for this offset
            const boundaryGraphics = new Graphics();
            worldMap.boundaries.forEach((boundary) => {
              if (boundary.resources.length > 0) {
                // Draw river
                if (boundary.edge.length >= 2) {
                  boundaryGraphics.moveTo(boundary.edge[0].x + offsetX, boundary.edge[0].y + offsetY);
                  for (let i = 1; i < boundary.edge.length; i++) {
                    boundaryGraphics.lineTo(boundary.edge[i].x + offsetX, boundary.edge[i].y + offsetY);
                  }
                  boundaryGraphics.stroke({ width: 2, color: 0x4a9eff, alpha: 0.8 });
                }
              }
            });
            mainContainer.addChild(boundaryGraphics);
          }
        }

        // Store in ref for use in other effect
        parcelGraphicsRef.current = localParcelGraphics;
        
        // Mark as initialized after next frame to ensure Pixi is ready
        requestAnimationFrame(() => {
          if (!cleanup) {
            setIsInitialized(true);
          }
        });
      } catch (error) {
        console.error('Failed to initialize Pixi application:', error);
      }
    })();

    return () => {
      cleanup = true;
      setIsInitialized(false);
      try {
        if (app && app.stage) {
          app.destroy(true, { children: true, texture: true });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      localParcelGraphics.clear();
    };
  }, [worldMap, onParcelClick]);

  // Update viewport position with wrapping support
  useEffect(() => {
    if (isInitialized && parcelContainerRef.current) {
      const container = parcelContainerRef.current;
      
      // Normalize viewport position to always stay within bounds
      // This gives us seamless wrapping with the 3x3 grid
      let normalizedX = viewport.x % worldMap.width;
      let normalizedY = viewport.y % worldMap.height;
      
      // Ensure positive modulo
      if (normalizedX < 0) normalizedX += worldMap.width;
      if (normalizedY < 0) normalizedY += worldMap.height;
      
      // Position the container so the center copy aligns with the viewport
      // We add one map width/height to show the center copy
      container.x = worldMap.width - normalizedX;
      container.y = worldMap.height - normalizedY;
    }
  }, [isInitialized, viewport, worldMap.width, worldMap.height]);
  
  // Update selected parcel highlighting (only for center copy, offset 0,0)
  useEffect(() => {
    if (isInitialized && parcelGraphicsRef.current.size > 0) {
      // Use double requestAnimationFrame to ensure we're definitely between render cycles
      let rafId1: number;
      const rafId2 = requestAnimationFrame(() => {
        rafId1 = requestAnimationFrame(() => {
          parcelGraphicsRef.current.forEach((graphics, parcelId) => {
            const parcel = worldMap.parcels.get(parcelId);
            if (parcel && graphics && !graphics.destroyed) {
              try {
                graphics.clear();
                // Render with no offset since these are the center copies
                renderParcel(graphics, parcel, parcelId === selectedParcelId, { x: 0, y: 0 });
              } catch (e) {
                // Silently ignore errors during highlighting update
              }
            }
          });
        });
      });
      
      return () => {
        cancelAnimationFrame(rafId2);
        if (rafId1) cancelAnimationFrame(rafId1);
      };
    }
  }, [isInitialized, selectedParcelId, worldMap]);

  return (
    <div
      ref={canvasRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        maxWidth: '100%',
        maxHeight: '100%',
        width: '100%',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    />
  );
}

/**
 * Render a single parcel with optional offset for wrapping
 */
function renderParcel(graphics: Graphics, parcel: Parcel, isSelected: boolean, offset: { x: number; y: number } = { x: 0, y: 0 }): void {
  if (parcel.vertices.length < 3) return;

  const color = TERRAIN_COLORS[parcel.terrain];

  // Fill the polygon with offset
  graphics.poly(parcel.vertices.map(v => [v.x + offset.x, v.y + offset.y]).flat());
  graphics.fill({ color, alpha: 1 });

  // Draw border
  const borderColor = isSelected ? 0xffff00 : 0x000000;
  const borderWidth = isSelected ? 3 : 0.5;
  const borderAlpha = isSelected ? 1 : 0.3;

  graphics.poly(parcel.vertices.map(v => [v.x + offset.x, v.y + offset.y]).flat());
  graphics.stroke({ width: borderWidth, color: borderColor, alpha: borderAlpha });

  // Draw resource indicators
  if (parcel.resources.length > 0) {
    const centerX = parcel.center.x + offset.x;
    const centerY = parcel.center.y + offset.y;
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
