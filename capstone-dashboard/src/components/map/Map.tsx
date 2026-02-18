"use client";

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapProps {
    geoData: any;
    selectedCounty: string;
}

export default function Map({ geoData, selectedCounty }: MapProps) {
    const position: LatLngExpression = [20.8, -156.5];

    return (
        <MapContainer
            center={position}
            zoom={7}
            style={{ height: "100%", width: "100%" }}
        >
            <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            <GeoJSON
                data={geoData}
                style={(feature: any) => {
                    const value = feature.properties.exchange_value;

                    // If a county is selected and this feature is NOT it → hide completely
                    if (
                        selectedCounty !== "" &&
                        feature.properties.county !== selectedCounty
                    ) {
                        return {
                            fillOpacity: 0,
                            opacity: 0,
                        };
                    }

                    // Otherwise style normally
                    let fillColor = "#FC4E2A";

                    if (value > 500000) fillColor = "#800026";
                    else if (value > 250000) fillColor = "#E31A1C";

                    return {
                        color: "#ffffff",
                        weight: 1,
                        fillColor,
                        fillOpacity: 0.8,
                    };
                }}
            />

        </MapContainer>
    );
}
