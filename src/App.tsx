import { useState } from 'react'
import type { FeatureCollection, Polygon } from 'geojson'
import './App.css'
import MapRenderer from './components/MapRenderer'
import { generateMap } from './utils/mapGenerator'
import type { TerrainProperties } from './types/terrain'

function App() {
  const [mapData, setMapData] = useState<FeatureCollection<Polygon, TerrainProperties>>(() => 
    generateMap({
      width: 50,
      height: 40,
      continentCount: 3,
      islandCount: 8,
      mountainDensity: 0.15,
      riverCount: 5,
      resourceDensity: 0.3,
      seed: Date.now(),
    })
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateMap = () => {
    setIsGenerating(true)
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const newMap = generateMap({
        width: 50,
        height: 40,
        continentCount: 3,
        islandCount: 8,
        mountainDensity: 0.15,
        riverCount: 5,
        resourceDensity: 0.3,
        seed: Date.now(),
      })
      setMapData(newMap)
      setIsGenerating(false)
    }, 100)
  }

  const handleTileClick = (tileId: string) => {
    console.log('Clicked tile:', tileId)
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>🌍 Civilization Map Generator</h1>
        <button 
          onClick={handleGenerateMap} 
          disabled={isGenerating}
          className="generate-button"
        >
          {isGenerating ? 'Generating...' : 'Generate New Map'}
        </button>
      </div>

      {isGenerating ? (
        <div className="loading">Generating map...</div>
      ) : (
        <MapRenderer mapData={mapData} onTileClick={handleTileClick} />
      )}
    </div>
  )
}

export default App
