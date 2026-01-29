import React from 'react';

const UKHeatmap = ({ results, onRegionClick }) => {
  if (!results) return null;

  // Get min and max CO2 values for color scaling
  const co2Values = results.map(r => parseFloat(r.co2Kg));
  const minCO2 = Math.min(...co2Values);
  const maxCO2 = Math.max(...co2Values);

  // Function to get color based on CO2 value (green to red scale)
  const getColor = (co2Kg) => {
    const value = parseFloat(co2Kg);
    const normalized = (value - minCO2) / (maxCO2 - minCO2);
    
    // Color scale from green (low) to yellow to red (high)
    if (normalized < 0.5) {
      // Green to yellow
      const ratio = normalized * 2;
      return `rgb(${Math.round(100 + ratio * 155)}, ${Math.round(180 + ratio * 75)}, 80)`;
    } else {
      // Yellow to red
      const ratio = (normalized - 0.5) * 2;
      return `rgb(${Math.round(255)}, ${Math.round(255 - ratio * 100)}, ${Math.round(80 - ratio * 80)})`;
    }
  };

  // Simplified UK regions with approximate positions and sizes
  // Updated to match official Carbon Intensity API region names (excluding aggregate regions)
  const regionPaths = {
    'North Scotland': { x: 200, y: 30, width: 180, height: 120 },
    'South Scotland': { x: 200, y: 150, width: 180, height: 100 },
    'North West England': { x: 180, y: 280, width: 120, height: 100 },
    'North East England': { x: 320, y: 250, width: 100, height: 100 },
    'South Yorkshire': { x: 300, y: 350, width: 100, height: 80 },
    'North Wales, Merseyside and Cheshire': { x: 150, y: 360, width: 130, height: 80 },
    'South Wales': { x: 150, y: 440, width: 100, height: 80 },
    'West Midlands': { x: 240, y: 430, width: 90, height: 90 },
    'East Midlands': { x: 330, y: 430, width: 90, height: 90 },
    'East England': { x: 380, y: 490, width: 100, height: 100 },
    'South West England': { x: 180, y: 540, width: 120, height: 100 },
    'South England': { x: 280, y: 590, width: 100, height: 70 },
    'London': { x: 340, y: 560, width: 70, height: 50 },
    'South East England': { x: 380, y: 590, width: 100, height: 70 }
  };

  return (
    <div className="heatmap-container">
      <svg
        viewBox="0 0 500 700"
        className="uk-map"
        role="img"
        aria-label="UK regions heatmap showing CO2 emissions"
      >
          <title>UK CO₂ Emissions Heatmap</title>
          <desc>Visual representation of CO₂ emissions across UK regions</desc>
          
          {/* Background map image */}
          <defs>
            <pattern id="ukMapBackground" x="0" y="0" width="500" height="700" patternUnits="userSpaceOnUse">
              <image
                href="https://upload.wikimedia.org/wikipedia/commons/3/3f/United_Kingdom_location_map.svg"
                x="0"
                y="0"
                width="500"
                height="700"
                opacity="0.3"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          </defs>
          
          {/* Background rectangle with map image */}
          <rect x="0" y="0" width="500" height="700" fill="url(#ukMapBackground)" />
          
          {results.map((region) => {
          const path = regionPaths[region.name];
          if (!path) return null;
          
          const color = getColor(region.co2Kg);
          
          return (
            <g
              key={region.name}
              onClick={() => onRegionClick && onRegionClick(region.name)}
              className={onRegionClick ? 'region-group-clickable' : 'region-group'}
            >
              <rect
                x={path.x}
                y={path.y}
                width={path.width}
                height={path.height}
                fill={color}
                fillOpacity="0.75"
                stroke="var(--cds-border-strong)"
                strokeWidth="2"
                rx="8"
                className="region-rect"
                role="button"
                tabIndex="0"
                aria-label={`${region.name}: ${region.co2Kg} kg CO₂ per year. Click for generation mix details.`}
                onKeyPress={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onRegionClick) {
                    onRegionClick(region.name);
                  }
                }}
              >
                <title>{region.name}: {region.co2Kg} kg CO₂/year. Click for details.</title>
              </rect>
              <text
                x={path.x + path.width / 2}
                y={path.y + path.height / 2 - 10}
                textAnchor="middle"
                className="region-label"
                fill="var(--cds-text-primary)"
                fontSize="12"
                fontWeight="600"
              >
                {region.name}
              </text>
              <text
                x={path.x + path.width / 2}
                y={path.y + path.height / 2 + 10}
                textAnchor="middle"
                className="region-value"
                fill="var(--cds-text-primary)"
                fontSize="11"
              >
                {region.co2Kg} kg
              </text>
            </g>
          );
        })}
      </svg>
      
      <div className="legend" role="img" aria-label="Color scale legend">
        <div className="legend-title">CO₂ Emissions (kg/year)</div>
        <div className="legend-scale">
          <div className="legend-gradient"></div>
          <div className="legend-labels">
            <span>{minCO2.toFixed(0)}</span>
            <span>{((minCO2 + maxCO2) / 2).toFixed(0)}</span>
            <span>{maxCO2.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UKHeatmap;

// Made with Bob
