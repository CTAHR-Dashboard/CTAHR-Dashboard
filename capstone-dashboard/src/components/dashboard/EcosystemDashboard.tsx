// Dashboard: loads GeoJSON + CSV, manages filters, and passes data down to the map and sidebar.
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";

const Map = dynamic(() => import("../map/Map"), { ssr: false });

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

  const [selectedYearStart, setSelectedYearStart] = useState<number | null>(null);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // load GeoJSON and the right CSV whenever the dataset toggle changes
  useEffect(() => {
    async function loadData() {
      const geoRes = await fetch(geoJsonPath);
      const geo = await geoRes.json();

      const csvPath =
        dataset === "noncomm"
          ? "/fisheriesdata/cleaned_noncommercial.csv"
          : "/fisheriesdata/cleaned_commercial.csv";

      const csvRes = await fetch(csvPath);
      const csvText = await csvRes.text();

      const lines = csvText.split("\n").filter((r) => r.trim() !== "");

      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

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
      setSelectedYearStart(null);
      setSelectedYearEnd(null);
      setSelectedSpecies("");
      setSelectedEcosystem("");
    }

    loadData();
  }, [geoJsonPath, dataset]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // pull unique values out of the CSV to populate the filter dropdowns
  const counties = [...new Set(csvData.map((d) => d.county))];
  const years = [...new Set(csvData.map((d) => d.year))].sort();
  const speciesGroups = [...new Set(csvData.map((d) => d.species_group))];
  const ecosystemTypes = [...new Set(csvData.map((d) => d.ecosystem_type))];

  // apply active filters
  const filteredRows = csvData.filter((row) => {
    return (
      (selectedYearStart === null || row.year >= selectedYearStart) &&
      (selectedYearEnd === null || row.year <= selectedYearEnd) &&
      (selectedCounty === "" || row.county === selectedCounty) &&
      (selectedSpecies === "" || row.species_group === selectedSpecies) &&
      (selectedEcosystem === "" || row.ecosystem_type === selectedEcosystem)
    );
  });

  // sum exchange values by county for the choropleth
  const totalsByCounty: Record<string, number> = {};

  filteredRows.forEach((row) => {
    totalsByCounty[row.county] = (totalsByCounty[row.county] || 0) + row.exchange_value;
  });

  // attach the county totals to each GeoJSON feature so the map can color them
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
    const csvWithBom = "\uFEFF" + csvWithWindowsNewlines;

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

    const yearLabel = selectedYearStart || selectedYearEnd
      ? `${selectedYearStart ?? "start"}-${selectedYearEnd ?? "end"}`
      : "all-years";

    const filenameBaseParts = [
      yearLabel,
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

    const rowsGroupedByCounty: Record<string, CsvRow[]> = {};
    filteredRows.forEach((row) => {
      const countyName = row.county || "Unknown";
      (rowsGroupedByCounty[countyName] ||= []).push(row);
    });

    Object.entries(rowsGroupedByCounty).forEach(([countyName, countyRows], index) => {
      const csv = buildCsvFromRows(countyRows);
      const filename = `${[dataset, safe(countyName), ...filenameBaseParts].join("_")}.csv`;
      window.setTimeout(() => triggerCsvDownload(filename, csv), index * 250);
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const handleCountyClick = (county: string) => {
    setSelectedCounty(selectedCounty === county ? "" : county);
  };

  // roll up filtered rows for the bar charts in the data panel
  const byYear: Record<number, number> = {};
  const bySpecies: Record<string, number> = {};
  const byEcosystem: Record<string, number> = {};

  filteredRows.forEach((row) => {
    byYear[row.year] = (byYear[row.year] || 0) + row.exchange_value;
    bySpecies[row.species_group] = (bySpecies[row.species_group] || 0) + row.exchange_value;
    byEcosystem[row.ecosystem_type] = (byEcosystem[row.ecosystem_type] || 0) + row.exchange_value;
  });

  const yearEntries = Object.entries(byYear)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => a - b);

  const speciesEntries = Object.entries(bySpecies).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);
  const ecosystemEntries = Object.entries(byEcosystem).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a);

  const maxYear = Math.max(...yearEntries.map(([, v]) => v), 1);
  const maxSpecies = Math.max(...speciesEntries.map(([, v]) => v), 1);
  const maxEco = Math.max(...ecosystemEntries.map(([, v]) => v), 1);

  const tableRows = filteredRows
    .filter((r) => r.exchange_value > 0)
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.species_group.localeCompare(b.species_group));

  const tableTotal = filteredRows.reduce((sum, r) => sum + r.exchange_value, 0);

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
        selectedYearStart={selectedYearStart}
        selectedYearEnd={selectedYearEnd}
        selectedSpecies={selectedSpecies}
        selectedEcosystem={selectedEcosystem}
        setSelectedCounty={setSelectedCounty}
        setSelectedYearStart={setSelectedYearStart}
        setSelectedYearEnd={setSelectedYearEnd}
        setSelectedSpecies={setSelectedSpecies}
        setSelectedEcosystem={setSelectedEcosystem}
        onDownload={handleDownload}
      />

      <div className="map-wrapper">
        <Map
          geoData={aggregatedGeoJSON}
          selectedCounty={selectedCounty}
          selectedYearStart={selectedYearStart}
          selectedYearEnd={selectedYearEnd}
          selectedSpecies={selectedSpecies}
          selectedEcosystem={selectedEcosystem}
          onCountyClick={handleCountyClick}
        />

        {selectedCounty && (
          <div className="data-panel">
            <div className="data-panel-header">
              <div>
                <div className="data-panel-title">{selectedCounty} County</div>
                <div className="data-panel-subtitle">
                  {tableRows.length} record{tableRows.length !== 1 ? "s" : ""} &mdash; Total {formatCurrency(tableTotal)}
                </div>
              </div>
              <button className="data-panel-close" onClick={() => setSelectedCounty("")}>
                ✕
              </button>
            </div>

            <div className="data-panel-scroll">

              {/* Chart: By Year */}
              <div className="chart-section">
                <div className="chart-section-label">Exchange Value by Year</div>
                {yearEntries.map(([year, value]) => (
                  <div key={year} className="bar-row">
                    <div className="bar-name">{year}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(value / maxYear) * 100}%` }} />
                    </div>
                    <div className="bar-value">{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>

              {/* Chart: By Species Group */}
              <div className="chart-section">
                <div className="chart-section-label">By Species Group</div>
                {speciesEntries.map(([name, value]) => (
                  <div key={name} className="bar-row">
                    <div className="bar-name" title={name}>{name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(value / maxSpecies) * 100}%` }} />
                    </div>
                    <div className="bar-value">{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>

              {/* Chart: By Ecosystem Type */}
              <div className="chart-section">
                <div className="chart-section-label">By Ecosystem Type</div>
                {ecosystemEntries.map(([name, value]) => (
                  <div key={name} className="bar-row">
                    <div className="bar-name" title={name}>{name}</div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(value / maxEco) * 100}%` }} />
                    </div>
                    <div className="bar-value">{formatCurrency(value)}</div>
                  </div>
                ))}
              </div>

              {/* Detail Table */}
              <div className="chart-section">
                <div className="chart-section-label">Detail</div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Species</th>
                      <th>Ecosystem</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.year}</td>
                        <td>{row.species_group}</td>
                        <td>{row.ecosystem_type}</td>
                        <td>{formatCurrency(row.exchange_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total</td>
                      <td>{formatCurrency(tableTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
