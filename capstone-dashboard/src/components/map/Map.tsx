//Rendering map component, styles for choropleth, and tooltip content. Uses quantiles for color scaling.
"use client";

import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";

interface MapProps {
  geoData: any;
  selectedCounty: string;
  selectedYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
}

export default function Map({
  geoData,
  selectedCounty,
  selectedYear,
  selectedSpecies,
  selectedEcosystem,
}: MapProps) {
  const position: LatLngExpression = [20.81, -158.75];

  // ----------------------------------
  // Quantile Calculation
  // ----------------------------------
  const values = useMemo(() => {
    return geoData.features.map(
      (f: any) => f.properties.total_exchange_value || 0
    );
  }, [geoData]);

  const sorted = [...values].sort((a, b) => a - b);

  const q1 = sorted[Math.floor(sorted.length * 0.2)] || 0;
  const q2 = sorted[Math.floor(sorted.length * 0.4)] || 0;
  const q3 = sorted[Math.floor(sorted.length * 0.6)] || 0;
  const q4 = sorted[Math.floor(sorted.length * 0.8)] || 0;

  const getColor = (value: number) => {
  if (value > q4) return "#7f0000";
  if (value > q3) return "#970d0d";
  if (value > q2) return "#892718";
  if (value > q1) return "#fc8d59";
  return "#fdd49e";
};

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <MapContainer
      center={position}
      zoom={6.5}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />

      <ZoomControl position="topright" />

      <GeoJSON
        key={JSON.stringify(geoData)} // forces re-render on filter change
        data={geoData}
        style={(feature: any) => {
          const value = feature.properties.total_exchange_value || 0;

          if (
            selectedCounty !== "" &&
            feature.properties.county !== selectedCounty
          ) {
            return { fillOpacity: 0, opacity: 0 };
          }

          return {
            fillColor: getColor(value),
            fillOpacity: 0.65,
            color: "#222",
            weight: 0.8,
          };
        }}
        onEachFeature={(feature, layer) => {
          const value = feature.properties.total_exchange_value || 0;

          const tooltipContent = `
            <div style="font-size:13px">
              <strong>County: ${feature.properties.county}</strong><br/>
              Exchange Value: ${formatCurrency(value)}<br/>
              Year: ${selectedYear ?? "All Years"}<br/>
              Species: ${selectedSpecies || "All"}<br/>
              Ecosystem: ${selectedEcosystem || "All"}
            </div>
          `;

          layer.bindTooltip(tooltipContent, { sticky: true });

          layer.on({
            mouseover: (e: any) => {
              e.target.setStyle({ fillOpacity: 0.8 });
            },
            mouseout: (e: any) => {
              e.target.setStyle({ fillOpacity: 0.65 });
            },
          });
        }}
      />
    </MapContainer>
  );
}
