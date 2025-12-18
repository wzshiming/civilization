import { GameMap, Plot, TerrainType, Point } from '../types';

export function generateMap(): GameMap {
  const terrainTypes: TerrainType[] = [
    {
      terrainTypeID: 'ocean',
      name: 'Ocean',
      description: 'Deep ocean water',
      processes: [],
    },
    {
      terrainTypeID: 'coastal',
      name: 'Coastal',
      description: 'Shallow coastal waters',
      processes: [],
    },
    {
      terrainTypeID: 'plains',
      name: 'Plains',
      description: 'Flat grasslands suitable for farming',
      processes: [],
    },
    {
      terrainTypeID: 'forest',
      name: 'Forest',
      description: 'Dense woodland',
      processes: [],
    },
    {
      terrainTypeID: 'hills',
      name: 'Hills',
      description: 'Rolling hills with varied terrain',
      processes: [],
    },
    {
      terrainTypeID: 'mountains',
      name: 'Mountains',
      description: 'Tall mountain ranges',
      processes: [],
    },
  ];

  const plots: Plot[] = [];
  const cols = 12;
  const rows = 8;
  const plotSize = 80;
  const variance = 15;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const centerX =
        x * plotSize + plotSize / 2 + (Math.random() - 0.5) * variance;
      const centerY =
        y * plotSize + plotSize / 2 + (Math.random() - 0.5) * variance;

      const vertices: Point[] = [];
      const sides = 6;
      const radius = plotSize / 2 - 5;
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const vx =
          centerX + Math.cos(angle) * radius * (1 + (Math.random() - 0.5) * 0.2);
        const vy =
          centerY + Math.sin(angle) * radius * (1 + (Math.random() - 0.5) * 0.2);
        vertices.push({ x: vx, y: vy });
      }

      let terrain: string;
      const rand = Math.random();
      if (rand < 0.3) terrain = 'ocean';
      else if (rand < 0.5) terrain = 'plains';
      else if (rand < 0.7) terrain = 'forest';
      else if (rand < 0.85) terrain = 'hills';
      else terrain = 'mountains';

      plots.push({
        plotID: `plot-${x}-${y}`,
        center: { x: centerX, y: centerY },
        vertices,
        plotAttributes: {
          terrainType: terrain,
          neighborPlots: [],
          storages: [],
          buildings: [],
          species: [],
          populations: [],
        },
        area: radius * radius * Math.PI,
        perimeter: radius * 6,
      });
    }
  }

  return {
    plots,
    terrainTypes,
    speciesTypes: [],
    resourceTypes: [],
    buildingTypes: [],
    skillTypes: [],
    religions: [],
    cultures: [],
  };
}
