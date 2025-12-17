/**
 * SSE Broadcaster - Sends simulation state updates via Server-Sent Events
 */

import type { Response } from 'express';
import type { SerializableWorldMap, StateDelta, ParcelDelta } from '@civilization/shared';
import { StateManager } from '../state/StateManager';

export class SSEBroadcaster {
  private clients: Set<Response> = new Set();
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

    // Send initial full state
    const worldMap = this.stateManager.getWorldMap();
    if (worldMap) {
      this.sendFullStateToClient(res);
    }

    this.clients.add(res);

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(res);
      console.log(`SSE client disconnected. Active clients: ${this.clients.size}`);
    });

    console.log(`SSE client connected. Active clients: ${this.clients.size}`);
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
  private sendFullStateToClient(res: Response): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    const serializable: SerializableWorldMap = {
      parcels: Array.from(worldMap.parcels.values()),
      width: worldMap.width,
      height: worldMap.height,
    };

    this.sendMessage(res, 'full-state', serializable);
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
   * Broadcast a message to all clients
   */
  private broadcastMessage(type: string, message: StateDelta | SerializableWorldMap): void {
    const data = `event: ${type}\ndata: ${JSON.stringify(message)}\n\n`;
    
    this.clients.forEach(client => {
      try {
        client.write(data);
      } catch (error) {
        console.error('Error sending to client:', error);
        this.clients.delete(client);
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
   * This sends only the parcels that were modified during simulation
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

    this.broadcastMessage('delta', delta);
  }
}
