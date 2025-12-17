# Quick Start Guide

Get the Civilization simulation running in 3 simple steps!

## Prerequisites

- Node.js 18+ installed
- npm or yarn installed

## Step 0: Install All Dependencies

```bash
# Single command installs everything (monorepo)
npm install
```

This installs dependencies for frontend, backend, map-generator-cli, and shared package.

## Step 1: Generate a Map

```bash
# Generate a default map
cd map-generator-cli
npm run dev

# This creates: map-generator-cli/maps/default-map.json
```

**Optional:** Generate a custom map:
```bash
npm run dev -- --width 1600 --height 1200 --parcels 800 --seed 12345 --output custom-map.json
```

## Step 2: Start the Backend

```bash
# Copy the generated map
cd ..
mkdir -p backend/maps
cp map-generator-cli/maps/default-map.json backend/maps/

# Start the backend server
cd backend
npm run dev
```

The backend will start on http://localhost:3001

**Backend API endpoints:**
- Health check: `GET /health`
- SSE stream: `GET /events`
- Status: `GET /api/status`
- Start simulation: `POST /api/simulation/start`
- Stop simulation: `POST /api/simulation/stop`

## Step 3: Start the Frontend

In a new terminal:

```bash
# Return to root directory (if not already there)
cd /path/to/civilization

# Create environment file
echo "VITE_BACKEND_URL=http://localhost:3001" > frontend/.env

# Start the frontend
npm run dev:frontend
```

The frontend will start on http://localhost:5173

## Quick Test

Test the backend API:

```bash
# Check health
curl http://localhost:3001/health

# Check status
curl http://localhost:3001/api/status

# Start simulation
curl -X POST http://localhost:3001/api/simulation/start

# Stop simulation
curl -X POST http://localhost:3001/api/simulation/stop

# Change speed (backend only)
curl -X POST http://localhost:3001/api/simulation/speed \
  -H "Content-Type: application/json" \
  -d '{"speed": 2.0}'
```

## What You Should See

1. **Backend Terminal**: 
   - "Map loaded successfully: X parcels"
   - "SSE broadcasting started"
   - "Simulation started" (after API call)

2. **Frontend Browser**:
   - Connected status indicator (green dot)
   - Map with colored terrain parcels
   - Resources shown as small colored dots
   - Click parcels to see details

## Common Issues

### Backend won't start
- **Issue:** Port 3001 already in use
- **Solution:** Stop other processes on port 3001 or change PORT in backend/.env

### Frontend can't connect
- **Issue:** Connection error in browser console
- **Solution:** Check that backend is running and VITE_BACKEND_URL in .env is correct

### No map loaded
- **Issue:** Backend says "No maps found"
- **Solution:** Run map generator first to create default-map.json

### Simulation not updating
- **Issue:** State not changing
- **Solution:** Start simulation via API: `curl -X POST http://localhost:3001/api/simulation/start`

## Next Steps

- **Generate different maps**: Try different seeds and parcel counts
- **Control simulation**: Use API to start/stop and adjust speed
- **Multiple terminals**: Keep backend, frontend, and API testing separate
- **Read documentation**: See ARCHITECTURE.md for detailed explanation

## Development Tips

### Backend Development
```bash
cd backend
npm run dev  # Auto-restarts on file changes
```

### Frontend Development
```bash
npm run dev  # Hot reload on file changes
```

### Map Generation
```bash
cd map-generator-cli
npm run dev -- -w 800 -h 600 -p 200 -o test.json  # Quick small map
```

## Production Deployment

### Build All Components

```bash
# Build map generator
cd map-generator-cli
npm run build

# Build backend
cd ../backend
npm run build

# Build frontend
cd ..
npm run build
```

### Run in Production

```bash
# Start backend
cd backend
npm start

# Serve frontend (using any static server)
cd ..
npx serve -s dist
```

## Architecture Summary

```
Map Generator (CLI) → Maps (JSON) → Backend Server → SSE Stream → Frontend (Browser)
                                        ↓
                                    REST API
                                    (Control)
```

- **Map Generator**: Offline tool, creates maps
- **Backend**: Runs simulation, broadcasts via SSE
- **Frontend**: Displays state, read-only

## Resources

- Full Architecture: See `ARCHITECTURE.md`
- Technical Details: See `DOCUMENTATION.md`
- Backend API: See `backend/README.md`
- Map Generator: See `map-generator-cli/README.md`

## Support

If you encounter issues:

1. Check all dependencies are installed: `npm install`
2. Verify backend is running: `curl http://localhost:3001/health`
3. Check browser console for errors
4. Ensure map file exists: `ls backend/maps/`
5. Review logs in backend terminal

Happy simulating! 🗺️
