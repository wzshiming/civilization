# Civilization - Stone Age Strategy Game

A minimalist browser-based overhead historical strategy game where you manage and evolve a Stone Age tribe on a static map.

![Game Screenshot](https://github.com/user-attachments/assets/b914dd5b-62f9-441e-9c4a-c4fd469a3d1e)

## 🎮 Game Overview

Inspired by [Paradox Development Studio](https://en.wikipedia.org/wiki/Paradox_Development_Studio) games, this prototype implements core strategic gameplay mechanics in a simple, accessible web interface.

### Core Features

- **Map-based Strategy**: Manage territories on a GeoJSON-based map with distinct provinces
- **Resource Management**: Balance population, food, and flint resources
- **Territory Expansion**: Explore and claim adjacent provinces by spending resources
- **Automated Economy**: Controlled provinces automatically generate food every 5 seconds

## 🛠️ Technology Stack

- **UI Framework**: [React](https://github.com/facebook/react) - Component-based UI library
- **Map Rendering**: [Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js) - Interactive map visualization
- **Map Data**: GeoJSON format for province definitions
- **Language**: TypeScript for type-safe development
- **Build Tool**: Vite for fast development and optimized builds

## 📁 Project Structure

```
civilization/
├── index.html              # Application entry point
├── public/
│   └── map.json           # GeoJSON data defining map provinces
├── src/
│   ├── main.tsx           # React application bootstrap
│   ├── App.tsx            # Main application component
│   ├── game.ts            # Core game logic and mechanics
│   ├── types.ts           # TypeScript type definitions
│   ├── MapView.tsx        # Map rendering component
│   └── UIPanel.tsx        # Resource display and information panel
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite build configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager

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

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎯 How to Play

1. **Starting Position**: The game begins with your tribe controlling a random land province with initial resources:
   - 5 Population
   - 20 Food
   - 10 Flint

2. **Province Interaction**:
   - **Hover** over provinces to highlight them
   - **Click** on a province to select it and view its details

3. **Territory Expansion**:
   - Select one of your controlled provinces
   - Click on an adjacent empty land province to explore it
   - Exploration costs: 10 Food + 1 Population
   - Successfully explored provinces become part of your territory

4. **Resource Generation**:
   - All controlled provinces automatically generate 2 Food every 5 seconds
   - Resources are pooled across your entire civilization

## 🗺️ Map System

### Province Types
- **Land Provinces**: Can be explored and controlled by tribes
- **Water Provinces**: Serve as natural barriers (cannot be controlled)

### Map Data Format
Provinces are defined in `public/map.json` using GeoJSON format:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "province_1",
        "name": "Northern Plains",
        "type": "land"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[...]]
      }
    }
  ]
}
```

## 🎨 Visual Design

- **Uncontrolled Land**: Light gray (#f0f0f0)
- **Controlled Territory**: Green (#4CAF50)
- **Water**: Blue (#3498db)
- **Hover Highlight**: Yellow border
- **Province Borders**: Dark borders for clear delineation

## 📊 Game Mechanics

### Constants (defined in `src/game.ts`)

```typescript
RESOURCE_GENERATION_INTERVAL = 5000ms  // 5 seconds
FOOD_PER_TICK = 2
EXPLORATION_FOOD_COST = 10
EXPLORATION_POPULATION_COST = 1
STARTING_POPULATION = 5
STARTING_FOOD = 20
STARTING_FLINT = 10
```

### Exploration Requirements

To explore a new province, the following conditions must be met:
1. You must control the source province
2. The target province must be adjacent (share a border)
3. The target province must be uncontrolled land
4. You must have at least 10 food
5. You must have at least 1 population

## 🔮 Future Enhancements

Potential features for future development:
- Multiple tribes with AI opponents
- Combat system between tribes
- Building construction (villages, mines, farms)
- Technology/research tree
- Diplomatic relations
- Trade routes between provinces
- Character units (leaders, scouts, warriors)
- More resource types and complexity
- Save/load game functionality
- Multiplayer support

## 🐛 Known Issues

- Mapbox GL JS requires an API token for full functionality. The current implementation works for local development but shows console warnings
- Large map files may impact initial load time
- No persistence - game state is lost on page refresh

## 🔧 Troubleshooting

### Map not visible

If you don't see the map rendering:

1. **Check WebGL support**: Mapbox GL JS requires WebGL. Verify your browser supports WebGL at https://get.webgl.org/
2. **Disable ad blockers**: Some ad blockers may interfere with Mapbox CSS loading
3. **Try a different browser**: Use Chrome, Firefox, Safari, or Edge (latest versions)
4. **Check console**: Open browser DevTools (F12) and look for specific error messages
5. **Clear cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R) to clear cached resources

The map area should show:
- Light gray background (#e8e8e8)
- Colored provinces (green for controlled, blue for water, gray for uncontrolled)
- Province borders in dark color
- Smooth animations when selecting provinces

If issues persist, the game logic still works - you can interact with provinces through the UI panel even if the visual map doesn't render.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Contact

For questions or feedback, please open an issue on GitHub.