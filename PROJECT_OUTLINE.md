# Project Outline and Task Decomposition

## Project Goal
Generate a minimalist web prototype of an "overhead historical strategy game" that runs in a browser, where players manage and evolve a Stone Age tribe on a static map, inspired by Paradox Development Studio games.

## Technology Stack

### Frontend
- **React 18.2**: Component-based UI library for building the user interface
- **TypeScript 5.3**: Type-safe JavaScript for better code quality and maintainability
- **Mapbox GL JS 3.0**: Advanced map rendering library for visualizing GeoJSON provinces
- **Vite 5.0**: Modern build tool for fast development and optimized production builds

### Data Format
- **GeoJSON**: Standard format for representing geographic features (provinces)

## Project Structure

```
civilization/
├── index.html              # HTML entry point with Mapbox CSS
├── public/
│   └── map.json           # GeoJSON data with 8 provinces (6 land, 2 water)
├── src/
│   ├── main.tsx           # React application entry point
│   ├── App.tsx            # Main game container, state management
│   ├── game.ts            # Core game logic and mechanics
│   ├── types.ts           # TypeScript interfaces and types
│   ├── MapView.tsx        # Mapbox GL map rendering component
│   └── UIPanel.tsx        # Resource display and UI panel
├── package.json           # Dependencies and build scripts
├── tsconfig.json          # TypeScript configuration
├── vite.config.ts         # Vite build configuration
└── .gitignore             # Git ignore rules
```

## Core Functional Modules

### 1. Map System (`src/MapView.tsx`)

#### Rendering
- Reads GeoJSON data from `public/map.json`
- Renders each polygon as a distinct "province" on the map
- Different colors for different province states:
  - **Uncontrolled land**: Light gray (#f0f0f0)
  - **Controlled territory**: Green (#4CAF50)
  - **Water**: Blue (#3498db)
- Displays province borders for clear delineation
- Supports building and character units on the map (infrastructure in place)

#### Interaction
- **Hover**: Provinces are highlighted with a yellow border when the mouse hovers over them
- **Click**: 
  - Outputs province ID and information to the browser console
  - Selects the province for display in the UI panel
  - If clicking an adjacent empty province from a controlled province, triggers exploration

### 2. Province System (`src/types.ts`, `src/game.ts`)

#### Data Model
Each province has:
- **id**: Unique identifier (e.g., "province_1")
- **name**: Human-readable name (e.g., "Northern Plains")
- **type**: Either "land" or "water"
- **owner**: Tribe ID or null if uncontrolled
- **population**: Number of people in the province
- **food**: Food resources available
- **flint**: Flint resources available

#### Initialization
- At game start, a random land province is selected
- The initial tribe is placed on this province, marked by ownership
- Province ownership is visually indicated by color change (green)
- Starting resources:
  - Population: 5
  - Food: 20
  - Flint: 10

#### Status Display (`src/UIPanel.tsx`)
- Side panel on the right of the screen
- Displays total resources across all controlled provinces:
  - 👥 Population
  - 🌾 Food
  - ⛏️ Flint
- Shows selected province information:
  - Province name and ID
  - Control status
  - Local resources if controlled

### 3. Basic Interaction Logic (`src/game.ts`)

#### Exploration Mechanic
- **Trigger**: Click on an adjacent empty land province while having a controlled province selected
- **Cost**: 
  - 10 Food (EXPLORATION_FOOD_COST)
  - 1 Population (EXPLORATION_POPULATION_COST)
- **Requirements**:
  - Source province must be controlled by the player
  - Target province must be adjacent (share a border)
  - Target province must be uncontrolled land (not water)
  - Player must have sufficient resources
- **Effect**:
  - Resources are consumed from the source province
  - Target province is brought under control (color changes to green)
  - 1 population is moved to the new province
  - Console message confirms successful exploration

#### Resource Generation
- **Interval**: Every 5 seconds (RESOURCE_GENERATION_INTERVAL = 5000ms)
- **Effect**: All controlled provinces automatically generate 2 food (FOOD_PER_TICK)
- **Console Logging**: Each generation event is logged for debugging

#### Adjacency Detection
- Provinces are considered adjacent if they share at least 2 coordinate points
- This forms a graph of neighboring provinces
- Players can only explore to adjacent provinces

## Task Decomposition

### Phase 1: Project Setup ✅
1. Initialize project structure
2. Configure TypeScript and build tools (Vite)
3. Install dependencies (React, Mapbox GL JS)
4. Create basic HTML entry point
5. Set up Git ignore rules

### Phase 2: Data Layer ✅
1. Design GeoJSON province format
2. Create `map.json` with sample provinces (8 total: 6 land, 2 water)
3. Define TypeScript interfaces for game entities
4. Create type-safe interfaces for GeoJSON data

### Phase 3: Map Rendering ✅
1. Implement MapView component with Mapbox GL
2. Load and parse GeoJSON data
3. Render provinces as colored polygons
4. Add province borders
5. Implement hover highlighting
6. Handle click events

### Phase 4: Game State ✅
1. Implement game state management in App component
2. Create initialization logic
3. Select random starting province
4. Assign initial tribe with starting resources
5. Update map colors based on ownership

### Phase 5: UI Components ✅
1. Create UIPanel component
2. Display total resources with icons
3. Show selected province details
4. Add gameplay instructions
5. Style for clean, readable interface

### Phase 6: Game Mechanics ✅
1. Implement province adjacency detection
2. Create exploration validation logic
3. Implement resource consumption
4. Add province conquest functionality
5. Set up resource generation timer
6. Add console logging for game events

### Phase 7: Testing & Refinement ✅
1. Test map rendering and interaction
2. Verify resource generation works correctly
3. Test exploration mechanic
4. Ensure proper state updates
5. Fix TypeScript type safety issues
6. Address code review feedback
7. Run security scans (CodeQL)

### Phase 8: Documentation ✅
1. Write comprehensive README
2. Document technology stack
3. Create getting started guide
4. Explain game mechanics
5. Add screenshots
6. Document future enhancement ideas

## Game Constants

Defined in `src/game.ts`:

```typescript
RESOURCE_GENERATION_INTERVAL = 5000  // 5 seconds in milliseconds
FOOD_PER_TICK = 2                    // Food generated per province per tick
EXPLORATION_FOOD_COST = 10           // Food cost to explore new province
EXPLORATION_POPULATION_COST = 1      // Population sent to new province
STARTING_POPULATION = 5              // Initial tribe population
STARTING_FOOD = 20                   // Initial food reserves
STARTING_FLINT = 10                  // Initial flint reserves
```

## Key Features Implemented

### ✅ Completed Core Features
1. **Map Rendering**: GeoJSON-based interactive map with Mapbox GL JS
2. **Province System**: 8 provinces (6 land, 2 water) with full data model
3. **Tribe Management**: Initial tribe spawns on random land province
4. **Resource System**: Three resource types (population, food, flint)
5. **Territory Expansion**: Click-to-explore mechanic with resource costs
6. **Automated Economy**: Passive food generation every 5 seconds
7. **Interactive UI**: Side panel with real-time resource display
8. **Visual Feedback**: Color-coded provinces and hover highlighting
9. **Console Logging**: Debug information for province interactions

### 🎨 Visual Design
- Clean, minimalist interface
- Intuitive color scheme (green = controlled, blue = water, gray = neutral)
- Emoji icons for resources (👥 🌾 ⛏️)
- Responsive hover effects
- Clear province borders

### 🔧 Technical Quality
- Full TypeScript type safety
- Proper GeoJSON interfaces
- React hooks for state management
- Efficient rendering with Mapbox GL
- Clean component separation
- No security vulnerabilities (CodeQL verified)
- Proper error handling

## Future Enhancement Opportunities

### Gameplay
- Multiple AI-controlled tribes
- Combat system between tribes
- Diplomacy and alliances
- Trade routes
- Technology/research tree
- Multiple resource types
- Building construction
- Character units (leaders, scouts, warriors)

### Technical
- Save/load game state (localStorage or backend)
- Multiplayer support (WebSocket)
- Larger, more complex maps
- Performance optimization for large maps
- Custom map editor
- Sound effects and music
- Animations for actions
- Mobile-responsive design

### UI/UX
- Mini-map for navigation
- Notifications for events
- Tutorial system
- Victory conditions
- Statistics and analytics
- Achievements

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Success Metrics

✅ Project builds without errors  
✅ Game runs in browser  
✅ All core mechanics functional  
✅ No security vulnerabilities  
✅ Proper TypeScript types  
✅ Clean, maintainable code  
✅ Comprehensive documentation  

## Conclusion

This project successfully delivers a minimal viable prototype of an overhead historical strategy game. The architecture is solid, extensible, and ready for future enhancements. The core gameplay loop (explore → control → generate resources → expand) is fully functional and provides an engaging foundation for a more complex strategy game.
