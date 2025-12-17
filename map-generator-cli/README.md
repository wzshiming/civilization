# Civilization Map Generator CLI

Standalone command-line tool for generating maps offline for the Civilization simulation.

## Purpose

This tool generates procedural maps based on demand parameters. Maps are generated offline and then loaded by the backend server when the simulation starts or when needed.

## Features

- Generate maps with custom parameters (width, height, number of parcels)
- Reproducible map generation using seeds
- Saves maps in JSON format for backend consumption
- Detailed statistics about generated maps

## Installation

```bash
cd map-generator-cli
npm install
npm run build
```

## Usage

### Basic Usage

Generate a default map:

```bash
npm run dev
```

### Custom Parameters

```bash
npm run dev -- --width 1600 --height 1200 --parcels 800 --output my-map.json
```

### With Seed (Reproducible)

```bash
npm run dev -- --seed 12345 --output seeded-map.json
```

### Command-line Options

- `-w, --width <number>` - Map width (default: 1200)
- `-h, --height <number>` - Map height (default: 800)
- `-p, --parcels <number>` - Number of parcels (default: 500)
- `-s, --seed <number>` - Random seed for reproducibility
- `-o, --output <path>` - Output file name (default: default-map.json)
- `-d, --output-dir <path>` - Output directory (default: ./maps)

## Examples

### Small Map
```bash
npm run dev -- -w 800 -h 600 -p 300 -o small-map.json
```

### Large Map
```bash
npm run dev -- -w 2000 -h 1500 -p 1000 -o large-map.json
```

### Reproducible Map
```bash
npm run dev -- -s 42 -o reproducible-map.json
```

## Output

Generated maps are saved as JSON files in the specified output directory (default: `./maps`). These files can then be loaded by the backend server.

### Map File Structure

```json
{
  "parcels": [...],
  "boundaries": [...],
  "width": 1200,
  "height": 800,
  "lastUpdate": 1234567890
}
```

## Using Generated Maps

1. Generate a map using this tool
2. The map file will be saved in the `./maps` directory
3. Start the backend server
4. The backend will automatically load the default map
5. Or use the API to load a specific map: `POST /api/maps/load`

## Map Statistics

After generation, the tool displays:
- Total parcels and boundaries
- Terrain distribution (percentage of each terrain type)
- Resource statistics
- File size and location

## Notes

- Generating large maps (1000+ parcels) may take several seconds
- Maps are deterministic when using the same seed
- The output directory must be accessible by the backend server
