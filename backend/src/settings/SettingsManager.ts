/**
 * Settings Manager - Manages simulation settings
 */

import type { SimulationSettings } from '@civilization/shared';

export class SettingsManager {
  private settings: SimulationSettings;

  constructor(defaultSettings?: Partial<SimulationSettings>) {
    this.settings = {
      id: defaultSettings?.id || 'default',
      name: defaultSettings?.name || 'Default Simulation',
      speed: defaultSettings?.speed || 1.0,
      mapFile: defaultSettings?.mapFile || 'default-map.json',
      active: defaultSettings?.active !== undefined ? defaultSettings.active : true,
    };
  }

  /**
   * Get current settings
   */
  getSettings(): SimulationSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<SimulationSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
  }

  /**
   * Get simulation speed
   */
  getSpeed(): number {
    return this.settings.speed;
  }

  /**
   * Set simulation speed
   */
  setSpeed(speed: number): void {
    if (speed < 0.1 || speed > 10) {
      throw new Error('Speed must be between 0.1 and 10');
    }
    this.settings.speed = speed;
  }

  /**
   * Get current map file
   */
  getMapFile(): string {
    return this.settings.mapFile;
  }

  /**
   * Set map file
   */
  setMapFile(mapFile: string): void {
    this.settings.mapFile = mapFile;
  }

  /**
   * Check if simulation is active
   */
  isActive(): boolean {
    return this.settings.active;
  }

  /**
   * Set active state
   */
  setActive(active: boolean): void {
    this.settings.active = active;
  }

  /**
   * Get simulation ID
   */
  getId(): string {
    return this.settings.id;
  }

  /**
   * Get simulation name
   */
  getName(): string {
    return this.settings.name;
  }
}
