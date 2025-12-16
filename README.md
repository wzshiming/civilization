# Civilization - Stone Age Strategy Game

A minimalist web-based overhead historical strategy game where you manage and evolve a Stone Age tribe on a static map.

## Features

- **Map System**: Canvas-based rendering with 9 unique provinces
- **Resource Management**: Track population, food, and flint across your empire
- **Province Exploration**: Expand your territory by exploring neighboring provinces
- **Automatic Resource Generation**: Resources grow every 5 seconds
- **Interactive UI**: Click provinces to view details and take actions

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm start
```

The game will open in your browser at `http://localhost:8080`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## How to Play

1. **Starting Out**: The game begins with a random tribe in one province
2. **View Resources**: Check the right panel for your total resources
3. **Select Provinces**: Click on any province to see its information
4. **Expand Territory**: Click on neighboring provinces and use the "Explore" button to expand (costs 5 population and 20 food)
5. **Grow Resources**: Wait for resources to automatically generate every 5 seconds

## Technology Stack

- **React 18**: UI components
- **TypeScript**: Type safety
- **Canvas 2D**: Map rendering
- **Webpack**: Build tooling
- **GeoJSON**: Map data format

## Project Structure

```
civilization/
├── src/
│   ├── game.ts       # Main game logic
│   ├── index.html    # HTML template
│   └── map.json      # GeoJSON province data
├── package.json      # Dependencies
├── tsconfig.json     # TypeScript configuration
└── webpack.config.js # Webpack configuration
```

## License

MIT