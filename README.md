# Civilization

This is an experimental game project of vibe coding

It aims to integrate several of my favorite strategy simulation games

- [Crusader Kings Series](https://en.wikipedia.org/wiki/Crusader_Kings_III)
- [Victoria Series](https://en.wikipedia.org/wiki/Victoria_3)
- [Stellaris](https://en.wikipedia.org/wiki/Stellaris_(video_game))
- [Civilization Series](https://en.wikipedia.org/wiki/Civilization_V)

This will be a web-based multiplayer strategy simulation game.

You will play as a person (and their heirs), evolving from early human civilization to the space age.

## Features

### Map Editor (React Web UI)
Modern React-based interactive map editor with visual editing tools:
- **Modern Stack**: Built with React 18, TypeScript, and Vite
- **Canvas Rendering**: High-performance HTML5 Canvas visualization
- **Interactive Tools**: Select and paint tools for terrain editing
- **Full History**: Undo/redo support for all edits
- **Real-time Stats**: Live map statistics and validation
- **File Operations**: Load/save maps as JSON
- **Responsive Design**: Works on desktop and tablet screens

**Quick Start:**
```bash
npm install
npm run editor
```
Then open http://localhost:3000 in your browser.

See [editor/README.md](editor/README.md) for detailed editor documentation.

### Map Generation (CLI)
Procedural map generation using Voronoi tessellation:
```bash
npm run generate-map -- --plots=500 --seed=42 --ocean=0.65
```
