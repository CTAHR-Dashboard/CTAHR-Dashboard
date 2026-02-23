"use client";

import { useEffect, useState } from "react";
import Map from "../map/Map";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";

interface DashboardProps {
    geoJsonPath: string;
    datasetLabel: string;
}

export default function EcosystemDashboard({
    geoJsonPath,
    datasetLabel,
}: DashboardProps) {
    const [geoData, setGeoData] = useState<any>(null);

    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedCounty, setSelectedCounty] = useState("");
    const [selectedSpecies, setSelectedSpecies] = useState("");
    const [selectedEcosystem, setSelectedEcosystem] = useState("");

    useEffect(() => {
        fetch(geoJsonPath)
            .then((res) => res.json())
            .then((data) => {
                setGeoData(data);

                const first = data.features[0]?.properties;
                setSelectedYear(null);
                setSelectedSpecies(first?.species_group || "");
                setSelectedEcosystem(first?.ecosystem_type || "");
            });
    }, [geoJsonPath]);

    if (!geoData) return <div>Loading {datasetLabel}...</div>;

    // ----------------------------
    // Extract unique filter values
    // ----------------------------
    const counties = [
        ...new Set(geoData.features.map((f: any) => f.properties.county)),
    ];

    const years = [
        ...new Set(geoData.features.map((f: any) => f.properties.year)),
    ].sort();

    const speciesGroups = [
        ...new Set(geoData.features.map((f: any) => f.properties.species_group)),
    ];

    const ecosystemTypes = [
        ...new Set(geoData.features.map((f: any) => f.properties.ecosystem_type)),
    ];

    // ----------------------------
    // FILTER
    // ----------------------------
    const filteredFeatures = geoData.features.filter((f: any) => {
        return (
            (selectedYear === null || f.properties.year === selectedYear) &&
            (selectedSpecies === "" ||
                f.properties.species_group === selectedSpecies) &&
            (selectedEcosystem === "" ||
                f.properties.ecosystem_type === selectedEcosystem)
        );
    });

    // ----------------------------
    // AGGREGATE BY COUNTY
    // ----------------------------
    const totalsByCounty: Record<string, number> = {};

    filteredFeatures.forEach((f: any) => {
        const county = f.properties.county;
        const value = Number(f.properties.exchange_value) || 0;

        totalsByCounty[county] =
            (totalsByCounty[county] || 0) + value;
    });

    // ----------------------------
    // ATTACH TOTALS TO POLYGONS
    // ----------------------------
    const aggregatedFeatures = geoData.features.map((feature: any) => {
        const county = feature.properties.county;

        return {
            ...feature,
            properties: {
                ...feature.properties,
                total_exchange_value: totalsByCounty[county] || 0,
            },
        };
    });

    const aggregatedGeoJSON = {
        ...geoData,
        features: aggregatedFeatures,
    };

    return (
        <div className="dashboard-container">
            <FilterSidebar
                datasetLabel={datasetLabel}
                counties={counties}
                years={years}
                speciesGroups={speciesGroups}
                ecosystemTypes={ecosystemTypes}
                selectedCounty={selectedCounty}
                selectedYear={selectedYear}
                selectedSpecies={selectedSpecies}
                selectedEcosystem={selectedEcosystem}
                setSelectedCounty={setSelectedCounty}
                setSelectedYear={setSelectedYear}
                setSelectedSpecies={setSelectedSpecies}
                setSelectedEcosystem={setSelectedEcosystem}
            />

            <div className="map-wrapper">
                <Map
                    geoData={aggregatedGeoJSON}
                    selectedCounty={selectedCounty}
                    selectedYear={selectedYear}
                    selectedSpecies={selectedSpecies}
                    selectedEcosystem={selectedEcosystem}
                />
            </div>
        </div>
    );
}