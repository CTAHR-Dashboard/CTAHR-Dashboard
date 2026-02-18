"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Map() {
    const position: LatLngExpression = [20.954234, -158.705777];

    return (
        <MapContainer
            center={position}
            zoom={7}
            style={{ height: "100vh", width: "100%" }}
        >
            <TileLayer
                attribution='Tiles &copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
        </MapContainer>
    );
}
