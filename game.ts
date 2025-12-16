// Stone Age Tribe Management Game

interface Province {
    id: number;
    name: string;
    terrain: string;
    resources: string[];
    coordinates: number[][][];
    originalCoordinates?: number[][][]; // Store original coordinates for proper rescaling
}

interface Tribe {
    name: string;
    population: number;
    food: number;
    provinceId: number;
    technology: string[];
    age: number;
}

interface GameState {
    tribes: Tribe[];
    provinces: Province[];
    selectedProvince: number | null;
    year: number;
    paused: boolean;
}

// Game balance constants
const GAME_CONFIG = {
    UPDATE_INTERVAL: 2000, // Real-time milliseconds between game year advances (2 seconds = 10 game years)
    POPULATION_GROWTH_RATE: 0.05,
    POPULATION_DECLINE_RATE: 0.1,
    RESEARCH_POPULATION_THRESHOLD: 30,
    RESEARCH_POPULATION_COST: 5,
    YEARS_PER_TICK: 10
};

class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private state: GameState;
    private lastUpdate: number = 0;
    private updateInterval: number = GAME_CONFIG.UPDATE_INTERVAL;
    private originalProvinceData: Map<number, number[][][]> = new Map();

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.ctx = context;
        
        this.state = {
            tribes: [],
            provinces: [],
            selectedProvince: null,
            year: -10000, // 10000 BC
            paused: false
        };

        this.resizeCanvas();
        this.setupEventListeners();
        this.loadMap();
    }

    private resizeCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    private async loadMap(): Promise<void> {
        try {
            const response = await fetch('map.json');
            const geoJSON = await response.json();
            
            this.state.provinces = geoJSON.features.map((feature: any) => ({
                id: feature.properties.id,
                name: feature.properties.name,
                terrain: feature.properties.terrain,
                resources: feature.properties.resources,
                coordinates: feature.geometry.coordinates
            }));

            // Store original coordinates for each province
            for (const province of this.state.provinces) {
                this.originalProvinceData.set(province.id, JSON.parse(JSON.stringify(province.coordinates)));
            }

            // Scale provinces to fit the screen
            this.scaleProvinces();

            // Create initial tribe in Northern Plains
            this.state.tribes.push({
                name: "Stone Tribe",
                population: 25,
                food: 50,
                provinceId: 1,
                technology: ["fire", "stone_tools"],
                age: 0 // Stone Age
            });

            this.render();
            this.gameLoop();
        } catch (error) {
            console.error('Failed to load map:', error);
        }
    }

    private scaleProvinces(): void {
        if (this.state.provinces.length === 0 || this.originalProvinceData.size === 0) return;

        // Restore original coordinates first
        for (const province of this.state.provinces) {
            const original = this.originalProvinceData.get(province.id);
            if (original) {
                province.coordinates = JSON.parse(JSON.stringify(original));
            }
        }

        // Find bounds of all provinces from original coordinates
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (const province of this.state.provinces) {
            for (const ring of province.coordinates) {
                for (const coord of ring) {
                    minX = Math.min(minX, coord[0]);
                    minY = Math.min(minY, coord[1]);
                    maxX = Math.max(maxX, coord[0]);
                    maxY = Math.max(maxY, coord[1]);
                }
            }
        }

        const sourceWidth = maxX - minX;
        const sourceHeight = maxY - minY;
        
        // Add padding
        const padding = 50;
        const targetWidth = this.canvas.width - padding * 2;
        const targetHeight = this.canvas.height - padding * 2;
        
        // Calculate scale to fit while maintaining aspect ratio
        const scaleX = targetWidth / sourceWidth;
        const scaleY = targetHeight / sourceHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Calculate offsets to center the map
        const scaledWidth = sourceWidth * scale;
        const scaledHeight = sourceHeight * scale;
        const offsetX = padding + (targetWidth - scaledWidth) / 2;
        const offsetY = padding + (targetHeight - scaledHeight) / 2;

        // Scale all province coordinates (including all rings for proper GeoJSON support)
        for (const province of this.state.provinces) {
            province.coordinates = province.coordinates.map(ring =>
                ring.map(coord => [
                    (coord[0] - minX) * scale + offsetX,
                    (coord[1] - minY) * scale + offsetY
                ])
            );
        }
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.scaleProvinces();
            this.render();
        });
        
        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.state.paused = !this.state.paused;
            const btn = document.getElementById('pauseBtn');
            if (btn) btn.textContent = this.state.paused ? 'Resume' : 'Pause';
        });

        document.getElementById('gatherBtn')?.addEventListener('click', () => {
            this.gatherFood();
        });

        document.getElementById('researchBtn')?.addEventListener('click', () => {
            this.researchTechnology();
        });
    }

    private handleClick(e: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check which province was clicked
        for (const province of this.state.provinces) {
            if (this.isPointInProvince(x, y, province)) {
                this.state.selectedProvince = province.id;
                this.render();
                this.updateUI();
                break;
            }
        }
    }

    private isPointInProvince(x: number, y: number, province: Province): boolean {
        // Simple point-in-polygon test
        const coords = province.coordinates[0];
        let inside = false;
        
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            const xi = coords[i][0], yi = coords[i][1];
            const xj = coords[j][0], yj = coords[j][1];
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    private gameLoop(): void {
        const now = Date.now();
        
        if (!this.state.paused && now - this.lastUpdate > this.updateInterval) {
            this.update();
            this.lastUpdate = now;
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    private update(): void {
        // Advance year
        this.state.year += GAME_CONFIG.YEARS_PER_TICK;

        // Update tribes
        for (const tribe of this.state.tribes) {
            // Population growth/decline based on food
            if (tribe.food > tribe.population * 2) {
                tribe.population += Math.floor(tribe.population * GAME_CONFIG.POPULATION_GROWTH_RATE);
            } else if (tribe.food < tribe.population) {
                tribe.population -= Math.floor(tribe.population * GAME_CONFIG.POPULATION_DECLINE_RATE);
                if (tribe.population < 1) tribe.population = 1;
            }

            // Consume food
            tribe.food -= tribe.population;
            if (tribe.food < 0) tribe.food = 0;

            // Auto-gather some food
            const province = this.state.provinces.find(p => p.id === tribe.provinceId);
            if (province) {
                const foodValue = this.getFoodValueForTerrain(province.terrain);
                tribe.food += foodValue;
            }
        }

        this.updateUI();
    }

    private getFoodValueForTerrain(terrain: string): number {
        const values: { [key: string]: number } = {
            'grassland': 5,
            'forest': 4,
            'hills': 2,
            'valley': 6,
            'mountains': 1,
            'water': 3
        };
        return values[terrain] || 2;
    }

    private gatherFood(): void {
        const tribe = this.state.tribes[0];
        const province = this.state.provinces.find(p => p.id === tribe.provinceId);
        
        if (province) {
            const gathered = this.getFoodValueForTerrain(province.terrain) * 3;
            tribe.food += gathered;
            this.updateUI();
            this.showMessage(`Gathered ${gathered} food!`);
        }
    }

    private researchTechnology(): void {
        const tribe = this.state.tribes[0];
        
        if (tribe.population < GAME_CONFIG.RESEARCH_POPULATION_THRESHOLD) {
            this.showMessage(`Need at least ${GAME_CONFIG.RESEARCH_POPULATION_THRESHOLD} population to research!`);
            return;
        }

        const techs = ["agriculture", "pottery", "weaving", "animal_domestication", "copper_working"];
        const available = techs.filter(t => !tribe.technology.includes(t));
        
        if (available.length > 0) {
            const newTech = available[0];
            tribe.technology.push(newTech);
            tribe.population -= GAME_CONFIG.RESEARCH_POPULATION_COST;
            
            // Advance age if enough technologies
            if (tribe.technology.length > 5 && tribe.age === 0) {
                tribe.age = 1; // Bronze Age
                this.showMessage(`Advanced to Bronze Age! Discovered ${newTech}!`);
            } else {
                this.showMessage(`Discovered ${newTech}!`);
            }
            
            this.updateUI();
        } else {
            this.showMessage("All technologies researched!");
        }
    }

    private showMessage(msg: string): void {
        const msgEl = document.getElementById('message');
        if (msgEl) {
            msgEl.textContent = msg;
            setTimeout(() => {
                msgEl.textContent = '';
            }, 3000);
        }
    }

    private render(): void {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
        gradient.addColorStop(0.7, '#8B7355'); // Brown in middle
        gradient.addColorStop(1, '#5C4033'); // Dark brown at bottom
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw provinces
        for (const province of this.state.provinces) {
            this.drawProvince(province);
        }

        // Draw tribes
        for (const tribe of this.state.tribes) {
            this.drawTribe(tribe);
        }

        // Highlight selected province
        if (this.state.selectedProvince) {
            const province = this.state.provinces.find(p => p.id === this.state.selectedProvince);
            if (province) {
                this.highlightProvince(province);
            }
        }
    }

    private drawProvince(province: Province): void {
        // Draw all rings (exterior and holes) for proper GeoJSON support
        this.ctx.beginPath();
        
        for (const ring of province.coordinates) {
            if (ring.length === 0) continue;
            
            this.ctx.moveTo(ring[0][0], ring[0][1]);
            for (let i = 1; i < ring.length; i++) {
                this.ctx.lineTo(ring[i][0], ring[i][1]);
            }
            this.ctx.closePath();
        }

        // Fill based on terrain
        this.ctx.fillStyle = this.getTerrainColor(province.terrain);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Label (use first ring for center calculation)
        const center = this.getPolygonCenter(province.coordinates[0]);
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(province.name, center.x, center.y);
    }

    private getTerrainColor(terrain: string): string {
        const colors: { [key: string]: string } = {
            'grassland': '#90EE90',
            'forest': '#228B22',
            'hills': '#8B7355',
            'valley': '#ADFF2F',
            'mountains': '#696969',
            'water': '#4682B4'
        };
        return colors[terrain] || '#DDD';
    }

    private getPolygonCenter(coords: number[][]): { x: number, y: number } {
        let x = 0, y = 0;
        for (const coord of coords) {
            x += coord[0];
            y += coord[1];
        }
        return { x: x / coords.length, y: y / coords.length };
    }

    private drawTribe(tribe: Tribe): void {
        const province = this.state.provinces.find(p => p.id === tribe.provinceId);
        if (!province) return;

        const center = this.getPolygonCenter(province.coordinates[0]);
        
        // Draw tribe marker
        this.ctx.fillStyle = '#FF0000';
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y + 15, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw population indicator
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tribe.population.toString(), center.x, center.y + 19);
    }

    private highlightProvince(province: Province): void {
        // Highlight all rings for proper GeoJSON support
        this.ctx.beginPath();
        
        for (const ring of province.coordinates) {
            if (ring.length === 0) continue;
            
            this.ctx.moveTo(ring[0][0], ring[0][1]);
            for (let i = 1; i < ring.length; i++) {
                this.ctx.lineTo(ring[i][0], ring[i][1]);
            }
            this.ctx.closePath();
        }
        
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    private updateUI(): void {
        const tribe = this.state.tribes[0];
        
        document.getElementById('year')!.textContent = 
            this.state.year < 0 ? `${Math.abs(this.state.year)} BC` : `${this.state.year} AD`;
        
        document.getElementById('population')!.textContent = tribe.population.toString();
        document.getElementById('food')!.textContent = tribe.food.toString();
        document.getElementById('age')!.textContent = tribe.age === 0 ? 'Stone Age' : 'Bronze Age';
        document.getElementById('tech')!.textContent = tribe.technology.join(', ');

        if (this.state.selectedProvince) {
            const province = this.state.provinces.find(p => p.id === this.state.selectedProvince);
            if (province) {
                document.getElementById('provinceName')!.textContent = province.name;
                document.getElementById('provinceTerrain')!.textContent = province.terrain;
                document.getElementById('provinceResources')!.textContent = province.resources.join(', ');
            }
        }
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new Game('gameCanvas');
});
