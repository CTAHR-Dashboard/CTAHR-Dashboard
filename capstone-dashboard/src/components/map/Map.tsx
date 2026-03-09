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
  selectedYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
}

export default function Map({
  mapType,
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

  const retrieveCommValues = (feature: any) => {
    // feature.properties.exchange_value is an array. Compute the array index that the specific combination of (year, species_group, ecosystem_type) corresponds to.

    // filter thru year
    let yearArrayIndices = []
    for (let ind = 0; ind < feature.properties.year.length; ind++) {
      if (feature.properties.year[ind] == selectedYear) {
        yearArrayIndices.push(ind)
      }
    }

    // filter thru species
    let speciesIndices = []
    for (let i = 0; i < yearArrayIndices.length; i++) {
      if (feature.properties.species_group[yearArrayIndices[i]] == selectedSpecies) {
        speciesIndices.push(yearArrayIndices[i])
      }
    }

    // filter thru ecosystem type
    let finalIndex = -1
    for (let i = 0; i < speciesIndices.length; i++) {
      if (feature.properties.ecosystem_type[speciesIndices[i]] == selectedEcosystem) {
        finalIndex = speciesIndices[i]
        break
      }
    }

    return feature.properties.exchange_value[finalIndex]
  }

  return (
    <div style = {{ height: "100vh" }}>
      {mapType == "comm" && <p>Filters applied: Year=<b>{selectedYear}</b>, Species=<b>{selectedSpecies}</b>, Ecosystem=<b>{selectedEcosystem}</b></p>}
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
            if (selectedCounty !== "" && feature.properties.county !== selectedCounty) {
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
              value = retrieveCommValues(feature)
              return {
                fillColor: "cornflowerblue",
                fillOpacity: 0.65,
                color: "#222",
                weight: 0.8,
              };
            }
          }}

          onEachFeature={(feature: any, layer: any) => {
            let value, tooltipContent;
            if (mapType == "noncomm") {
              value = feature.properties.total_exchange_value || 0;
              tooltipContent = `
                <div style="font-size:13px">
                  <strong>County/Moku: ${feature.properties.county}</strong><br/>
                  Exchange Value: ${formatCurrency(value)}<br/>
                  Year: ${selectedYear ?? "All Years"}<br/>
                  Species: ${selectedSpecies || "All"}<br/>
                  Ecosystem: ${selectedEcosystem || "All"}
                </div>
              `
            } else {
              value = retrieveCommValues(feature)
              console.log("the value is: " + value)
              tooltipContent = `
                <div style="font-size:13px">
                  <strong>Moku: ${feature.properties.area_id}</strong><br/>
                  Exchange Value: ${formatCurrency(value)}<br/>
                  Year: ${selectedYear ?? "All Years"}<br/>
                  Species: ${selectedSpecies || "All"}<br/>
                  Ecosystem: ${selectedEcosystem || "All"}
                </div>
              `
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
