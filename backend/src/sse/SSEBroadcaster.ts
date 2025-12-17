/**
 * SSE Broadcaster - Sends simulation state updates via Server-Sent Events
 */

import type { Response } from 'express';
import type { SSEMessage, SerializableWorldMap, StateDelta, SSEEventType, ViewportBounds, Parcel } from '@civilization/shared';
import { StateManager } from '../state/StateManager';

interface ClientInfo {
  response: Response;
  viewport: ViewportBounds | null;
  clientId: string;
}

export class SSEBroadcaster {
  private clients: Map<Response, ClientInfo> = new Map();
  private clientsById: Map<string, ClientInfo> = new Map();
  private stateManager: StateManager;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 1000; // 1 second between broadcasts
  private sendFullState: boolean = false; // Send deltas by default

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Add a new SSE client
   */
  addClient(res: Response, clientId: string): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message with client ID
    this.sendMessage(res, {
      type: 'simulation-started',
      timestamp: Date.now(),
      data: { message: 'Connected to simulation stream', clientId },
    });

    // Store client with no initial viewport
    const clientInfo: ClientInfo = {
      response: res,
      viewport: null,
      clientId,
    };
    this.clients.set(res, clientInfo);
    this.clientsById.set(clientId, clientInfo);

    // Send initial full state (will be filtered by viewport once set)
    const worldMap = this.stateManager.getWorldMap();
    if (worldMap) {
      this.sendFullStateToClient(res, null);
    }

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(res);
      this.clientsById.delete(clientId);
      console.log(`SSE client disconnected. Active clients: ${this.clients.size}`);
    });

    console.log(`SSE client connected. Active clients: ${this.clients.size}`);
  }

  /**
   * Start broadcasting updates
   */
  startBroadcasting(): void {
    if (this.broadcastInterval) {
      console.log('Broadcasting already started');
      return;
    }

    this.broadcastInterval = setInterval(() => {
      this.broadcast();
    }, this.updateFrequency);

    console.log(`Started broadcasting updates every ${this.updateFrequency}ms`);
  }

  /**
   * Stop broadcasting updates
   */
  stopBroadcasting(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    console.log('Stopped broadcasting updates');
  }

  /**
   * Broadcast to all connected clients
   */
  private broadcast(): void {
    if (this.clients.size === 0) return;

    if (this.sendFullState) {
      this.broadcastFullState();
    } else {
      this.broadcastDelta();
    }
  }

  /**
   * Broadcast full state to all clients (filtered by viewport)
   */
  private broadcastFullState(): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    const allParcels = Array.from(worldMap.parcels.values());

    this.clients.forEach((clientInfo) => {
      const visibleParcels = this.filterParcelsByViewport(allParcels, clientInfo.viewport);
      
      const serializable: SerializableWorldMap = {
        parcels: visibleParcels,
        boundaries: worldMap.boundaries,
        width: worldMap.width,
        height: worldMap.height,
        lastUpdate: worldMap.lastUpdate,
      };

      const message: SSEMessage = {
        type: 'full-state',
        timestamp: Date.now(),
        data: serializable,
      };

      this.sendMessage(clientInfo.response, message);
    });
  }

  /**
   * Send full state to a specific client (filtered by viewport)
   */
  private sendFullStateToClient(res: Response, viewport: ViewportBounds | null): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    const allParcels = Array.from(worldMap.parcels.values());
    const visibleParcels = this.filterParcelsByViewport(allParcels, viewport);

    const serializable: SerializableWorldMap = {
      parcels: visibleParcels,
      boundaries: worldMap.boundaries,
      width: worldMap.width,
      height: worldMap.height,
      lastUpdate: worldMap.lastUpdate,
    };

    const message: SSEMessage = {
      type: 'full-state',
      timestamp: Date.now(),
      data: serializable,
    };

    this.sendMessage(res, message);
  }

  /**
   * Broadcast delta updates to all clients (filtered by viewport)
   */
  private broadcastDelta(): void {
    const deltas = this.stateManager.getDeltas();
    
    // Only send if there are changes
    if (deltas.length === 0) return;

    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    this.clients.forEach((clientInfo) => {
      // Filter deltas to only include parcels in viewport
      const visibleDeltas = deltas.filter(delta => {
        const parcel = worldMap.parcels.get(delta.id);
        if (!parcel) return false;
        
        // If no viewport set, include all deltas
        if (!clientInfo.viewport) return true;
        
        // Check if parcel is visible (inline check to avoid array creation)
        return this.isParcelInViewport(parcel, clientInfo.viewport);
      });

      // Only send if there are visible changes
      if (visibleDeltas.length === 0) return;

      const delta: StateDelta = {
        parcels: visibleDeltas,
        lastUpdate: worldMap.lastUpdate || Date.now(),
      };

      const message: SSEMessage = {
        type: 'delta',
        timestamp: Date.now(),
        data: delta,
      };

      this.sendMessage(clientInfo.response, message);
    });
  }

  /**
   * Broadcast a message to all clients
   */
  private broadcastMessage(message: SSEMessage): void {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    
    this.clients.forEach((clientInfo, res) => {
      try {
        res.write(data);
      } catch (error) {
        console.error('Error sending to client:', error);
        this.clients.delete(res);
      }
    });
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(res: Response, message: SSEMessage): void {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    try {
      res.write(data);
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }

  /**
   * Set update frequency
   */
  setUpdateFrequency(frequency: number): void {
    this.updateFrequency = frequency;
    
    // Restart broadcasting with new frequency
    if (this.broadcastInterval) {
      this.stopBroadcasting();
      this.startBroadcasting();
    }
  }

  /**
   * Toggle between full state and delta updates
   */
  setSendFullState(sendFull: boolean): void {
    this.sendFullState = sendFull;
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Broadcast a custom event
   */
  broadcastEvent(type: SSEEventType, data: Record<string, unknown>): void {
    const message: SSEMessage = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.broadcastMessage(message);
  }

  /**
   * Update viewport for a client by client ID
   */
  updateClientViewportById(clientId: string, viewport: ViewportBounds): boolean {
    const clientInfo = this.clientsById.get(clientId);
    if (clientInfo) {
      clientInfo.viewport = viewport;
      
      // Send updated visible state to the client
      this.sendFullStateToClient(clientInfo.response, viewport);
      return true;
    }
    return false;
  }

  /**
   * Filter parcels by viewport bounds
   */
  private filterParcelsByViewport(parcels: Parcel[], viewport: ViewportBounds | null): Parcel[] {
    if (!viewport) {
      return parcels; // No viewport set, return all parcels
    }

    return parcels.filter(parcel => {
      // Check if parcel center or any vertex is within viewport
      const { center, vertices } = parcel;
      
      // Check center
      if (this.isPointInViewport(center, viewport)) {
        return true;
      }
      
      // Check vertices
      for (const vertex of vertices) {
        if (this.isPointInViewport(vertex, viewport)) {
          return true;
        }
      }
      
      // Check if viewport is inside parcel (for very large parcels)
      // Simple bounding box check
      const parcelMinX = Math.min(...vertices.map(v => v.x));
      const parcelMaxX = Math.max(...vertices.map(v => v.x));
      const parcelMinY = Math.min(...vertices.map(v => v.y));
      const parcelMaxY = Math.max(...vertices.map(v => v.y));
      
      return (
        parcelMinX <= viewport.maxX &&
        parcelMaxX >= viewport.minX &&
        parcelMinY <= viewport.maxY &&
        parcelMaxY >= viewport.minY
      );
    });
  }

  /**
   * Check if a point is within viewport bounds
   */
  private isPointInViewport(point: { x: number; y: number }, viewport: ViewportBounds): boolean {
    return (
      point.x >= viewport.minX &&
      point.x <= viewport.maxX &&
      point.y >= viewport.minY &&
      point.y <= viewport.maxY
    );
  }

  /**
   * Check if a single parcel is within viewport bounds (optimized for delta filtering)
   */
  private isParcelInViewport(parcel: Parcel, viewport: ViewportBounds): boolean {
    const { center, vertices } = parcel;
    
    // Check center
    if (this.isPointInViewport(center, viewport)) {
      return true;
    }
    
    // Check vertices
    for (const vertex of vertices) {
      if (this.isPointInViewport(vertex, viewport)) {
        return true;
      }
    }
    
    // Check if viewport is inside parcel (for very large parcels)
    const parcelMinX = Math.min(...vertices.map((v: { x: number }) => v.x));
    const parcelMaxX = Math.max(...vertices.map((v: { x: number }) => v.x));
    const parcelMinY = Math.min(...vertices.map((v: { y: number }) => v.y));
    const parcelMaxY = Math.max(...vertices.map((v: { y: number }) => v.y));
    
    return (
      parcelMinX <= viewport.maxX &&
      parcelMaxX >= viewport.minX &&
      parcelMinY <= viewport.maxY &&
      parcelMaxY >= viewport.minY
    );
  }
}
