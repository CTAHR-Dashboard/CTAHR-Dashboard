// Main dashboard component that loads GeoJSON and CSV data,
// manages filter state, and renders the map and sidebar.

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";

const Map = dynamic(() => import("../map/Map"), {
  ssr: false,
});

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

  // ---------------------------------------------
  // STATE
  // ---------------------------------------------

  const [geoData, setGeoData] = useState<any>(null);

  // store BOTH datasets
  const [commercialData, setCommercialData] = useState<CsvRow[]>([]);
  const [nonCommercialData, setNonCommercialData] = useState<CsvRow[]>([]);

  // which dataset user selected
  const [dataset, setDataset] = useState<"both" | "comm" | "noncomm">("both");

  // filters
  const [startYear, setStartYear] = useState<number | null>(null);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("All Ecosystems");

  // ---------------------------------------------
  // LOAD GEOJSON + CSV FILES
  // ---------------------------------------------

  useEffect(() => {

    async function loadData() {

      const geoRes = await fetch(geoJsonPath);
      const geo = await geoRes.json();

      const commRes = await fetch("/fisheriesdata/cleaned_commercial_latest.csv");
      const noncommRes = await fetch("/fisheriesdata/cleaned_noncommercial_latest.csv");

      const commText = await commRes.text();
      const noncommText = await noncommRes.text();

      const parseCsv = (csvText: string): CsvRow[] => {

      const lines = csvText.split("\n").filter(r => r.trim() !== "");

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
        const headers = lines[0]
          .split(",")
          .map(h => h.replace(/"/g, "").trim());

        return lines.slice(1).map((line) => {

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
      };

      setCommercialData(parseCsv(commText));
      setNonCommercialData(parseCsv(noncommText));
      setGeoData(geo);
    }

    loadData();

  }, [geoJsonPath]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // -------------------------------------------------
  // DERIVE FILTER VALUES FROM CSV
  // -------------------------------------------------
  const counties = [...new Set(csvData.map((d) => d.county))];
  const years = [...new Set(csvData.map((d) => d.year))].sort();
  const speciesGroups = [...new Set(csvData.map((d) => d.species_group))];
  const ecosystemTypes = [...new Set(csvData.map((d) => d.ecosystem_type))];

  // ---------------------------------------------
  // APPLY FILTERS
  // ---------------------------------------------

  const filteredRows = csvData.filter((row) => {

    return (
      (startYear === null || row.year >= startYear) &&
      (endYear === null || row.year <= endYear) &&
      (selectedCounty === "" || row.county === selectedCounty) &&
      (selectedSpecies === "" || row.species_group === selectedSpecies) &&
      (selectedEcosystem === "All Ecosystems" ||
        row.ecosystem_type === selectedEcosystem)
    );

  });

  // ---------------------------------------------
  // AGGREGATE DATA BY COUNTY
  // ---------------------------------------------

  const totalsByCounty: Record<string, number> = {};

  filteredRows.forEach((row) => {
    totalsByCounty[row.county] = (totalsByCounty[row.county] || 0) + row.exchange_value;
  });

  // ---------------------------------------------
  // ATTACH DATA TO GEOJSON
  // ---------------------------------------------

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

  function buildCsvFromRows(rowsForCsv: CsvRow[]) {
    if (rowsForCsv.length === 0) return "";

    const csvColumnOrder: (keyof CsvRow)[] = [
      "year",
      "county",
      "species_group",
      "ecosystem_type",
      "exchange_value",
    ];

    const escapeCsvCell = (cellValue: unknown) => {
      const cellText = String(cellValue ?? "");
      const needsQuotes = /[",\n"]/.test(cellText);
      return needsQuotes ? `"${cellText.replace(/"/g, '""')}"` : cellText;
    };

    const headerRow = csvColumnOrder.join(",");
    const dataRows = rowsForCsv.map((row) =>
      csvColumnOrder.map((col) => escapeCsvCell(row[col])).join(",")
    );

    return [headerRow, ...dataRows].join("\n");
  }

  function triggerCsvDownload(csvFilename: string, csvContents: string) {
  const csvWithWindowsNewlines = csvContents.replace(/\n/g, "\r\n");
  const csvWithBom = "\uFEFF" + csvWithWindowsNewlines; // helps Excel + UTF-8

  const fileBlob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const fileUrl = URL.createObjectURL(fileBlob);

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = fileUrl;
  downloadAnchor.download = csvFilename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  URL.revokeObjectURL(fileUrl);
}

  const handleDownload = (
    downloadMode: "ALL_SEPARATE" | "ONE_COUNTY",
    county?: string
  ) => {

    const safe = (s: string) => s.replace(/[^\w\-]+/g, "_");

    const filenameBaseParts = [
      selectedYear ?? "all-years",
      selectedSpecies || "all-species",
      selectedEcosystem || "all-ecosystems",
    ];

    if (downloadMode === "ONE_COUNTY") {
      if (!county) return;
      const countyRows = filteredRows.filter((r) => r.county === county);
      const csv = buildCsvFromRows(countyRows);
      const filename = `${[dataset, safe(county), ...filenameBaseParts].join("_")}.csv`;
      triggerCsvDownload(filename, csv);
      return;
    }

    // ALL_SEPARATE: download each county separately
    const rowsGroupedByCounty: Record<string, CsvRow[]> = {};
    filteredRows.forEach((row) => {
      const countyName = row.county || "Unknown";
      (rowsGroupedByCounty[countyName] ||= []).push(row);
    });

    Object.entries(rowsGroupedByCounty).forEach(([countyName, countyRows], index) => {
      const csv = buildCsvFromRows(countyRows);
      const filename = `${[dataset, safe(countyName), ...filenameBaseParts].join("_")}.csv`;

      // small stagger helps browsers allow multiple downloads
      window.setTimeout(() => triggerCsvDownload(filename, csv), index * 250);
    });
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
        startYear={startYear}
        endYear={endYear}
        selectedSpecies={selectedSpecies}
        selectedEcosystem={selectedEcosystem}
        setSelectedCounty={setSelectedCounty}
        setStartYear={setStartYear}
        setEndYear={setEndYear}
        setSelectedSpecies={setSelectedSpecies}
        setSelectedEcosystem={setSelectedEcosystem}
        onDownload={handleDownload}
      />

      <div className="map-wrapper">

        <div className="map-card">

          <div className="map-section">
            <Map
              geoData={aggregatedGeoJSON}
              selectedCounty={selectedCounty}
              startYear={startYear}
              endYear={endYear}
              selectedSpecies={selectedSpecies}
              selectedEcosystem={selectedEcosystem}
            />
          </div>

        </div>

        <div className="chart-card">
          <iframe
            src="/chartcomponent/dashboard_20260304.html"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>

      </div>

    </div>

  );
}