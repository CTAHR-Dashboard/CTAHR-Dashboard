//Rendering map component, styles for choropleth, and tooltip content. Uses quantiles for color scaling.
"use client";

import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";

interface MapProps {
  mapType?: string;
  geoData: any;
  selectedCounty: string;
  selectedYearStart: number | null;
  selectedYearEnd: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
  onCountyClick?: (county: string) => void;
}

export default function Map({
  mapType,
  geoData,
  selectedCounty,
  selectedYearStart,
  selectedYearEnd,
  selectedSpecies,
  selectedEcosystem,
  onCountyClick,
}: MapProps) {
  // Center between Big Island (-155.5W) and Kauai (-159.5W), midpoint lat of island chain
  const position: LatLngExpression = [20.5, -157.5];

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
    <div style={{ height: "100vh" }}>
      <MapContainer
        center={position}
        zoom={7}
        zoomControl={false}
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          attribution="Tiles &copy; Esri"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <ZoomControl position="topright" />

        {/* Re-render GeoJSON layer whenever data or filters change */}
        <GeoJSON
          key={JSON.stringify(geoData)}
          data={geoData}
          style={(feature: any) => {
            const value = feature.properties.total_exchange_value || 0;
            const featureKey = mapType === "comm"
              ? feature.properties.area_id
              : feature.properties.county;

            const isSelected = selectedCounty !== "" && featureKey === selectedCounty;

            return {
              fillColor: getColor(value),
              fillOpacity: isSelected ? 0.9 : 0.55,
              color: isSelected ? "#d94801" : "#222",
              weight: isSelected ? 2.5 : 0.8,
            };
          }}
          onEachFeature={(feature: any, layer: any) => {
            const value = feature.properties.total_exchange_value || 0;
            const label = mapType === "comm"
              ? `Moku: ${feature.properties.area_id}`
              : `County: ${feature.properties.county}`;

            const tooltipContent = `
              <div style="font-size:13px">
                <strong>${label}</strong><br/>
                Exchange Value: ${formatCurrency(value)}<br/>
                Year: ${selectedYearStart || selectedYearEnd ? `${selectedYearStart ?? "start"} – ${selectedYearEnd ?? "end"}` : "All Years"}<br/>
                Species: ${selectedSpecies || "All"}<br/>
                Ecosystem: ${selectedEcosystem || "All"}
              </div>
            `;

            layer.bindTooltip(tooltipContent, { sticky: true });

            layer.on({
              click: () => {
                const key = mapType === "comm"
                  ? feature.properties.area_id
                  : feature.properties.county;
                onCountyClick?.(key);
              },
              mouseover: (e: any) => {
                e.target.setStyle({ fillOpacity: 0.85 });
              },
              mouseout: (e: any) => {
                const featureKey = mapType === "comm"
                  ? feature.properties.area_id
                  : feature.properties.county;
                const isSelected = selectedCounty !== "" && featureKey === selectedCounty;
                e.target.setStyle({ fillOpacity: isSelected ? 0.9 : 0.55 });
              },
            });
          }}
        />
      </MapContainer>
    </div>
  );
}
