"use client";

import { useState, useEffect, Component } from 'react';
import Map from "../map/Map";

// I DON'T CARE ABOUT TYPESCRIPT. THIS WORKS!
export default function CommFisheriesDashboard() {

    const [jsonData, setJsonData] = useState({})
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
            {dataLoaded && <Map
                mapType='comm'
                geoData={jsonData}
                selectedCounty=""
                selectedYear={2020}
                selectedSpecies="Shallow Bottomfish"
                selectedEcosystem="Inshore — Reef"
            />} 
        </div>
    );
}