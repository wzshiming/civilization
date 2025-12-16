import mapData from './map.json';

// Type definitions
interface Province {
  id: string;
  name: string;
  terrain: 'land' | 'water';
  coordinates: number[][];
  controlled: boolean;
}

interface Tribe {
  provinceId: string;
  population: number;
  food: number;
  flint: number;
}

interface GameState {
  provinces: Map<string, Province>;
  tribe: Tribe | null;
  selectedProvinceId: string | null;
  hoveredProvinceId: string | null;
}

// Game state
const gameState: GameState = {
  provinces: new Map(),
  tribe: null,
  selectedProvinceId: null,
  hoveredProvinceId: null,
};

// Canvas and rendering
const canvas = document.getElementById('map-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Initialize canvas size
function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  render();
}

// Load map data
function loadMap() {
  mapData.features.forEach((feature) => {
    const props = feature.properties;
    const coords = feature.geometry.coordinates[0];
    
    const province: Province = {
      id: props.id,
      name: props.name,
      terrain: props.terrain as 'land' | 'water',
      coordinates: coords,
      controlled: false,
    };
    
    gameState.provinces.set(props.id, province);
  });
}

// Initialize tribe on a random land province
function initializeTribe() {
  const landProvinces = Array.from(gameState.provinces.values()).filter(
    (p) => p.terrain === 'land'
  );
  
  if (landProvinces.length === 0) {
    console.error('No land provinces found!');
    return;
  }
  
  const randomProvince = landProvinces[Math.floor(Math.random() * landProvinces.length)];
  
  gameState.tribe = {
    provinceId: randomProvince.id,
    population: 100,
    food: 50,
    flint: 10,
  };
  
  randomProvince.controlled = true;
  
  console.log(`Tribe initialized on province: ${randomProvince.name} (${randomProvince.id})`);
  updateUI();
}

// Check if two provinces are neighbors
function areNeighbors(province1: Province, province2: Province): boolean {
  // Simple neighbor detection: check if any vertex is close to another
  for (const coord1 of province1.coordinates) {
    for (const coord2 of province2.coordinates) {
      const dx = coord1[0] - coord2[0];
      const dy = coord1[1] - coord2[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 5) {
        return true;
      }
    }
  }
  return false;
}

// Get neighbors of a province (helper function for potential future use)
function getNeighbors(provinceId: string): Province[] {
  const province = gameState.provinces.get(provinceId);
  if (!province) return [];
  
  return Array.from(gameState.provinces.values()).filter(
    (p) => p.id !== provinceId && areNeighbors(province, p)
  );
}
// Suppress unused warning - keeping for potential future features
void getNeighbors;

// Point in polygon test
function isPointInPolygon(x: number, y: number, coordinates: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i][0];
    const yi = coordinates[i][1];
    const xj = coordinates[j][0];
    const yj = coordinates[j][1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Get province at mouse position
function getProvinceAt(x: number, y: number): Province | null {
  for (const province of gameState.provinces.values()) {
    if (isPointInPolygon(x, y, province.coordinates)) {
      return province;
    }
  }
  return null;
}

// Calculate centroid of a polygon
function getCentroid(coordinates: number[][]): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const coord of coordinates) {
    x += coord[0];
    y += coord[1];
  }
  return { x: x / coordinates.length, y: y / coordinates.length };
}

// Render the map
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw all provinces
  for (const province of gameState.provinces.values()) {
    ctx.beginPath();
    ctx.moveTo(province.coordinates[0][0], province.coordinates[0][1]);
    
    for (let i = 1; i < province.coordinates.length; i++) {
      ctx.lineTo(province.coordinates[i][0], province.coordinates[i][1]);
    }
    ctx.closePath();
    
    // Fill color based on terrain and control status
    if (province.controlled) {
      ctx.fillStyle = '#8fbc8f'; // Controlled land - darker green
    } else if (province.terrain === 'land') {
      ctx.fillStyle = '#f5e6d3'; // Land - light beige
    } else {
      ctx.fillStyle = '#b0d4e3'; // Water - light blue
    }
    
    // Highlight hovered province
    if (province.id === gameState.hoveredProvinceId) {
      ctx.fillStyle = province.terrain === 'land' ? '#ffe4b5' : '#87ceeb';
    }
    
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  
  // Draw tribe icon
  if (gameState.tribe) {
    const province = gameState.provinces.get(gameState.tribe.provinceId);
    if (province) {
      const centroid = getCentroid(province.coordinates);
      
      // Draw tribe icon (circle)
      ctx.beginPath();
      ctx.arc(centroid.x, centroid.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#8b4513';
      ctx.fill();
      ctx.strokeStyle = '#5a2d0c';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// Update UI panel
function updateUI() {
  const tribeInfo = document.getElementById('tribe-info')!;
  
  if (!gameState.tribe) {
    tribeInfo.innerHTML = '<div class="no-tribe">No tribe yet</div>';
    return;
  }
  
  const province = gameState.provinces.get(gameState.tribe.provinceId);
  const provinceName = province ? province.name : 'Unknown';
  
  tribeInfo.innerHTML = `
    <h2>Your Tribe</h2>
    <div class="stat-row">
      <span class="stat-label">Location:</span>
      <span class="stat-value">${provinceName}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Population:</span>
      <span class="stat-value">${gameState.tribe.population}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Food:</span>
      <span class="stat-value">${gameState.tribe.food}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Flint:</span>
      <span class="stat-value">${gameState.tribe.flint}</span>
    </div>
    
    <div class="info-text">
      Click on a neighboring province to explore and expand your territory. 
      Exploration costs 10 food and sends 5 population to the new land.
    </div>
  `;
}

// Handle exploration
function exploreProvince(targetProvince: Province) {
  if (!gameState.tribe) return;
  
  const currentProvince = gameState.provinces.get(gameState.tribe.provinceId);
  if (!currentProvince) return;
  
  // Check if target is a neighbor
  if (!areNeighbors(currentProvince, targetProvince)) {
    console.log('Province is not a neighbor!');
    return;
  }
  
  // Check if target is land and not already controlled
  if (targetProvince.terrain !== 'land') {
    console.log('Cannot explore water provinces!');
    return;
  }
  
  if (targetProvince.controlled) {
    console.log('Province already controlled!');
    return;
  }
  
  // Check resources
  if (gameState.tribe.food < 10) {
    console.log('Not enough food to explore! Need 10 food.');
    return;
  }
  
  if (gameState.tribe.population < 5) {
    console.log('Not enough population to explore! Need 5 population.');
    return;
  }
  
  // Perform exploration
  gameState.tribe.food -= 10;
  gameState.tribe.population -= 5;
  targetProvince.controlled = true;
  
  console.log(`Explored ${targetProvince.name}! Population sent: 5, Food consumed: 10`);
  
  updateUI();
  render();
}

// Mouse event handlers
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const province = getProvinceAt(x, y);
  const previousHovered = gameState.hoveredProvinceId;
  gameState.hoveredProvinceId = province ? province.id : null;
  
  if (previousHovered !== gameState.hoveredProvinceId) {
    render();
  }
  
  // Change cursor for interactive provinces
  if (province && province.terrain === 'land' && !province.controlled && gameState.tribe) {
    const currentProvince = gameState.provinces.get(gameState.tribe.provinceId);
    if (currentProvince && areNeighbors(currentProvince, province)) {
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }
  } else {
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const province = getProvinceAt(x, y);
  
  if (province) {
    console.log(`Clicked province: ${province.name} (${province.id})`);
    console.log('Province info:', {
      id: province.id,
      name: province.name,
      terrain: province.terrain,
      controlled: province.controlled,
    });
    
    // Try to explore if it's a valid target
    if (gameState.tribe && province.terrain === 'land' && !province.controlled) {
      exploreProvince(province);
    }
  }
});

// Auto-generate resources every 5 seconds
function autoGenerateResources() {
  if (!gameState.tribe) return;
  
  // Count controlled provinces
  const controlledProvinces = Array.from(gameState.provinces.values()).filter(
    (p) => p.controlled
  ).length;
  
  // Each controlled province generates 2 food
  const foodGenerated = controlledProvinces * 2;
  gameState.tribe.food += foodGenerated;
  
  console.log(`Resources generated! +${foodGenerated} food from ${controlledProvinces} provinces`);
  updateUI();
}

// Initialize the game
function init() {
  loadMap();
  resizeCanvas();
  initializeTribe();
  
  // Set up resource generation timer
  setInterval(autoGenerateResources, 5000);
  
  console.log('Game initialized!');
  console.log(`Total provinces: ${gameState.provinces.size}`);
  console.log(`Land provinces: ${Array.from(gameState.provinces.values()).filter(p => p.terrain === 'land').length}`);
}

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Start the game
init();
