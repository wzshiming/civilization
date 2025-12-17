/**
 * SSE Broadcaster - Sends simulation state updates via Server-Sent Events
 */

import type { Response } from 'express';
import type { SerializableWorldMap, StateDelta, ParcelDelta, ViewportBounds, Parcel } from '@civilization/shared';
import { StateManager } from '../state/StateManager';

interface ClientInfo {
  response: Response;
  viewport: ViewportBounds | null;
}

export class SSEBroadcaster {
  private clients: Map<Response, ClientInfo> = new Map();
  private stateManager: StateManager;
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Add a new SSE client
   */
  addClient(res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create client info with no viewport initially
    const clientInfo: ClientInfo = {
      response: res,
      viewport: null,
    };

    this.clients.set(res, clientInfo);

    // Send initial full state (will be empty until viewport is reported)
    const worldMap = this.stateManager.getWorldMap();
    if (worldMap) {
      this.sendFullStateToClient(res, null);
    }

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(res);
      console.log(`SSE client disconnected. Active clients: ${this.clients.size}`);
    });

    console.log(`SSE client connected. Active clients: ${this.clients.size}`);
  }

  /**
   * Update viewport for a specific client
   */
  updateClientViewport(res: Response, viewport: ViewportBounds): void {
    const clientInfo = this.clients.get(res);
    if (clientInfo) {
      clientInfo.viewport = viewport;
      console.log(`Updated viewport for client: ${JSON.stringify(viewport)}`);
      
      // Send full state for new viewport
      this.sendFullStateToClient(res, viewport);
    }
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
   * Send full state to a specific client
   */
  private sendFullStateToClient(res: Response, viewport: ViewportBounds | null): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    let parcelsToSend: Parcel[];

    if (viewport) {
      // Filter parcels based on viewport
      parcelsToSend = [];
      for (const parcel of worldMap.parcels.values()) {
        if (this.isParcelVisible(parcel, viewport, worldMap)) {
          parcelsToSend.push(parcel);
        }
      }
      console.log(`Sending ${parcelsToSend.length} visible parcels out of ${worldMap.parcels.size} total`);
    } else {
      // No viewport yet, send empty state
      parcelsToSend = [];
    }

    const serializable: SerializableWorldMap = {
      parcels: parcelsToSend,
      width: worldMap.width,
      height: worldMap.height,
    };

    this.sendMessage(res, 'full-state', serializable);
  }

  /**
   * Check if a parcel is visible within the given viewport considering toroidal wrapping
   */
  private isParcelVisible(parcel: Parcel, viewport: ViewportBounds, worldMap: { width: number; height: number }): boolean {
    // Check parcel visibility with toroidal wrapping
    // The map wraps around, so we need to check all possible positions
    const { minX, maxX, minY, maxY } = viewport;
    const { width, height } = worldMap;

    // Check if parcel center is visible (considering wrapping)
    const centerX = parcel.center.x;
    const centerY = parcel.center.y;

    // Check all possible wrapped positions of the parcel
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const wrappedX = centerX + dx * width;
        const wrappedY = centerY + dy * height;

        if (wrappedX >= minX && wrappedX <= maxX && wrappedY >= minY && wrappedY <= maxY) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Broadcast delta updates to all clients
   */
  private broadcastDelta(): void {
    const deltas = this.stateManager.getDeltas();
    
    // Only send if there are changes
    if (deltas.length === 0) return;

    console.log(`Broadcasting delta with ${deltas.length} changed parcels`);
    const delta: StateDelta = {
      parcels: deltas,
    };

    this.broadcastMessage('delta', delta);
  }

  /**
   * Broadcast a message to all clients (with per-client filtering)
   */
  private broadcastMessage(type: string, message: StateDelta | SerializableWorldMap): void {
    this.clients.forEach((clientInfo) => {
      try {
        // For delta messages, filter by viewport if available
        if (type === 'delta' && clientInfo.viewport) {
          const delta = message as StateDelta;
          const worldMap = this.stateManager.getWorldMap();
          if (worldMap) {
            const filteredParcels: ParcelDelta[] = [];
            for (const parcelDelta of delta.parcels) {
              const parcel = worldMap.parcels.get(parcelDelta.id);
              if (parcel && this.isParcelVisible(parcel, clientInfo.viewport, worldMap)) {
                filteredParcels.push(parcelDelta);
              }
            }
            
            // Only send if there are visible changes
            if (filteredParcels.length > 0) {
              const filteredDelta: StateDelta = { parcels: filteredParcels };
              const data = `event: ${type}\ndata: ${JSON.stringify(filteredDelta)}\n\n`;
              clientInfo.response.write(data);
            }
          }
        } else {
          // For other message types, send as-is
          const data = `event: ${type}\ndata: ${JSON.stringify(message)}\n\n`;
          clientInfo.response.write(data);
        }
      } catch (error) {
        console.error('Error sending to client:', error);
        this.clients.delete(clientInfo.response);
      }
    });
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(res: Response, type: string, message: StateDelta | SerializableWorldMap): void {
    const data = `event: ${type}\ndata: ${JSON.stringify(message)}\n\n`;
    try {
      res.write(data);
    } catch (error) {
      console.error('Error sending message to client:', error);
    }
  }

  /**
   * Broadcast simulation results (changed parcels only) to all clients
   * This sends only the parcels that were modified during simulation and are visible to each client
   */
  broadcastSimulationResults(changedParcelIds: string[]): void {
    if (this.clients.size === 0 || changedParcelIds.length === 0) return;

    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    // Build delta with only the changed parcels
    const deltas: ParcelDelta[] = changedParcelIds.map(id => {
      const parcel = worldMap.parcels.get(id);
      if (!parcel) return null;
      
      return {
        id,
        resources: parcel.resources,
      };
    }).filter(delta => delta !== null) as ParcelDelta[];

    if (deltas.length === 0) return;

    const delta: StateDelta = {
      parcels: deltas,
    };

    // broadcastMessage will filter per-client based on viewport
    this.broadcastMessage('delta', delta);
  }
}
