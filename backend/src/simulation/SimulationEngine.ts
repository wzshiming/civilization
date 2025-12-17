/**
 * Simulation Engine - Runs the simulation loop and updates the state
 */

import type { WorldMap, Resource } from '@civilization/shared';
import { StateManager } from '../state/StateManager';
import type { SSEBroadcaster } from '../sse/SSEBroadcaster';

export class SimulationEngine {
  private stateManager: StateManager;
  private sseBroadcaster: SSEBroadcaster | null = null;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private speed: number = 1.0;
  private lastUpdateTime: number = Date.now();
  private tickInterval: number = 1000;
  constructor(stateManager: StateManager, sseBroadcaster?: SSEBroadcaster) {
    this.stateManager = stateManager;
    this.sseBroadcaster = sseBroadcaster || null;
  }

  /**
   * Start the simulation
   */
  start(): void {
    if (this.isRunning) {
      console.log('Simulation already running');
      return;
    }

    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) {
      console.error('Cannot start simulation: No map loaded');
      return;
    }

    this.isRunning = true;
    this.lastUpdateTime = Date.now();

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    console.log(`Simulation started at speed ${this.speed}x`);
  }

  /**
   * Stop the simulation
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Simulation not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('Simulation stopped');
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    if (speed < 0.1 || speed > 10) {
      console.error('Speed must be between 0.1 and 10');
      return;
    }
    this.speed = speed;
    console.log(`Simulation speed set to ${speed}x`);
  }

  /**
   * Get current simulation speed
   */
  getSpeed(): number {
    return this.speed;
  }

  /**
   * Check if simulation is running
   */
  isSimulationRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Run a single simulation tick
   */
  private tick(): void {
    const worldMap = this.stateManager.getWorldMap();
    if (!worldMap) return;

    const now = Date.now();
    const deltaTime = ((now - this.lastUpdateTime) / 1000) * this.speed;

    // Simulate and get the results (changed parcel IDs)
    const changedParcelIds = this.simulateWorld(worldMap, deltaTime);
    this.stateManager.updateTimestamp();

    // Broadcast only the simulation results (changed parcels) through SSE
    if (this.sseBroadcaster && changedParcelIds.length > 0) {
      this.sseBroadcaster.broadcastSimulationResults(changedParcelIds);
    }

    this.lastUpdateTime = now;
  }

  /**
   * Simulate world state for a given time step
   * Returns the IDs of parcels that were changed during simulation
   */
  private simulateWorld(world: WorldMap, deltaTime: number): number[] {
    const changedParcelIds: number[] = [];

    // Update resources for all parcels and track changes
    world.parcels.forEach((parcel, id) => {
      const hasChanges = this.updateResources(parcel.resources, deltaTime);
      if (hasChanges) {
        changedParcelIds.push(id);
      }
    });

    // Update boundary resources
    for (const boundary of world.boundaries) {
      this.updateResources(boundary.resources, deltaTime);
    }

    world.lastUpdate = Date.now();
    
    return changedParcelIds;
  }

  /**
   * Update resources with regeneration/depletion
   * Returns true if any resource was changed
   */
  private updateResources(resources: Resource[], deltaTime: number): boolean {
    let hasChanges = false;
    
    for (const resource of resources) {
      // Only process resources with non-zero change rates
      if (resource.changeRate !== 0) {
        const oldValue = resource.current;
        resource.current += resource.changeRate * deltaTime;
        resource.current = Math.max(0, Math.min(resource.maximum, resource.current));
        
        if (oldValue !== resource.current) {
          hasChanges = true;
        }
      }
    }
    
    return hasChanges;
  }
}
