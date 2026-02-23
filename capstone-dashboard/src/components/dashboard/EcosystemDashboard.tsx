"use client";

import { useEffect, useState } from "react";
import Map from "../map/Map";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";

interface DashboardProps {
  geoJsonPath: string;
  datasetLabel: string;
}

interface CsvRow {
  year: number;
  county: string;
  species_group: string;
  ecosystem_type: string;
  exchange_value: number;
}

export default function EcosystemDashboard({
  geoJsonPath,
  datasetLabel,
}: DashboardProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [dataset, setDataset] = useState<"noncomm" | "comm">("noncomm");

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // -------------------------------------------------
  // LOAD GEOJSON + CSV (DATASET DEPENDENT)
  // -------------------------------------------------
  useEffect(() => {
    async function loadData() {
      const geoRes = await fetch(geoJsonPath);
      const geo = await geoRes.json();

      const csvPath =
        dataset === "noncomm"
          ? "/fisheriesdata/20260216_tidied_noncomm_ev.csv"
          : "/fisheriesdata/20260216_tidied_comm_ev.csv";

      const csvRes = await fetch(csvPath);
      const csvText = await csvRes.text();

      const lines = csvText.split("\n").filter(r => r.trim() !== "");

      const headers = lines[0]
        .split(",")
        .map(h => h.replace(/"/g, "").trim());

      const parsed: CsvRow[] = lines.slice(1).map((line) => {
        const values = line.split(",");

        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, "").trim();
        });

        let county = row["county"];

        // Normalize Lanai / Molokai into Maui
        if (county === "Lanai" || county === "Molokai") {
          county = "Maui";
        }

        return {
          year: Number(row["year"]),
          county,
          species_group: row["species_group"],
          ecosystem_type: row["ecosystem_type"],
          exchange_value: Number(row["exchange_value"]) || 0,
        };
      });

      setGeoData(geo);
      setCsvData(parsed);

      // Reset filters when dataset changes
      setSelectedCounty("");
      setSelectedYear(null);
      setSelectedSpecies("");
      setSelectedEcosystem("");
    }

    loadData();
  }, [geoJsonPath, dataset]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // -------------------------------------------------
  // DERIVE FILTER VALUES FROM CSV
  // -------------------------------------------------
  const counties = [...new Set(csvData.map(d => d.county))];
  const years = [...new Set(csvData.map(d => d.year))].sort();
  const speciesGroups = [...new Set(csvData.map(d => d.species_group))];
  const ecosystemTypes = [...new Set(csvData.map(d => d.ecosystem_type))];

  // -------------------------------------------------
  // APPLY FILTERS TO CSV
  // -------------------------------------------------
  const filteredRows = csvData.filter((row) => {
    return (
      (selectedYear === null || row.year === selectedYear) &&
      (selectedCounty === "" || row.county === selectedCounty) &&
      (selectedSpecies === "" || row.species_group === selectedSpecies) &&
      (selectedEcosystem === "" || row.ecosystem_type === selectedEcosystem)
    );
  });

  // -------------------------------------------------
  // AGGREGATE BY COUNTY
  // -------------------------------------------------
  const totalsByCounty: Record<string, number> = {};

  filteredRows.forEach((row) => {
    totalsByCounty[row.county] =
      (totalsByCounty[row.county] || 0) + row.exchange_value;
  });

  // -------------------------------------------------
  // ATTACH TOTALS TO GEOJSON
  // -------------------------------------------------
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
        dataset={dataset}
        setDataset={setDataset}
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
