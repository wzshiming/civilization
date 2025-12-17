/**
 * State Manager - Manages the current state of the simulation
 */

import type { WorldMap, Parcel, Resource, ParcelDelta } from '@civilization/shared'

export class StateManager {
  private worldMap: WorldMap | null = null
  private previousState: Map<number, Parcel> = new Map()

  /**
   * Load a world map into the state manager
   */
  loadMap(worldMap: WorldMap): void {
    this.worldMap = worldMap
    this.previousState = new Map(worldMap.parcels)
  }

  /**
   * Get the current world map
   */
  getWorldMap(): WorldMap | null {
    return this.worldMap
  }

  /**
   * Update a parcel in the state
   */
  updateParcel(parcel: Parcel): void {
    if (!this.worldMap) return
    this.worldMap.parcels.set(parcel.id, parcel)
  }

  /**
   * Get all parcels
   */
  getAllParcels(): Parcel[] {
    if (!this.worldMap) return []
    return Array.from(this.worldMap.parcels.values())
  }

  /**
   * Get a specific parcel by ID
   */
  getParcel(id: number): Parcel | undefined {
    return this.worldMap?.parcels.get(id)
  }

  /**
   * Update the last update timestamp
   */
  updateTimestamp(): void {
    if (this.worldMap) {
      this.worldMap.lastUpdate = Date.now()
    }
  }

  /**
   * Get deltas (changes) since last snapshot
   */
  getDeltas(): ParcelDelta[] {
    if (!this.worldMap) return []

    const deltas: ParcelDelta[] = []

    this.worldMap.parcels.forEach((currentParcel, id) => {
      const previousParcel = this.previousState.get(id)

      if (!previousParcel) {
        // New parcel (shouldn't happen in normal simulation)
        deltas.push({
          id,
          resources: currentParcel.resources,
        })
        return
      }

      // Check if resources have changed
      if (this.resourcesChanged(previousParcel.resources, currentParcel.resources)) {
        deltas.push({
          id,
          resources: currentParcel.resources,
        })
      }
    })

    // Update previous state snapshot
    this.previousState = new Map(this.worldMap.parcels)

    return deltas
  }

  /**
   * Check if resources have changed between two states
   */
  private resourcesChanged(prev: Resource[], current: Resource[]): boolean {
    if (prev.length !== current.length) return true

    for (let i = 0; i < prev.length; i++) {
      if (
        prev[i].current !== current[i].current ||
        prev[i].maximum !== current[i].maximum ||
        prev[i].changeRate !== current[i].changeRate
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Clear the current state
   */
  clear(): void {
    this.worldMap = null
    this.previousState.clear()
  }
}
