import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create earthquake icon with bright colors
const createEarthquakeIcon = (magnitude) => {
  const size = Math.max(30, magnitude * 12);
  
  let color, borderColor;
  
  if (magnitude >= 6) {
    color = '#ff0000'; // Bright Red
    borderColor = '#cc0000';
  } else if (magnitude >= 4) {
    color = '#ff9900'; // Bright Orange
    borderColor = '#cc6600';
  } else {
    color = '#00cc00'; // Bright Green
    borderColor = '#009900';
  }

  return L.divIcon({
    className: 'earthquake-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 4px solid ${borderColor};
        border-radius: 50%;
        box-shadow: 
          0 0 0 3px white,
          0 6px 20px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${Math.max(12, magnitude * 2)}px;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        cursor: pointer;
      ">${magnitude.toFixed(1)}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapView({ minMagnitude, earthquakeData, setEarthquakeData }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRealEarthquakeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching REAL earthquake data from USGS...');
        
        // Use multiple USGS endpoints to get more data
        const endpoints = [
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson'
        ];

        let allEarthquakes = [];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const earthquakes = data.features.map(feature => ({
                id: feature.id,
                magnitude: feature.properties.mag,
                place: feature.properties.place,
                time: new Date(feature.properties.time),
                coordinates: [
                  feature.geometry.coordinates[1], // latitude
                  feature.geometry.coordinates[0]  // longitude
                ],
                depth: feature.geometry.coordinates[2],
                url: feature.properties.url,
                type: feature.properties.type
              }));
              allEarthquakes = [...allEarthquakes, ...earthquakes];
            }
          } catch (endpointError) {
            console.warn(`Failed to fetch from ${endpoint}:`, endpointError);
          }
        }

        // Remove duplicates based on earthquake ID
        const uniqueEarthquakes = allEarthquakes.filter((eq, index, self) =>
          index === self.findIndex(e => e.id === eq.id)
        );

        console.log('Total unique earthquakes found:', uniqueEarthquakes.length);
        
        if (uniqueEarthquakes.length === 0) {
          throw new Error('No real earthquake data available from USGS');
        }

        setEarthquakeData(uniqueEarthquakes);
        
      } catch (error) {
        console.error('Error fetching real earthquake data:', error);
        setError(error.message);
        
        // Last resort: try the significant earthquakes endpoint
        try {
          const significantResponse = await fetch(
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson'
          );
          if (significantResponse.ok) {
            const significantData = await significantResponse.json();
            if (significantData.features && significantData.features.length > 0) {
              const significantEarthquakes = significantData.features.map(feature => ({
                id: feature.id,
                magnitude: feature.properties.mag,
                place: feature.properties.place,
                time: new Date(feature.properties.time),
                coordinates: [
                  feature.geometry.coordinates[1],
                  feature.geometry.coordinates[0]
                ],
                depth: feature.geometry.coordinates[2],
                url: feature.properties.url
              }));
              setEarthquakeData(significantEarthquakes);
              setError(null);
            }
          }
        } catch (finalError) {
          console.error('Final attempt failed:', finalError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRealEarthquakeData();
    
    // Refresh data every 2 minutes
    const interval = setInterval(fetchRealEarthquakeData, 120000);
    return () => clearInterval(interval);
  }, [setEarthquakeData]);

  // Filter earthquakes based on minimum magnitude
  const filteredEarthquakes = earthquakeData
    ? earthquakeData.filter(earthquake => earthquake.magnitude >= minMagnitude)
    : [];

  console.log('Displaying earthquakes:', filteredEarthquakes.length, 'with min magnitude:', minMagnitude);

  if (loading) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <span>Loading real-time earthquake data from USGS...</span>
      </div>
    );
  }

  if (error && (!earthquakeData || earthquakeData.length === 0)) {
    return (
      <div className="map-loading">
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌋</div>
          <h3>Real-time Data Unavailable</h3>
          <p>Unable to fetch live earthquake data from USGS.</p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '1rem' }}>
            This could be due to network issues or USGS service downtime.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-view">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]}
      >
        {/* Use OpenStreetMap tiles */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {/* Render real earthquake markers */}
        {filteredEarthquakes.map(earthquake => (
          <Marker
            key={earthquake.id}
            position={earthquake.coordinates}
            icon={createEarthquakeIcon(earthquake.magnitude)}
          >
            <Popup>
              <div style={{ 
                padding: '1rem', 
                minWidth: '300px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
              }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  color: '#ef4444',
                  fontSize: '1.3rem',
                  fontWeight: '800',
                  borderBottom: '3px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                  textAlign: 'center'
                }}>
                  🌋 Magnitude {earthquake.magnitude.toFixed(1)}
                </h3>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    📍 Location:
                  </strong>
                  <span style={{ color: '#6b7280', fontSize: '1rem', lineHeight: '1.4' }}>
                    {earthquake.place}
                  </span>
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    🕒 Time:
                  </strong>
                  <span style={{ color: '#6b7280', fontSize: '1rem' }}>
                    {earthquake.time.toLocaleString()}
                  </span>
                </div>
                
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    ⬇️ Depth:
                  </strong>
                  <span style={{ color: '#6b7280', fontSize: '1rem' }}>
                    {earthquake.depth.toFixed(1)} km
                  </span>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#374151', display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                    🔍 Type:
                  </strong>
                  <span style={{ color: '#6b7280', fontSize: '1rem' }}>
                    {earthquake.type || 'earthquake'}
                  </span>
                </div>
                
                <div style={{ 
                  padding: '0.75rem',
                  background: earthquake.magnitude >= 6 ? '#fef2f2' : 
                             earthquake.magnitude >= 4 ? '#fffbeb' : '#f0fdf4',
                  borderRadius: '8px',
                  borderLeft: `5px solid ${
                    earthquake.magnitude >= 6 ? '#ef4444' : 
                    earthquake.magnitude >= 4 ? '#f59e0b' : '#10b981'
                  }`,
                  textAlign: 'center'
                }}>
                  <strong style={{ 
                    color: earthquake.magnitude >= 6 ? '#dc2626' : 
                           earthquake.magnitude >= 4 ? '#d97706' : '#059669',
                    fontSize: '1rem',
                    fontWeight: '700'
                  }}>
                    {earthquake.magnitude >= 6 ? 'MAJOR EARTHQUAKE' : 
                     earthquake.magnitude >= 4 ? 'LIGHT EARTHQUAKE' : 'MINOR EARTHQUAKE'}
                  </strong>
                </div>

                {earthquake.url && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <a 
                      href={earthquake.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{
                        color: '#3b82f6',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}
                    >
                      🔗 View on USGS Website
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Legend */}
      <div className="map-legend">
        <h4>🌋 EARTHQUAKE MAGNITUDE</h4>
        <div className="legend-item">
          <div className="legend-color minor"></div>
          <span>Minor (&lt; 4.0)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color light"></div>
          <span>Light (4.0 - 5.9)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color major"></div>
          <span>Major (≥ 6.0)</span>
        </div>
        
        {/* Data source info */}
        <div style={{ 
          marginTop: '1rem', 
          paddingTop: '0.75rem', 
          borderTop: '1px solid rgba(255,255,255,0.2)',
          fontSize: '0.7rem',
          color: '#94a3b8',
          textAlign: 'center'
        }}>
          Real-time data from USGS
        </div>
      </div>

      {/* Data status indicator */}
      {earthquakeData && earthquakeData.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#10b981',
          fontSize: '0.8rem',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          ✅ Live Data: {earthquakeData.length} earthquakes
        </div>
      )}
    </div>
  );
}

export default MapView;