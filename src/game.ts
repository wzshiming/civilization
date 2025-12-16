import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import mapData from './map.json';

// Types
interface Resources {
  population: number;
  food: number;
  flint: number;
}

interface ResourceGrowth {
  food: number;
  flint: number;
}

interface ResourceLimit {
  population: number;
  food: number;
  flint: number;
}

interface ProvinceProperties {
  name: string;
  type: string;
  resources: Resources;
  resourceGrowth: ResourceGrowth;
  resourceLimit: ResourceLimit;
  controlled: boolean;
  neighbors: string[];
}

interface Province {
  type: string;
  id: string;
  properties: ProvinceProperties;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

interface MapData {
  type: string;
  features: Province[];
}

// Game State
class GameState {
  provinces: Map<string, Province>;
  selectedProvinceId: string | null;
  hoveredProvinceId: string | null;
  message: { text: string; type: 'success' | 'error' } | null;
  
  constructor() {
    this.provinces = new Map();
    this.selectedProvinceId = null;
    this.hoveredProvinceId = null;
    this.message = null;
  }

  getProvince(id: string): Province | undefined {
    return this.provinces.get(id);
  }

  getSelectedProvince(): Province | undefined {
    return this.selectedProvinceId ? this.provinces.get(this.selectedProvinceId) : undefined;
  }

  getTotalResources(): Resources {
    const total: Resources = { population: 0, food: 0, flint: 0 };
    this.provinces.forEach(province => {
      if (province.properties.controlled) {
        total.population += province.properties.resources.population;
        total.food += province.properties.resources.food;
        total.flint += province.properties.resources.flint;
      }
    });
    return total;
  }

  getControlledProvinces(): Province[] {
    return Array.from(this.provinces.values()).filter(p => p.properties.controlled);
  }
}

// Game Manager
class GameManager {
  state: GameState;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  updateCallback: (() => void) | null;
  resourceTimer: NodeJS.Timeout | null;
  scale: number;
  offsetX: number;
  offsetY: number;

  constructor() {
    this.state = new GameState();
    this.canvas = null;
    this.ctx = null;
    this.updateCallback = null;
    this.resourceTimer = null;
    this.scale = 40; // Pixels per coordinate unit
    this.offsetX = 500; // Horizontal offset
    this.offsetY = 2100; // Vertical offset
  }

  initialize(mapContainer: HTMLElement) {
    // Load map data
    const data = mapData as MapData;
    data.features.forEach(feature => {
      this.state.provinces.set(feature.id, feature);
    });

    // Initialize a random starting province with a tribe
    this.initializeStartingTribe();

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = mapContainer.clientWidth;
    this.canvas.height = mapContainer.clientHeight;
    this.canvas.style.cursor = 'pointer';
    mapContainer.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Add event listeners
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));

    // Render provinces
    this.renderProvinces();

    // Start resource generation timer
    this.startResourceGeneration();
  }

  initializeStartingTribe() {
    const landProvinces = Array.from(this.state.provinces.values())
      .filter(p => p.properties.type === 'land');
    
    if (landProvinces.length > 0) {
      const randomProvince = landProvinces[Math.floor(Math.random() * landProvinces.length)];
      randomProvince.properties.controlled = true;
      randomProvince.properties.resources.population = 10;
      randomProvince.properties.resources.food = 50;
      randomProvince.properties.resources.flint = 20;
      
      console.log(`Starting tribe initialized in province: ${randomProvince.id} (${randomProvince.properties.name})`);
    }
  }

  renderProvinces() {
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw each province
    this.state.provinces.forEach((province, id) => {
      this.drawProvince(province, id === this.state.hoveredProvinceId);
    });
  }

  drawProvince(province: Province, isHovered: boolean) {
    if (!this.ctx) return;

    const coords = province.geometry.coordinates[0];
    
    this.ctx.beginPath();
    coords.forEach((coord, index) => {
      const x = coord[0] * this.scale + this.offsetX;
      const y = -coord[1] * this.scale + this.offsetY;
      
      if (index === 0) {
        this.ctx!.moveTo(x, y);
      } else {
        this.ctx!.lineTo(x, y);
      }
    });
    this.ctx.closePath();

    // Fill color
    if (isHovered) {
      this.ctx.fillStyle = '#ecf0f1';
    } else {
      this.ctx.fillStyle = this.getProvinceColor(province);
    }
    this.ctx.fill();

    // Stroke
    this.ctx.strokeStyle = '#2c3e50';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw province name
    const centerX = coords.reduce((sum, c) => sum + c[0], 0) / coords.length * this.scale + this.offsetX;
    const centerY = coords.reduce((sum, c) => sum + c[1], 0) / coords.length * -this.scale + this.offsetY;
    
    this.ctx.fillStyle = '#000';
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(province.properties.name, centerX, centerY);

    // Draw tribe icon if controlled
    if (province.properties.controlled) {
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY + 20, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.fill();
      this.ctx.strokeStyle = '#c0392b';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  getProvinceColor(province: Province): string {
    if (province.properties.controlled) {
      return "#3498db"; // Blue for controlled
    }
    return "#95a5a6"; // Gray for uncontrolled
  }

  handleCanvasClick(event: MouseEvent) {
    const provinceId = this.getProvinceAtPoint(event.offsetX, event.offsetY);
    if (provinceId) {
      this.handleProvinceClick(provinceId);
    }
  }

  handleCanvasMouseMove(event: MouseEvent) {
    const provinceId = this.getProvinceAtPoint(event.offsetX, event.offsetY);
    
    if (provinceId !== this.state.hoveredProvinceId) {
      this.state.hoveredProvinceId = provinceId;
      this.renderProvinces();
    }
  }

  getProvinceAtPoint(x: number, y: number): string | null {
    if (!this.ctx) return null;

    for (const [id, province] of this.state.provinces) {
      const coords = province.geometry.coordinates[0];
      
      this.ctx.beginPath();
      coords.forEach((coord, index) => {
        const px = coord[0] * this.scale + this.offsetX;
        const py = -coord[1] * this.scale + this.offsetY;
        
        if (index === 0) {
          this.ctx!.moveTo(px, py);
        } else {
          this.ctx!.lineTo(px, py);
        }
      });
      this.ctx.closePath();

      if (this.ctx.isPointInPath(x, y)) {
        return id;
      }
    }

    return null;
  }

  handleProvinceClick(provinceId: string) {
    console.log(`Province clicked: ${provinceId}`);
    const province = this.state.getProvince(provinceId);
    
    if (province) {
      console.log(`Province ID: ${provinceId}`);
      console.log(`Province Name: ${province.properties.name}`);
      console.log(`Controlled: ${province.properties.controlled}`);
      console.log(`Resources:`, province.properties.resources);
    }

    this.state.selectedProvinceId = provinceId;
    this.triggerUpdate();
  }

  canExploreProvince(targetProvinceId: string): { canExplore: boolean; reason?: string } {
    const targetProvince = this.state.getProvince(targetProvinceId);
    
    if (!targetProvince) {
      return { canExplore: false, reason: "Province not found" };
    }

    if (targetProvince.properties.controlled) {
      return { canExplore: false, reason: "Province already controlled" };
    }

    // Check if it's a neighbor of any controlled province
    const controlledProvinces = this.state.getControlledProvinces();
    const isNeighbor = controlledProvinces.some(cp => 
      cp.properties.neighbors.includes(targetProvinceId)
    );

    if (!isNeighbor) {
      return { canExplore: false, reason: "Province is not adjacent to controlled territory" };
    }

    // Check if we have enough resources
    const totalResources = this.state.getTotalResources();
    const explorationCost = { population: 5, food: 20 };

    if (totalResources.population < explorationCost.population) {
      return { canExplore: false, reason: "Not enough population (need 5)" };
    }

    if (totalResources.food < explorationCost.food) {
      return { canExplore: false, reason: "Not enough food (need 20)" };
    }

    return { canExplore: true };
  }

  exploreProvince(targetProvinceId: string): boolean {
    const check = this.canExploreProvince(targetProvinceId);
    
    if (!check.canExplore) {
      this.showMessage(check.reason || "Cannot explore", 'error');
      return false;
    }

    const targetProvince = this.state.getProvince(targetProvinceId);
    if (!targetProvince) return false;

    // Deduct resources from controlled provinces
    const explorationCost = { population: 5, food: 20 };
    this.deductResources(explorationCost);

    // Take control of the province
    targetProvince.properties.controlled = true;
    targetProvince.properties.resources.population = 5;
    targetProvince.properties.resources.food = 10;

    // Re-render map
    this.renderProvinces();

    this.showMessage(`Successfully explored ${targetProvince.properties.name}!`, 'success');
    console.log(`Province ${targetProvinceId} explored and now controlled`);
    
    this.triggerUpdate();
    return true;
  }

  deductResources(cost: { population: number; food: number }) {
    const controlledProvinces = this.state.getControlledProvinces();
    let remainingPopulation = cost.population;
    let remainingFood = cost.food;

    // Deduct population
    for (const province of controlledProvinces) {
      if (remainingPopulation <= 0) break;
      
      const deduct = Math.min(province.properties.resources.population, remainingPopulation);
      province.properties.resources.population -= deduct;
      remainingPopulation -= deduct;
    }

    // Deduct food
    for (const province of controlledProvinces) {
      if (remainingFood <= 0) break;
      
      const deduct = Math.min(province.properties.resources.food, remainingFood);
      province.properties.resources.food -= deduct;
      remainingFood -= deduct;
    }
  }

  startResourceGeneration() {
    // Generate resources every 5 seconds
    this.resourceTimer = setInterval(() => {
      this.generateResources();
    }, 5000);
  }

  generateResources() {
    const controlledProvinces = this.state.getControlledProvinces();
    
    controlledProvinces.forEach(province => {
      const props = province.properties;
      
      // Add food
      props.resources.food = Math.min(
        props.resources.food + props.resourceGrowth.food,
        props.resourceLimit.food
      );

      // Add flint
      props.resources.flint = Math.min(
        props.resources.flint + props.resourceGrowth.flint,
        props.resourceLimit.flint
      );
    });

    console.log('Resources generated for all controlled provinces');
    this.triggerUpdate();
  }

  showMessage(text: string, type: 'success' | 'error') {
    this.state.message = { text, type };
    this.triggerUpdate();
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.state.message = null;
      this.triggerUpdate();
    }, 3000);
  }

  setUpdateCallback(callback: (() => void) | null) {
    this.updateCallback = callback;
  }

  triggerUpdate() {
    if (this.updateCallback) {
      this.updateCallback();
    }
  }

  destroy() {
    if (this.resourceTimer) {
      clearInterval(this.resourceTimer);
    }
  }
}

// React UI Component
interface GameUIProps {
  gameManager: GameManager;
}

function GameUI({ gameManager }: GameUIProps) {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);

  React.useEffect(() => {
    gameManager.setUpdateCallback(forceUpdate);
    return () => {
      gameManager.setUpdateCallback(null);
    };
  }, [gameManager]);

  const selectedProvince = gameManager.state.getSelectedProvince();
  const totalResources = gameManager.state.getTotalResources();
  const canExplore = selectedProvince 
    ? gameManager.canExploreProvince(selectedProvince.id)
    : { canExplore: false };

  const handleExplore = () => {
    if (selectedProvince) {
      gameManager.exploreProvince(selectedProvince.id);
    }
  };

  return React.createElement('div', { id: 'ui-panel' },
    // Total Resources Section
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h2', null, 'Total Resources'),
      React.createElement('div', { className: 'resource-item' },
        React.createElement('span', { className: 'resource-label' }, 'Population:'),
        React.createElement('span', { className: 'resource-value' }, totalResources.population)
      ),
      React.createElement('div', { className: 'resource-item' },
        React.createElement('span', { className: 'resource-label' }, 'Food:'),
        React.createElement('span', { className: 'resource-value' }, totalResources.food)
      ),
      React.createElement('div', { className: 'resource-item' },
        React.createElement('span', { className: 'resource-label' }, 'Flint:'),
        React.createElement('span', { className: 'resource-value' }, totalResources.flint)
      )
    ),

    // Message Display
    gameManager.state.message && React.createElement('div', {
      className: gameManager.state.message.type === 'success' ? 'status-message' : 'error-message'
    }, gameManager.state.message.text),

    // Selected Province Section
    selectedProvince && React.createElement('div', { className: 'panel-section' },
      React.createElement('h2', null, 'Selected Province'),
      React.createElement('div', { className: 'province-info' },
        React.createElement('p', null, React.createElement('strong', null, 'Name: '), selectedProvince.properties.name),
        React.createElement('p', null, React.createElement('strong', null, 'ID: '), selectedProvince.id),
        React.createElement('p', null, React.createElement('strong', null, 'Status: '), 
          selectedProvince.properties.controlled ? 'Controlled' : 'Uncontrolled')
      ),
      
      selectedProvince.properties.controlled && React.createElement('div', null,
        React.createElement('h2', null, 'Province Resources'),
        React.createElement('div', { className: 'resource-item' },
          React.createElement('span', { className: 'resource-label' }, 'Population:'),
          React.createElement('span', { className: 'resource-value' }, selectedProvince.properties.resources.population)
        ),
        React.createElement('div', { className: 'resource-item' },
          React.createElement('span', { className: 'resource-label' }, 'Food:'),
          React.createElement('span', { className: 'resource-value' }, selectedProvince.properties.resources.food)
        ),
        React.createElement('div', { className: 'resource-item' },
          React.createElement('span', { className: 'resource-label' }, 'Flint:'),
          React.createElement('span', { className: 'resource-value' }, selectedProvince.properties.resources.flint)
        ),
        React.createElement('p', { style: { marginTop: '10px', fontSize: '12px', color: '#bdc3c7' } },
          `Growth: +${selectedProvince.properties.resourceGrowth.food} food, +${selectedProvince.properties.resourceGrowth.flint} flint per 5s`)
      ),

      !selectedProvince.properties.controlled && React.createElement('div', null,
        React.createElement('button', {
          className: 'action-button',
          onClick: handleExplore,
          disabled: !canExplore.canExplore
        }, 'Explore Province (5 pop, 20 food)'),
        !canExplore.canExplore && canExplore.reason && 
          React.createElement('p', { style: { color: '#e74c3c', fontSize: '12px' } }, canExplore.reason)
      )
    ),

    // Instructions
    React.createElement('div', { className: 'panel-section' },
      React.createElement('h2', null, 'Instructions'),
      React.createElement('p', { style: { fontSize: '12px', lineHeight: '1.5' } },
        'Click on provinces to select them. Explore neighboring provinces to expand your territory. Resources generate automatically every 5 seconds.')
    )
  );
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  if (!root) return;

  // Create map container
  const mapContainer = document.createElement('div');
  mapContainer.id = 'map';
  root.appendChild(mapContainer);

  // Initialize game
  const gameManager = new GameManager();
  gameManager.initialize(mapContainer);

  // Create React UI
  const uiContainer = document.createElement('div');
  root.appendChild(uiContainer);
  
  const reactRoot = ReactDOM.createRoot(uiContainer);
  reactRoot.render(React.createElement(GameUI, { gameManager }));
});
