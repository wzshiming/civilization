import React, { useRef, useEffect, useState } from 'react';
import { GameMap, Point } from '../../../src/types';
import { isPointInPolygon } from '../utils/geometry';
import { Tool, Edit, EditHistory } from '../App';
import styles from './MapCanvas.module.css';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface MapCanvasProps {
  map: GameMap | null;
  selectedPlots: Set<string>;
  currentTool: Tool;
  selectedTerrain: string | null;
  onUpdateMap: (map: GameMap) => void;
  onUpdateSelection: (selection: Set<string>) => void;
  onUpdateHistory: (history: EditHistory) => void;
  editHistory: EditHistory;
  onZoomChange: (zoom: number) => void;
}

const MapCanvas: React.FC<MapCanvasProps> = ({
  map,
  selectedPlots,
  currentTool,
  selectedTerrain,
  onUpdateMap,
  onUpdateSelection,
  onUpdateHistory,
  editHistory,
  onZoomChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [hoveredPlot, setHoveredPlot] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    if (map) {
      fitToView();
    }
  }, [map]);

  useEffect(() => {
    render();
  }, [map, selectedPlots, hoveredPlot, camera]);

  useEffect(() => {
    onZoomChange(Math.round(camera.zoom * 100));
  }, [camera.zoom]);

  const fitToView = () => {
    if (!map || map.plots.length === 0 || !canvasRef.current) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    map.plots.forEach((plot) => {
      plot.vertices.forEach((v) => {
        minX = Math.min(minX, v.x);
        minY = Math.min(minY, v.y);
        maxX = Math.max(maxX, v.x);
        maxY = Math.max(maxY, v.y);
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;
    const zoomX = canvasRef.current.width / width;
    const zoomY = canvasRef.current.height / height;
    const zoom = Math.min(zoomX, zoomY) * 0.9;

    setCamera({
      x: (canvasRef.current.width - (minX + width / 2) * zoom) / 1,
      y: (canvasRef.current.height - (minY + height / 2) * zoom) / 1,
      zoom,
    });
  };

  const screenToWorld = (x: number, y: number): Point => {
    return {
      x: (x - camera.x) / camera.zoom,
      y: (y - camera.y) / camera.zoom,
    };
  };

  const worldToScreen = (x: number, y: number): Point => {
    return {
      x: x * camera.zoom + camera.x,
      y: y * camera.zoom + camera.y,
    };
  };

  const findPlotAt = (x: number, y: number): string | null => {
    if (!map) return null;
    for (const plot of map.plots) {
      if (isPointInPolygon(x, y, plot.vertices)) {
        return plot.plotID;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 2 || e.ctrlKey) {
      setIsDragging(true);
      setLastMousePos({ x, y });
    } else {
      const worldPos = screenToWorld(x, y);
      const plotID = findPlotAt(worldPos.x, worldPos.y);

      if (currentTool === Tool.SELECT) {
        if (plotID) {
          const newSelection = new Set(selectedPlots);
          if (e.shiftKey) {
            if (newSelection.has(plotID)) {
              newSelection.delete(plotID);
            } else {
              newSelection.add(plotID);
            }
          } else {
            newSelection.clear();
            newSelection.add(plotID);
          }
          onUpdateSelection(newSelection);
        }
      } else if (currentTool === Tool.PAINT && plotID && selectedTerrain) {
        paintPlot(plotID);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isDragging) {
      const dx = x - lastMousePos.x;
      const dy = y - lastMousePos.y;
      setCamera((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setLastMousePos({ x, y });
    } else {
      const worldPos = screenToWorld(x, y);
      const plotID = findPlotAt(worldPos.x, worldPos.y);
      setHoveredPlot(plotID);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y);

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(camera.zoom * zoomFactor, 5));

    const newWorldPos = {
      x: (x - camera.x) / newZoom,
      y: (y - camera.y) / newZoom,
    };

    setCamera({
      x: camera.x + (newWorldPos.x - worldPos.x) * newZoom,
      y: camera.y + (newWorldPos.y - worldPos.y) * newZoom,
      zoom: newZoom,
    });
  };

  const paintPlot = (plotID: string) => {
    if (!map || !selectedTerrain) return;

    const plot = map.plots.find((p) => p.plotID === plotID);
    if (!plot) return;

    const oldTerrain = plot.plotAttributes.terrainType;
    if (oldTerrain === selectedTerrain) return;

    const newPlots = map.plots.map((p) =>
      p.plotID === plotID
        ? {
            ...p,
            plotAttributes: {
              ...p.plotAttributes,
              terrainType: selectedTerrain,
            },
          }
        : p
    );

    const edit: Edit = {
      type: 'terrain',
      plots: [{ plotID, oldTerrain, newTerrain: selectedTerrain }],
    };

    onUpdateMap({ ...map, plots: newPlots });
    onUpdateHistory({
      undoStack: [...editHistory.undoStack, edit],
      redoStack: [],
    });
  };

  const render = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !map) return;

    ctx.fillStyle = '#0f1419';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    map.plots.forEach((plot) => {
      const isSelected = selectedPlots.has(plot.plotID);
      const isHovered = plot.plotID === hoveredPlot;

      ctx.beginPath();
      const firstVertex = worldToScreen(plot.vertices[0].x, plot.vertices[0].y);
      ctx.moveTo(firstVertex.x, firstVertex.y);

      for (let i = 1; i < plot.vertices.length; i++) {
        const vertex = worldToScreen(plot.vertices[i].x, plot.vertices[i].y);
        ctx.lineTo(vertex.x, vertex.y);
      }
      ctx.closePath();

      const terrain = map.terrainTypes.find(t => t.terrainTypeID === plot.plotAttributes.terrainType);
      ctx.fillStyle = terrain?.color || "#888888";
      if (isSelected) {
        ctx.globalAlpha = 0.8;
      }
      ctx.fill();
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = isSelected
        ? '#e94560'
        : isHovered
        ? '#fff'
        : '#1a1a2e';
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.stroke();
    });
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // WASD keyboard controls for smooth panning
  useEffect(() => {
    const keysPressedRef = { current: new Set<string>() };
    let animationFrameId: number | null = null;
    const panSpeed = 5; // Speed per frame
    const keysPressed = keysPressedRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        keysPressed.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.key.toLowerCase());
    };

    const animate = () => {
      if (keysPressed.size > 0) {
        let dx = 0;
        let dy = 0;

        if (keysPressed.has('w')) dy += panSpeed;
        if (keysPressed.has('s')) dy -= panSpeed;
        if (keysPressed.has('a')) dx += panSpeed;
        if (keysPressed.has('d')) dx -= panSpeed;

        if (dx !== 0 || dy !== 0) {
          setCamera((prev) => ({
            ...prev,
            x: prev.x + dx,
            y: prev.y + dy,
          }));
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const getHoverInfo = (): string => {
    if (!hoveredPlot || !map) return '';
    const plot = map.plots.find((p) => p.plotID === hoveredPlot);
    if (!plot) return '';
    const terrain = map.terrainTypes.find(
      (t) => t.terrainTypeID === plot.plotAttributes.terrainType
    );
    return `${terrain?.name || 'Unknown'} (${plot.plotID})`;
  };

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className={styles.overlay}>
        <div>
          <strong>Current Tool:</strong> {currentTool}
        </div>
        {hoveredPlot && <div>{getHoverInfo()}</div>}
      </div>
    </div>
  );
};

export default MapCanvas;
