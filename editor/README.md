# Civilization Map Editor (React)

A modern, interactive React-based map editor for creating and editing Civilization game maps.

## Features

- **Modern React Architecture**: Built with React 18, TypeScript, and Vite for fast development
- **Component-Based Design**: Modular components for easy maintenance and extension
- **Interactive Canvas**: HTML5 Canvas with smooth pan/zoom controls
- **Selection Tools**: Multiple selection modes with visual feedback
- **Terrain Editing**: Paint tool for changing terrain types with undo/redo
- **Real-time Statistics**: Live map statistics and validation
- **File Operations**: Load and save maps as JSON files
- **Responsive Design**: Works on different screen sizes

## Tech Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **CSS Modules**: Scoped styling
- **HTML5 Canvas**: High-performance rendering

## Getting Started

### Installation

From the root of the civilization project:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run editor
```

This will start the editor at http://localhost:3000 and automatically open your browser.

### Build

Build the production version:

```bash
npm run editor:build
```

The built files will be in the `editor/dist` directory.

## Usage

### Controls

#### Mouse Controls
- **Left Click**: Select plot (Select Tool) or paint terrain (Paint Tool)
- **Shift + Left Click**: Add/remove plot from selection
- **Right Click + Drag** or **Ctrl + Drag**: Pan the view
- **Mouse Wheel**: Zoom in/out

#### Tools
- **Select Tool** (🎯): Click plots to select them for batch operations
- **Paint Tool** (🖌️): Click plots to paint with the selected terrain type

### Features

1. **File Operations**
   - Generate New Map: Creates a random map with various terrain types
   - Load Map: Import existing JSON map files
   - Save Map: Export current map as JSON

2. **Terrain Types**
   - Ocean: Deep ocean water
   - Coastal: Shallow coastal waters
   - Plains: Flat grasslands
   - Forest: Dense woodland
   - Hills: Rolling hills
   - Mountains: Tall mountain ranges

3. **Selection**
   - Select individual plots by clicking
   - Multi-select with Shift+click
   - Select All: Select all plots on the map
   - Clear Selection: Deselect all plots

4. **History**
   - Undo: Revert the last terrain change
   - Redo: Reapply an undone change
   - Edit counter: Track number of edits made

5. **Statistics**
   - Real-time terrain distribution
   - Selected plot count
   - Total plot count

## Project Structure

```
editor/
├── src/
│   ├── components/       # React components
│   │   ├── Sidebar.tsx   # Left sidebar with tools and stats
│   │   ├── MapCanvas.tsx # Main canvas for map rendering
│   │   └── StatusBar.tsx # Bottom status bar
│   ├── utils/            # Utility functions
│   │   ├── colors.ts     # Terrain color mappings
│   │   ├── geometry.ts   # Geometric calculations
│   │   └── mapGenerator.ts # Map generation logic
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # All type definitions
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Development

### Adding New Features

1. **New Tool**: 
   - Add tool enum in `src/types/index.ts`
   - Implement tool logic in `MapCanvas.tsx`
   - Add button in `Sidebar.tsx`

2. **New Component**:
   - Create component in `src/components/`
   - Create corresponding CSS module
   - Import and use in parent component

3. **New Terrain Type**:
   - Add to `mapGenerator.ts`
   - Add color mapping in `colors.ts`

### Code Style

- Use TypeScript for type safety
- Use CSS Modules for component styling
- Follow React hooks best practices
- Keep components focused and reusable

## Future Enhancements

- [ ] Plot splitting and merging tools
- [ ] Region selection with lasso tool
- [ ] Terrain brush with variable size
- [ ] Map validation panel
- [ ] Export to different formats (GeoJSON, SVG, PNG)
- [ ] Minimap for navigation
- [ ] Keyboard shortcuts
- [ ] Attribute editing panel
- [ ] Building and species placement
- [ ] Multiplayer collaborative editing

## Performance

The editor is optimized for handling maps with 100+ plots smoothly:

- Canvas rendering is efficient with requestAnimationFrame
- Only visible plots are rendered when viewport culling is enabled
- Smooth pan and zoom with hardware acceleration
- Minimal re-renders with React hooks optimization

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires modern browser with ES2020 and Canvas support.
