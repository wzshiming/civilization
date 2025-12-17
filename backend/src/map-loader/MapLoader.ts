/**
 * Map Loader - Loads pre-generated maps from files
 */

import fs from 'fs';
import path from 'path';
import type { WorldMap, SerializableWorldMap } from '@civilization/shared';

export class MapLoader {
  private mapsDirectory: string;

  constructor(mapsDirectory: string = './maps') {
    this.mapsDirectory = mapsDirectory;
    this.ensureMapsDirectory();
  }

  /**
   * Ensure the maps directory exists
   */
  private ensureMapsDirectory(): void {
    if (!fs.existsSync(this.mapsDirectory)) {
      fs.mkdirSync(this.mapsDirectory, { recursive: true });
    }
  }

  /**
   * Load a map from a file
   */
  loadMap(filename: string): WorldMap {
    const filePath = path.join(this.mapsDirectory, filename);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Map file not found: ${filename}`);
    }

    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const serializable: SerializableWorldMap = JSON.parse(data);
      
      // Convert serializable format to WorldMap with Map structure
      const worldMap: WorldMap = {
        parcels: new Map(serializable.parcels.map(p => [p.id, p])),
        boundaries: serializable.boundaries,
        width: serializable.width,
        height: serializable.height,
        lastUpdate: Date.now(),
      };

      return worldMap;
    } catch (error) {
      throw new Error(`Failed to load map from ${filename}: ${error}`);
    }
  }

  /**
   * Save a map to a file
   */
  saveMap(worldMap: WorldMap, filename: string): void {
    const filePath = path.join(this.mapsDirectory, filename);

    // Convert WorldMap to serializable format
    const serializable: SerializableWorldMap = {
      parcels: Array.from(worldMap.parcels.values()),
      boundaries: worldMap.boundaries,
      width: worldMap.width,
      height: worldMap.height,
      lastUpdate: worldMap.lastUpdate,
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save map to ${filename}: ${error}`);
    }
  }

  /**
   * List all available maps
   */
  listMaps(): string[] {
    try {
      const files = fs.readdirSync(this.mapsDirectory);
      return files.filter(file => file.endsWith('.json'));
    } catch (error) {
      console.error('Failed to list maps:', error);
      return [];
    }
  }

  /**
   * Delete a map file
   */
  deleteMap(filename: string): void {
    const filePath = path.join(this.mapsDirectory, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Map file not found: ${filename}`);
    }

    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      throw new Error(`Failed to delete map ${filename}: ${error}`);
    }
  }

  /**
   * Check if a map exists
   */
  mapExists(filename: string): boolean {
    const filePath = path.join(this.mapsDirectory, filename);
    return fs.existsSync(filePath);
  }
}
