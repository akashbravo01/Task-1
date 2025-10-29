import React, { useState } from "react";
import MapView from "./components/MapView";
import Controls from "./components/Controls";
import "./App.css";

function App() {
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [earthquakeData, setEarthquakeData] = useState(null);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="earth-logo">🌍</div>
            <div className="text-content">
              <h1 className="header-title">Earthquake Visualizer</h1>
              <p className="header-subtitle">Real-time seismic activity monitoring</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="map-container">
          <MapView 
            minMagnitude={minMagnitude}
            earthquakeData={earthquakeData}
            setEarthquakeData={setEarthquakeData}
          />
          <Controls 
            setMinMagnitude={setMinMagnitude} 
            currentMagnitude={minMagnitude}
            earthquakeData={earthquakeData}
          />
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <span className="footer-link">USGS Earthquake Data</span>
            <span className="footer-link">Updated every 2 minutes</span>
          </div>
          <div>
            <span>Built by </span>
            <span className="credits-highlight">Akash L</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;