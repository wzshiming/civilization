package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/aquilax/go-perlin"
)

// Point represents a 2D coordinate
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Resource represents a resource with dynamic properties
type Resource struct {
	Type       string  `json:"type"`
	Current    float64 `json:"current"`
	Maximum    float64 `json:"maximum"`
	ChangeRate float64 `json:"changeRate"`
}

// Parcel represents a map region
type Parcel struct {
	ID          int        `json:"id"`
	Vertices    []Point    `json:"vertices"`
	Center      Point      `json:"center"`
	Terrain     string     `json:"terrain"`
	Resources   []Resource `json:"resources"`
	Neighbors   []int      `json:"neighbors"`
	Elevation   float64    `json:"elevation"`
	Moisture    float64    `json:"moisture"`
	Temperature float64    `json:"temperature"`
}

// WorldMap represents the complete world state
type WorldMap struct {
	Parcels    map[int]*Parcel `json:"parcels"`
	Width      float64         `json:"width"`
	Height     float64         `json:"height"`
	LastUpdate int64           `json:"lastUpdate"`
}

// WorldSimulator manages the world state and simulation
type WorldSimulator struct {
	mu              sync.RWMutex
	world           *WorldMap
	isSimulating    bool
	simulationSpeed float64
	seed            int64
	numParcels      int
	clients         map[chan string]bool
	clientsMu       sync.Mutex
}

func NewWorldSimulator() *WorldSimulator {
	return &WorldSimulator{
		clients:         make(map[chan string]bool),
		simulationSpeed: 1.0,
		numParcels:      500,
	}
}

// Generate creates a new world map
func (ws *WorldSimulator) Generate(width, height float64, numParcels int, seed int64) {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	if seed == 0 {
		seed = time.Now().UnixNano()
	}
	ws.seed = seed
	ws.numParcels = numParcels

	log.Printf("Generating world map with seed: %d, parcels: %d", seed, numParcels)

	rng := rand.New(rand.NewSource(seed))

	// Generate parcels using simple grid-based approach with noise
	parcels := make(map[int]*Parcel)
	perlinGen := perlin.NewPerlin(2, 2, 3, seed)

	// Create a grid and add some randomness
	cols := int(math.Sqrt(float64(numParcels)))
	rows := (numParcels + cols - 1) / cols
	cellWidth := width / float64(cols)
	cellHeight := height / float64(rows)

	id := 0
	for row := 0; row < rows && id < numParcels; row++ {
		for col := 0; col < cols && id < numParcels; col++ {
			// Add randomness to cell position
			offsetX := (rng.Float64() - 0.5) * cellWidth * 0.5
			offsetY := (rng.Float64() - 0.5) * cellHeight * 0.5

			centerX := float64(col)*cellWidth + cellWidth/2 + offsetX
			centerY := float64(row)*cellHeight + cellHeight/2 + offsetY

			// Create vertices for hexagon-like shape
			vertices := make([]Point, 6)
			for i := 0; i < 6; i++ {
				angle := float64(i) * math.Pi / 3
				radius := math.Min(cellWidth, cellHeight) * 0.45
				vertices[i] = Point{
					X: centerX + radius*math.Cos(angle),
					Y: centerY + radius*math.Sin(angle),
				}
			}

			// Generate terrain using Perlin noise
			elevation := perlinGen.Noise2D(centerX/width*4, centerY/height*4)
			moisture := perlinGen.Noise2D(centerX/width*3+100, centerY/height*3+100)
			temperature := perlinGen.Noise2D(centerX/width*2+200, centerY/height*2+200)

			// Determine terrain type
			terrain := determineTerrain(elevation, moisture, temperature)

			// Generate resources based on terrain
			resources := generateResources(terrain, rng)

			parcels[id] = &Parcel{
				ID:          id,
				Vertices:    vertices,
				Center:      Point{X: centerX, Y: centerY},
				Terrain:     terrain,
				Resources:   resources,
				Neighbors:   []int{}, // Will be populated later
				Elevation:   elevation,
				Moisture:    moisture,
				Temperature: temperature,
			}
			id++
		}
	}

	// Calculate neighbors
	for id1, p1 := range parcels {
		for id2, p2 := range parcels {
			if id1 != id2 {
				dist := math.Sqrt(math.Pow(p1.Center.X-p2.Center.X, 2) + math.Pow(p1.Center.Y-p2.Center.Y, 2))
				if dist < cellWidth*1.5 {
					p1.Neighbors = append(p1.Neighbors, id2)
				}
			}
		}
	}

	ws.world = &WorldMap{
		Parcels:    parcels,
		Width:      width,
		Height:     height,
		LastUpdate: time.Now().UnixMilli(),
	}

	log.Printf("World map generation complete: %d parcels", len(parcels))
	ws.broadcastWorldState()
}

func determineTerrain(elevation, moisture, temperature float64) string {
	// Normalize values to 0-1 range
	e := (elevation + 1) / 2
	m := (moisture + 1) / 2
	t := (temperature + 1) / 2

	if e < 0.3 {
		return "ocean"
	} else if e < 0.35 {
		return "shallow_water"
	} else if e < 0.4 {
		return "beach"
	} else if e > 0.8 {
		if t < 0.3 {
			return "snow"
		}
		return "mountain"
	} else if t < 0.2 {
		return "tundra"
	} else if m < 0.3 {
		return "desert"
	} else if m > 0.7 && t > 0.6 {
		return "jungle"
	} else if m > 0.5 {
		return "forest"
	}
	return "grassland"
}

func generateResources(terrain string, rng *rand.Rand) []Resource {
	resources := []Resource{}

	// Resource generation based on terrain
	switch terrain {
	case "ocean", "shallow_water":
		if rng.Float64() > 0.5 {
			resources = append(resources, Resource{
				Type:       "fish",
				Current:    rng.Float64() * 100,
				Maximum:    100,
				ChangeRate: 0.5,
			})
		}
	case "forest", "jungle":
		if rng.Float64() > 0.3 {
			resources = append(resources, Resource{
				Type:       "wood",
				Current:    rng.Float64() * 150,
				Maximum:    150,
				ChangeRate: 0.8,
			})
		}
		if rng.Float64() > 0.6 {
			resources = append(resources, Resource{
				Type:       "game",
				Current:    rng.Float64() * 80,
				Maximum:    80,
				ChangeRate: 0.3,
			})
		}
	case "mountain":
		if rng.Float64() > 0.4 {
			resources = append(resources, Resource{
				Type:       "stone",
				Current:    rng.Float64() * 200,
				Maximum:    200,
				ChangeRate: 0,
			})
		}
		if rng.Float64() > 0.7 {
			resources = append(resources, Resource{
				Type:       "iron",
				Current:    rng.Float64() * 100,
				Maximum:    100,
				ChangeRate: 0,
			})
		}
		if rng.Float64() > 0.9 {
			resources = append(resources, Resource{
				Type:       "gold",
				Current:    rng.Float64() * 50,
				Maximum:    50,
				ChangeRate: 0,
			})
		}
	case "desert":
		if rng.Float64() > 0.8 {
			resources = append(resources, Resource{
				Type:       "oil",
				Current:    rng.Float64() * 120,
				Maximum:    120,
				ChangeRate: 0,
			})
		}
	case "grassland":
		if rng.Float64() > 0.4 {
			resources = append(resources, Resource{
				Type:       "fertile_soil",
				Current:    rng.Float64() * 100,
				Maximum:    100,
				ChangeRate: 0.2,
			})
		}
		if rng.Float64() > 0.7 {
			resources = append(resources, Resource{
				Type:       "water",
				Current:    rng.Float64() * 80,
				Maximum:    80,
				ChangeRate: 0.1,
			})
		}
	case "tundra":
		if rng.Float64() > 0.8 {
			resources = append(resources, Resource{
				Type:       "coal",
				Current:    rng.Float64() * 100,
				Maximum:    100,
				ChangeRate: 0,
			})
		}
	}

	return resources
}

// Simulate updates world state
func (ws *WorldSimulator) Simulate(deltaTime float64) {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	if ws.world == nil || !ws.isSimulating {
		return
	}

	for _, parcel := range ws.world.Parcels {
		for i := range parcel.Resources {
			resource := &parcel.Resources[i]
			resource.Current += resource.ChangeRate * deltaTime
			if resource.Current > resource.Maximum {
				resource.Current = resource.Maximum
			}
			if resource.Current < 0 {
				resource.Current = 0
			}
		}
	}

	ws.world.LastUpdate = time.Now().UnixMilli()
	ws.broadcastWorldState()
}

func (ws *WorldSimulator) StartSimulation() {
	ws.mu.Lock()
	ws.isSimulating = true
	ws.mu.Unlock()
	log.Println("Simulation started")
}

func (ws *WorldSimulator) StopSimulation() {
	ws.mu.Lock()
	ws.isSimulating = false
	ws.mu.Unlock()
	log.Println("Simulation stopped")
}

func (ws *WorldSimulator) SetSpeed(speed float64) {
	ws.mu.Lock()
	ws.simulationSpeed = speed
	ws.mu.Unlock()
	log.Printf("Simulation speed set to: %.1fx", speed)
}

func (ws *WorldSimulator) GetWorld() *WorldMap {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.world
}

func (ws *WorldSimulator) IsSimulating() bool {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.isSimulating
}

func (ws *WorldSimulator) GetSpeed() float64 {
	ws.mu.RLock()
	defer ws.mu.RUnlock()
	return ws.simulationSpeed
}

func (ws *WorldSimulator) addClient(ch chan string) {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()
	ws.clients[ch] = true
	log.Printf("Client connected. Total clients: %d", len(ws.clients))
}

func (ws *WorldSimulator) removeClient(ch chan string) {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()
	delete(ws.clients, ch)
	close(ch)
	log.Printf("Client disconnected. Total clients: %d", len(ws.clients))
}

func (ws *WorldSimulator) broadcastWorldState() {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()

	if len(ws.clients) == 0 {
		return
	}

	data, err := json.Marshal(map[string]interface{}{
		"type":  "world_update",
		"world": ws.world,
	})
	if err != nil {
		log.Printf("Error marshaling world state: %v", err)
		return
	}

	message := fmt.Sprintf("data: %s\n\n", string(data))

	// Track clients to remove if they're not reading
	var toRemove []chan string

	for ch := range ws.clients {
		select {
		case ch <- message:
			// Message sent successfully
		default:
			// Client channel is full, mark for removal
			log.Printf("Client channel full, removing slow client")
			toRemove = append(toRemove, ch)
		}
	}

	// Remove slow/unresponsive clients
	for _, ch := range toRemove {
		delete(ws.clients, ch)
		close(ch)
	}
}

func (ws *WorldSimulator) Run() {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	lastUpdate := time.Now()

	for range ticker.C {
		now := time.Now()
		if ws.IsSimulating() {
			deltaTime := now.Sub(lastUpdate).Seconds() * ws.GetSpeed()
			ws.Simulate(deltaTime)
			lastUpdate = now
		} else {
			// Reset lastUpdate when paused to prevent jump when resuming
			lastUpdate = now
		}
	}
}

// HTTP Handlers
func (ws *WorldSimulator) handleSSE(w http.ResponseWriter, r *http.Request) {
	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// Create client channel
	messageChan := make(chan string, 10)
	ws.addClient(messageChan)
	defer ws.removeClient(messageChan)

	// Send initial world state
	if world := ws.GetWorld(); world != nil {
		data, _ := json.Marshal(map[string]interface{}{
			"type":  "world_update",
			"world": world,
		})
		fmt.Fprintf(w, "data: %s\n\n", string(data))
		flusher.Flush()
	}

	// Send simulation state
	data, _ := json.Marshal(map[string]interface{}{
		"type":         "simulation_state",
		"isSimulating": ws.IsSimulating(),
		"speed":        ws.GetSpeed(),
	})
	fmt.Fprintf(w, "data: %s\n\n", string(data))
	flusher.Flush()

	// Stream updates
	for {
		select {
		case msg := <-messageChan:
			fmt.Fprint(w, msg)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func (ws *WorldSimulator) handleGenerateMap(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		NumParcels int   `json:"numParcels"`
		Seed       int64 `json:"seed"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.NumParcels == 0 {
		req.NumParcels = 500
	}

	ws.Generate(1200, 800, req.NumParcels, req.Seed)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (ws *WorldSimulator) broadcastSimulationState() {
	ws.clientsMu.Lock()
	defer ws.clientsMu.Unlock()

	data, err := json.Marshal(map[string]interface{}{
		"type":         "simulation_state",
		"isSimulating": ws.IsSimulating(),
		"speed":        ws.GetSpeed(),
	})
	if err != nil {
		log.Printf("Error marshaling simulation state: %v", err)
		return
	}

	message := fmt.Sprintf("data: %s\n\n", string(data))
	for ch := range ws.clients {
		select {
		case ch <- message:
		default:
			// Skip if channel is full
		}
	}
}

func (ws *WorldSimulator) handleToggleSimulation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if ws.IsSimulating() {
		ws.StopSimulation()
	} else {
		ws.StartSimulation()
	}

	ws.broadcastSimulationState()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":       "ok",
		"isSimulating": ws.IsSimulating(),
	})
}

func (ws *WorldSimulator) handleSetSpeed(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Speed float64 `json:"speed"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	ws.SetSpeed(req.Speed)
	ws.broadcastSimulationState()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func main() {
	port := flag.Int("port", 8080, "Port to listen on")
	flag.Parse()

	simulator := NewWorldSimulator()

	// Generate initial map
	simulator.Generate(1200, 800, 500, 0)

	// Start simulation loop
	go simulator.Run()

	// Set up HTTP handlers
	http.HandleFunc("/api/sse", simulator.handleSSE)
	http.HandleFunc("/api/generate", simulator.handleGenerateMap)
	http.HandleFunc("/api/toggle-simulation", simulator.handleToggleSimulation)
	http.HandleFunc("/api/set-speed", simulator.handleSetSpeed)

	// Serve static files from dist directory
	fs := http.FileServer(http.Dir("./dist"))
	http.Handle("/", fs)

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Server starting on http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
