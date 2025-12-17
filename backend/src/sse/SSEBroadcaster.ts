/**
 * SSE Broadcaster - Sends simulation state updates via Server-Sent Events
 */

import type { Response } from 'express';
import type { SSEMessage, SerializableWorldMap, StateDelta, SSEEventType, ViewportBounds, Parcel } from '@civilization/shared';
import { StateManager } from '../state/StateManager';
import { randomUUID } from 'crypto';

interface ClientInfo {
  id: string;
  response: Response;
  viewport: ViewportBounds | null;
}

export class SSEBroadcaster {
  private clients: Map<string, ClientInfo> = new Map();
  private responseToClientId: Map<Response, string> = new Map();
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
  addClient(res: Response): string {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Generate unique client ID
    const clientId = randomUUID();

    // Send initial connection message with client ID
    this.sendMessage(res, {
      type: 'simulation-started',
      timestamp: Date.now(),
      data: { message: 'Connected to simulation stream', clientId },
    });

    // Create client info with no viewport initially
    const clientInfo: ClientInfo = {
      id: clientId,
      response: res,
      viewport: null,
    };

    // Send initial full state
    const worldMap = this.stateManager.getWorldMap();
    if (worldMap) {
      this.sendFullStateToClient(clientInfo);
    }

    this.clients.set(clientId, clientInfo);
    this.responseToClientId.set(res, clientId);

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
      this.responseToClientId.delete(res);
      console.log(`SSE client disconnected. Active clients: ${this.clients.size}`);
    });

    console.log(`SSE client connected (${clientId}). Active clients: ${this.clients.size}`);
    return clientId;
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
   * Broadcast full state to all clients
   */
  private broadcastFullState(): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    this.clients.forEach((clientInfo) => {
      this.sendFullStateToClient(clientInfo);
    });
  }

  /**
   * Send full state to a specific client
   */
  private sendFullStateToClient(clientInfo: ClientInfo): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    // Filter parcels based on client's viewport
    const visibleParcels = this.filterVisibleParcels(
      Array.from(worldMap.parcels.values()),
      clientInfo.viewport,
      worldMap
    );

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
  }

  /**
   * Broadcast delta updates to all clients
   */
  private broadcastDelta(): void {
    const deltas = this.stateManager.getDeltas();
    
    // Only send if there are changes
    if (deltas.length === 0) return;

    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    // Send filtered deltas to each client based on their viewport
    this.clients.forEach((clientInfo) => {
      // Filter deltas to only include parcels in client's viewport
      const visibleDeltas = this.filterVisibleDeltas(deltas, clientInfo.viewport, worldMap);
      
      if (visibleDeltas.length === 0) return;

      const delta: StateDelta = {
        parcels: visibleDeltas,
        lastUpdate: worldMap.lastUpdate,
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
    
    this.clients.forEach((clientInfo) => {
      try {
        clientInfo.response.write(data);
      } catch (error) {
        console.error('Error sending to client:', error);
        this.clients.delete(clientInfo.response);
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
   * Update viewport for a specific client by client ID
   */
  updateViewport(clientId: string, viewport: ViewportBounds): boolean {
    const clientInfo = this.clients.get(clientId);
    if (clientInfo) {
      clientInfo.viewport = viewport;
      // Send updated full state with new viewport
      this.sendFullStateToClient(clientInfo);
      return true;
    }
    return false;
  }

  /**
   * Filter parcels based on viewport bounds
   */
  private filterVisibleParcels(
    parcels: Parcel[],
    viewport: ViewportBounds | null,
    worldMap: { width: number; height: number }
  ): Parcel[] {
    // If no viewport is set, return all parcels
    if (!viewport) return parcels;

    // Filter parcels that are visible in the viewport
    // Account for toroidal wrapping - a parcel may be visible in multiple positions
    return parcels.filter((parcel) => {
      return this.isParcelVisible(parcel, viewport, worldMap);
    });
  }

  /**
   * Filter deltas based on viewport bounds
   */
  private filterVisibleDeltas(
    deltas: Array<{ id: number; resources?: unknown[] }>,
    viewport: ViewportBounds | null,
    worldMap: { parcels: Map<number, Parcel>; width: number; height: number }
  ): Array<{ id: number; resources?: unknown[] }> {
    // If no viewport is set, return all deltas
    if (!viewport) return deltas;

    // Filter deltas for parcels that are visible in the viewport
    return deltas.filter((delta) => {
      const parcel = worldMap.parcels.get(delta.id);
      if (!parcel) return false;
      return this.isParcelVisible(parcel, viewport, worldMap);
    });
  }

  /**
   * Check if a parcel is visible in the viewport
   * Takes into account toroidal wrapping
   */
  private isParcelVisible(
    parcel: Parcel,
    viewport: ViewportBounds,
    worldMap: { width: number; height: number }
  ): boolean {
    const { minX, maxX, minY, maxY } = viewport;
    const { width: mapWidth, height: mapHeight } = worldMap;

    // Check parcel center against viewport with wrapping
    const checkPosition = (cx: number, cy: number): boolean => {
      return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
    };

    // Check parcel in its original position
    if (checkPosition(parcel.center.x, parcel.center.y)) {
      return true;
    }

    // Check wrapped positions (9 positions total for toroidal topology)
    const wrappedPositions = [
      { x: parcel.center.x - mapWidth, y: parcel.center.y },
      { x: parcel.center.x + mapWidth, y: parcel.center.y },
      { x: parcel.center.x, y: parcel.center.y - mapHeight },
      { x: parcel.center.x, y: parcel.center.y + mapHeight },
      { x: parcel.center.x - mapWidth, y: parcel.center.y - mapHeight },
      { x: parcel.center.x + mapWidth, y: parcel.center.y - mapHeight },
      { x: parcel.center.x - mapWidth, y: parcel.center.y + mapHeight },
      { x: parcel.center.x + mapWidth, y: parcel.center.y + mapHeight },
    ];

    return wrappedPositions.some((pos) => checkPosition(pos.x, pos.y));
  }
}
