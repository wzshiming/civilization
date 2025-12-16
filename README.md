# Civilization - Interactive Territory Map

An interactive map strategy game built with React, TypeScript, and Leaflet, featuring GeoJSON-based territories with detailed information panels.

## Features

- 📍 **Interactive GeoJSON Map**: Custom territories rendered from GeoJSON data format
- 🎯 **Click Interaction**: Click on any territory to view detailed information
- 👆 **Hover Tooltips**: Quick information display when hovering over territories
- 🔒 **Zoom & Drag Control**: Lock/unlock button to control map zoom and drag functionality
- 🎨 **Visual Feedback**: Territories highlight on hover and selection with border color changes
- 📊 **Detailed Information Panel**: Side panel showing:
  - Territory name and ownership
  - Population statistics
  - Available resources
  - Detailed descriptions
  - Territory ID

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wzshiming/civilization.git
cd civilization
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Map Data Format

The map data is stored in `public/map.json` in GeoJSON format. Each territory feature includes:

- **Geometry**: Polygon coordinates defining the territory boundaries
- **Properties**:
  - `name`: Territory name
  - `owner`: Faction or kingdom that owns the territory
  - `population`: Number of inhabitants
  - `resources`: Array of available resources
  - `description`: Detailed description of the territory
  - `color`: Display color for the territory on the map

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Leaflet** - Interactive map library
- **React-Leaflet** - React components for Leaflet
- **GeoJSON** - Geographic data format

## Project Structure

```
civilization/
├── public/
│   └── map.json              # GeoJSON map data
├── src/
│   ├── components/
│   │   ├── InteractiveMap.tsx    # Main map component
│   │   └── InteractiveMap.css    # Map component styles
│   ├── App.tsx               # Main application component
│   ├── App.css              # Application styles
│   └── main.tsx             # Application entry point
├── package.json
└── vite.config.ts
```

## License

MIT License - see LICENSE file for details
