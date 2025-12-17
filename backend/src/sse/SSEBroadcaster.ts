/**
 * SSE Broadcaster - Sends simulation state updates via Server-Sent Events
 */

import type { Response } from 'express';
import type { SSEMessage, SerializableWorldMap, StateDelta } from '../types';
import { StateManager } from '../state/StateManager';

export class SSEBroadcaster {
  private clients: Set<Response> = new Set();
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
  addClient(res: Response): void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send initial connection message
    this.sendMessage(res, {
      type: 'simulation-started',
      timestamp: Date.now(),
      data: { message: 'Connected to simulation stream' },
    });

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

    const serializable: SerializableWorldMap = {
      parcels: Array.from(worldMap.parcels.values()),
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

    this.broadcastMessage(message);
  }

  /**
   * Send full state to a specific client
   */
  private sendFullStateToClient(res: Response): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    const serializable: SerializableWorldMap = {
      parcels: Array.from(worldMap.parcels.values()),
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
   * Broadcast delta updates to all clients
   */
  private broadcastDelta(): void {
    const deltas = this.stateManager.getDeltas();
    
    // Only send if there are changes
    if (deltas.length === 0) return;

    const worldMap = this.stateManager.getWorldMap();
    const delta: StateDelta = {
      parcels: deltas,
      lastUpdate: worldMap?.lastUpdate || Date.now(),
    };

    const message: SSEMessage = {
      type: 'delta',
      timestamp: Date.now(),
      data: delta,
    };

    this.broadcastMessage(message);
  }

  /**
   * Broadcast a message to all clients
   */
  private broadcastMessage(message: SSEMessage): void {
    const data = `data: ${JSON.stringify(message)}\n\n`;
    
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
  broadcastEvent(type: string, data: any): void {
    const message: SSEMessage = {
      type: type as any,
      timestamp: Date.now(),
      data,
    };

    this.broadcastMessage(message);
  }
}
