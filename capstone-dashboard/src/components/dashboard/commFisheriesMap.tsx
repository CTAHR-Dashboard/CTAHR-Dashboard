/*
 * Standalone prototype dashboard for the commercial fisheries dataset.
 * Fetches the commercial exchange value GeoJSON and renders it directly in
 * the Map component with hardcoded filters. This was an early proof-of-concept
 * and is no longer wired into the main app.
 */
"use client";

import { useState, useEffect } from 'react';
import Map from "../map/Map";
import type { DashboardGeoJSON } from "../map/Map";

export default function CommFisheriesDashboard() {

    const [jsonData, setJsonData] = useState<DashboardGeoJSON | null>(null)
    const [dataLoaded, setDataLoaded] = useState(false)

    useEffect(() => {
        // fetch function goes here,
        fetch("fisheriesdata/20260126_comm_ev_byMoku.geojson")
        .then((response) => response.json())
        .then((data) => {
            setJsonData(data)
            setDataLoaded(true)
            console.log(data)
        })
    }, [])

    return(
        <div style={{height: "100vh"}}>
            {dataLoaded && jsonData && <Map
                mapType='comm'
                geoData={jsonData}
                selectedCounty=""
                selectedYearStart={2020}
                selectedYearEnd={2020}
                selectedSpecies="Shallow Bottomfish"
                selectedEcosystem="Inshore — Reef"
            />} 
        </div>
    );
}
