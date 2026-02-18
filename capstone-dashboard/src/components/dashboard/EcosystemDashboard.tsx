"use client";

import { useEffect, useState } from "react";
import Map from "../map/Map";

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
                setSelectedYear(first?.year || null);
                setSelectedSpecies(first?.species_group || "");
                setSelectedEcosystem(first?.ecosystem_type || "");
            });
    }, [geoJsonPath]);

    if (!geoData) return <div>Loading {datasetLabel}...</div>;

    const counties = [...new Set(
        geoData.features.map((f: any) => f.properties.county)
    )];

    const years = [...new Set(
        geoData.features.map((f: any) => f.properties.year)
    )].sort();

    const speciesGroups = [...new Set(
        geoData.features.map((f: any) => f.properties.species_group)
    )];

    const ecosystemTypes = [...new Set(
        geoData.features.map((f: any) => f.properties.ecosystem_type)
    )];

    // Filter ONLY by year/species/ecosystem
    const filteredFeatures = geoData.features.filter((f: any) => {
        return (
            (selectedYear === null ||
                f.properties.year === selectedYear) &&
            (selectedSpecies === "" ||
                f.properties.species_group === selectedSpecies) &&
            (selectedEcosystem === "" ||
                f.properties.ecosystem_type === selectedEcosystem)
        );
    });

    const filteredGeoJSON = {
        ...geoData,
        features: filteredFeatures,
    };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

            {/* Filter Bar */}
            <div style={{
                padding: "10px",
                background: "#111",
                color: "white",
                display: "flex",
                gap: "15px",
                flexWrap: "wrap",
                alignItems: "center"
            }}>
                <h3>{datasetLabel}</h3>

                <label>
                    County:
                    <select
                        value={selectedCounty}
                        onChange={(e) => setSelectedCounty(e.target.value)}
                    >
                        <option value="">All Counties</option>
                        {counties.map((c: string) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Year:
                    <select
                        value={selectedYear ?? ""}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                        {years.map((y: number) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Species Group:
                    <select
                        value={selectedSpecies}
                        onChange={(e) => setSelectedSpecies(e.target.value)}
                    >
                        <option value="">All Species</option>
                        {speciesGroups.map((s: string) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Ecosystem Type:
                    <select
                        value={selectedEcosystem}
                        onChange={(e) => setSelectedEcosystem(e.target.value)}
                    >
                        <option value="">All Ecosystems</option>
                        {ecosystemTypes.map((eType: string) => (
                            <option key={eType} value={eType}>{eType}</option>
                        ))}
                    </select>
                </label>
            </div>

            <div style={{ flex: 1 }}>
                <Map
                    geoData={filteredGeoJSON}
                    selectedCounty={selectedCounty}
                />
            </div>
        </div>
    );
}
