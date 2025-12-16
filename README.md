# civilization

A minimalist overhead historical strategy game running in the browser. Manage and evolve a Stone Age tribe on a map with different provinces and terrains.

## Features

- **Pure HTML5 Canvas** - No external game frameworks
- **GeoJSON Map Data** - Provinces defined in standard GeoJSON format
- **Tribe Management** - Control population, food, and technology
- **Civilization Progression** - Advance from Stone Age to Bronze Age
- **Interactive Gameplay** - Click provinces, gather resources, research technologies

## Getting Started

### Prerequisites

- Node.js and npm (for building TypeScript)
- A modern web browser

### Installation & Building

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build
```

### Running the Game

Simply open `index.html` in your web browser, or serve it with a local HTTP server:

```bash
# Using Python
python3 -m http.server 8080

# Or using Node.js http-server
npx http-server
```

Then navigate to `http://localhost:8080/index.html`

## How to Play

- **Click provinces** on the map to select and view their details
- **Gather Food** - Collect resources from your current province
- **Research Tech** - Discover new technologies (requires 30+ population)
- **Manage Resources** - Keep your population fed to grow
- **Goal** - Grow your tribe and advance through ages

## Project Structure

```
civilization/
├── index.html      # Main HTML file with Canvas element
├── game.ts         # TypeScript game logic
├── map.json        # GeoJSON province data
├── dist/           # Compiled JavaScript (generated)
├── package.json    # Node.js dependencies
└── tsconfig.json   # TypeScript configuration
```

## Technologies

- **HTML5 Canvas** for rendering
- **TypeScript** for type-safe game logic
- **GeoJSON** for map province data
- **Pure JavaScript** - No external dependencies

## License

See LICENSE file for details.