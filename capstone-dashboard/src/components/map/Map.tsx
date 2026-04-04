//Rendering map component, styles for choropleth, and tooltip content. Uses quantiles for color scaling.
"use client";

import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";

interface MapProps {
  mapType: string;
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

  const retrieveCommValues = (feature: any) => {
    // feature.properties.exchange_value is an array. Compute the array index that the specific combination of (year, species_group, ecosystem_type) corresponds to.

    // 🔥 SAFETY CHECK
    if (!feature?.properties?.year) return 0;

    let total = 0;

    for (let i = 0; i < feature.properties.year.length; i++) {
      const year = feature.properties.year[i];
      const species = feature.properties.species_group[i];
      const ecosystem = feature.properties.ecosystem_type[i];
      const value = feature.properties.exchange_value[i];

      // filter thru year (NOW RANGE)
      const yearMatch =
        (!selectedYearStart || year >= selectedYearStart) &&
        (!selectedYearEnd || year <= selectedYearEnd);

      // filter thru species
      const speciesMatch =
        !selectedSpecies || species === selectedSpecies;

      // filter thru ecosystem type
      const ecosystemMatch =
        !selectedEcosystem || ecosystem === selectedEcosystem;

      if (yearMatch && speciesMatch && ecosystemMatch) {
        total += value || 0;
      }
    }

    return total;
  };

  return (
    <div style={{ height: "100vh" }}>
      {mapType == "comm" && (
        <p style={{ color: "red" }}>
          Filters applied: Year=<b>{selectedYearStart} - {selectedYearEnd}</b>,
          Species=<b>{selectedSpecies}</b>, Ecosystem=
          <b>{selectedEcosystem}</b>
        </p>
      )}

      <MapContainer
        center={position}
        zoom={6.5}
        zoomControl={false}
        style={{ height: "100vh", width: "100%" }}
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
            let value;

            if (
              selectedCounty !== "" &&
              feature.properties.county !== selectedCounty
            ) {
              return { fillOpacity: 0, opacity: 0 };
            }

            if (mapType == "noncomm") {
              // if the map type is noncommercial, the passed data is already filtered by Pelita's EcosystemDashboard.tsx file.
              value = feature.properties.total_exchange_value || 0;
              return {
                fillColor: getColor(value),
                fillOpacity: 0.65,
                color: "#222",
                weight: 0.8,
              };
            } else {
              // if the map type is commercial, the passed data is not filtered. Conduct the filtering.
              value = retrieveCommValues(feature);
              return {
                fillColor: getColor(value), // 🔥 changed from static color
                fillOpacity: 0.65,
                color: "#222",
                weight: 0.8,
              };
            }
          }}

          onEachFeature={(feature: any, layer: any) => {
            let value, tooltipContent;

            if (mapType == "noncomm") {
              // if it's non-commercial - this is Pelita's code.
              value = feature.properties.total_exchange_value || 0;
              tooltipContent = `
                <div style="font-size:13px">
                  <strong>County/Moku: ${feature.properties.county}</strong><br/>
                  Exchange Value: ${formatCurrency(value)}<br/>
                  Year: ${selectedYearStart ?? "All Years"} - ${selectedYearEnd ?? ""}<br/>
                  Species: ${selectedSpecies || "All"}<br/>
                  Ecosystem: ${selectedEcosystem || "All"}
                </div>
              `;
            } else {
              // if it's commercial - this is Micaiah's code.
              value = retrieveCommValues(feature);
              tooltipContent = `
                <div style="font-size:13px">
                  <strong>Moku: ${feature.properties.area_id}</strong><br/>
                  Exchange Value: ${formatCurrency(value)}<br/>
                  Year: ${selectedYearStart ?? "All Years"} - ${selectedYearEnd ?? ""}<br/>
                  Species: ${selectedSpecies || "All"}<br/>
                  Ecosystem: ${selectedEcosystem || "All"}
                </div>
              `;
            }

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
    </div>
  );
}

/*
 */