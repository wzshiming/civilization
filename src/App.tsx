import './App.css'
import InteractiveMap from './components/InteractiveMap'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Civilization - Interactive Territory Map</h1>
        <p>Click on territories to view details, hover for quick info, and use the lock button to control zoom and drag</p>
      </header>
      <main className="app-main">
        <InteractiveMap />
      </main>
    </div>
  )
}

export default App
