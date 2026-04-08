//Rendering map component, styles for choropleth, and tooltip content. Uses quantiles for color scaling.
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, ZoomControl } from "react-leaflet";

// dynamic(() => import("./react-leaflet/hooks"), { ssr:false })
import type { LatLngExpression } from "leaflet";
import { useMemo, useState, useEffect } from "react";

interface MapProps {
  geoData: any;
  selectedCounty: string;
  selectedYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
}

export default function CommMap({
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
        if (value > q4) return "#ff3700";
        if (value > q3) return "#f75e34";
        if (value > q2) return "#fc744e";
        if (value > q1) return "#fa8e70";
        if (value != 0) return "#f7a28b";
        return "#918a87";
    };

    console.log("Yes, geodata has changed")

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div style = {{ height: "100vh" }}>
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
                    const value = feature.properties.total_exchange_value 
                    return {
                        fillColor: getColor(value),
                        fillOpacity: 0.9,
                        color: "#222",
                        weight: 0.8,
                    };
                }}

                onEachFeature={(feature: any, layer: any) => {
                    let value, tooltipContent;

                    // if it's commercial - this is Micaiah's code.
                    // value = retrieveCommValues(feature)
                    value = feature.properties.total_exchange_value
                    console.log(value)
                    tooltipContent = `
                    <div style="font-size:15px">
                        <strong>Location: ${feature.properties.area_id}</strong><br/>
                        Total EV: ${formatCurrency(value)}*<br/>
                        Year: ${selectedYear ?? "All Years"}<br/>
                        Species: ${selectedSpecies || "All"}<br/>
                        Ecosystem: ${selectedEcosystem || "All"}
                    </div>
                    `

                    layer.bindTooltip(tooltipContent, { sticky: true });

                    layer.on({
                    mouseover: (e: any) => {
                        e.target.setStyle({ fillOpacity: 1.0, weight: 2.5, color: "black" });
                    },
                    mouseout: (e: any) => {
                        e.target.setStyle({ fillOpacity: 0.9, weight: 0.8, color: "#222",});
                    },
                    });
                }}
                />
            </MapContainer>
        </div>
    );
}
