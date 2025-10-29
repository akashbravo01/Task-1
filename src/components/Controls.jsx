import React from "react";

function Controls({ setMinMagnitude, currentMagnitude, earthquakeData }) {
  const handleChange = (e) => {
    setMinMagnitude(Number(e.target.value));
  };

  const totalEarthquakes = earthquakeData ? earthquakeData.length : 0;
  const visibleEarthquakes = earthquakeData 
    ? earthquakeData.filter(eq => eq.magnitude >= currentMagnitude).length
    : 0;

  const magnitudeOptions = [
    { value: "0", label: "All Earthquakes", description: "Show all seismic activity" },
    { value: "2", label: "Magnitude ≥ 2.0", description: "Minor earthquakes and above" },
    { value: "3", label: "Magnitude ≥ 3.0", description: "Noticeable seismic activity" },
    { value: "4", label: "Magnitude ≥ 4.0", description: "Light earthquakes and above" },
    { value: "5", label: "Magnitude ≥ 5.0", description: "Moderate to major events" },
    { value: "6", label: "Magnitude ≥ 6.0", description: "Strong earthquakes only" },
    { value: "7", label: "Magnitude ≥ 7.0", description: "Major seismic events" }
  ];

  const selectedOption = magnitudeOptions.find(opt => opt.value === currentMagnitude.toString()) || magnitudeOptions[0];

  return (
    <div className="controls">
      <div className="controls-header">
        <h3 className="controls-title">Seismic Monitor</h3>
        <label className="controls-label">MINIMUM MAGNITUDE</label>
      </div>
      
      <select 
        className="controls-select"
        onChange={handleChange}
        value={currentMagnitude}
      >
        {magnitudeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="controls-info">
        {selectedOption.description}
      </div>

      <div className="controls-stats">
        <div className="controls-stat">
          <span className="controls-stat-value">{totalEarthquakes}</span>
          <span className="controls-stat-label">TOTAL</span>
        </div>
        <div className="controls-stat">
          <span className="controls-stat-value">{visibleEarthquakes}</span>
          <span className="controls-stat-label">VISIBLE</span>
        </div>
        <div className="controls-stat">
          <span className="controls-stat-value">
            {totalEarthquakes > 0 ? Math.round((visibleEarthquakes / totalEarthquakes) * 100) : 0}%
          </span>
          <span className="controls-stat-label">SHOWING</span>
        </div>
      </div>
    </div>
  );
}

export default Controls;