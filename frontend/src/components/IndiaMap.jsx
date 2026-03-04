import React, { useState, memo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

// Using the locally downloaded topojson
const INDIA_TOPO_JSON = "/india-states.json";

const IndiaMap = ({ selectedState, onStateClick }) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // THE FIX: Adjusted center to [80, 22] to pull the map down into the frame
  // and bumped scale slightly for a better fit.
  const PROJECTION_CONFIG = {
    scale: 1150,
    center: [80, 21] 
  };

  const HOVER_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"
  ];

  const handleMouseEnter = (geo, e) => {
    // The property names in this specific geojson
    const stateName = geo.properties.name;
    setTooltipContent(stateName);
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent("");
  };

  const handleClick = (geo) => {
    const stateName = geo.properties.name;
    if (onStateClick) {
      onStateClick(stateName);
    }
  };

  return (
    <div className="india-map-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* THE FIX: Expanded the internal SVG viewBox to 800x800 so the edges don't crop */}
      <ComposableMap
        projectionConfig={PROJECTION_CONFIG}
        projection="geoMercator"
        width={800}
        height={800}
        style={{ width: "100%", height: "100%", maxHeight: "100%", maxWidth: "100%" }}
      >
        <Geographies geography={INDIA_TOPO_JSON}>
          {({ geographies }) =>
            geographies.map((geo, index) => {
              const stateName = geo.properties.name;
              const isSelected = selectedState === stateName;
              const hoverColor = HOVER_COLORS[index % HOVER_COLORS.length];

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(e) => handleMouseEnter(geo, e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleClick(geo)}
                  onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}
                  style={{
                    default: {
                      fill: isSelected ? "var(--primary)" : "var(--map-default, #cbd5e1)",
                      outline: "none",
                      stroke: "var(--map-stroke, #94a3b8)",
                      strokeWidth: 0.8,
                      transition: "all 250ms ease"
                    },
                    hover: {
                      fill: isSelected ? "var(--primary)" : hoverColor,
                      outline: "none",
                      stroke: "var(--primary)",
                      strokeWidth: 1.5,
                      cursor: "pointer",
                      transition: "all 200ms ease",
                      filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))"
                    },
                    pressed: {
                      fill: "var(--primary)",
                      outline: "none",
                      stroke: "#ffffff"
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
      
      {/* Absolute Tooltip */}
      {tooltipContent && (
        <div
          style={{
            position: "fixed",
            top: position.y + 10,
            left: position.x + 10,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "14px",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default memo(IndiaMap);