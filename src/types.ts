// Core game types

export interface Province {
  id: string;
  name: string;
  type: 'land' | 'water';
  owner: string | null; // tribe ID or null if unowned
  population: number;
  food: number;
  flint: number;
}

export interface Tribe {
  id: string;
  name: string;
  color: string;
}

export interface GameState {
  provinces: Map<string, Province>;
  tribes: Tribe[];
  selectedProvinceId: string | null;
  hoveredProvinceId: string | null;
}
