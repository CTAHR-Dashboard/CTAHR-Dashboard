// Dashboard: loads GeoJSON data, manages filters, and passes data down to the map and sidebar.
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

interface DataRow {
  year: number;
  county: string;
  area_id: string;   // county name for noncomm; moku area_id for comm
  species_group: string;
  ecosystem_type: string;
  exchange_value: number;
}

interface GeoFeature {
  type: string;
  properties: Record<string, unknown>;
  geometry: unknown;
}

interface GeoJSON {
  type: string;
  features: GeoFeature[];
}

// Normalize Hawaiian-diacritic county names to plain English
function normalizeCounty(raw: string): string {
  const map: Record<string, string> = {
    "Hawaiʻi": "Hawaii",
    "Kauaʻi": "Kauai",
    "Maui": "Maui",
    "Honolulu": "Honolulu",
    "Lanai": "Maui",
    "Molokai": "Maui",
  };
  return map[raw] ?? raw;
}

// Parse the noncomm GeoJSON (flat features, one row per feature)
function parseNoncommGeoJSON(geojson: GeoJSON): DataRow[] {
  return geojson.features
    .map((feat: GeoFeature) => {
      const p = feat.properties;
      const county = normalizeCounty(String(p.county ?? ""));
      return {
        year: Number(p.year),
        county,
        area_id: county,   // noncomm is county-level
        species_group: String(p.species_group ?? ""),
        ecosystem_type: String(p.ecosystem_type ?? ""),
        exchange_value: Number(p.exchange_value) || 0,
      } as DataRow;
    })
    .filter((r: DataRow) => r.exchange_value > 0);
}

// Parse the comm GeoJSON (each feature has parallel arrays, one entry per moku-row)
function parseCommGeoJSON(geojson: GeoJSON): DataRow[] {
  const rows: DataRow[] = [];
  for (const feat of geojson.features) {
    const p = feat.properties;
    const county = normalizeCounty(String(p.county_olelo ?? ""));
    const toArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [v]);
    const years = toArr(p.year).map(Number);
    const species = toArr(p.species_group).map(String);
    const ecosystems = toArr(p.ecosystem_type).map(String);
    const values = toArr(p.exchange_value).map(Number);

    for (let i = 0; i < years.length; i++) {
      const val = Number(values[i]) || 0;
      if (val <= 0) continue; // -1 = suppressed/missing data
      rows.push({
        year: Number(years[i]),
        county,
        area_id: String(p.area_id ?? ""),
        species_group: species[i],
        ecosystem_type: ecosystems[i],
        exchange_value: val,
      });
    }
  }
  return rows;
}

// SVG line + area chart for the year trend
function LineChart({ entries }: { entries: [number, number][] }) {
  if (entries.length < 2) return null;

  const W = 300, H = 90;
  const padL = 4, padR = 4, padT = 8, padB = 22;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxY = Math.max(...entries.map(([, v]) => v), 1);
  const minX = entries[0][0];
  const maxX = entries[entries.length - 1][0];
  const spanX = maxX - minX || 1;

  const toX = (year: number) => padL + ((year - minX) / spanX) * chartW;
  const toY = (val: number) => padT + chartH - (val / maxY) * chartH;

  const pts = entries.map(([yr, v]) => [toX(yr), toY(v)] as [number, number]);
  const bottomY = padT + chartH;

  const areaPath = [
    `M ${pts[0][0]} ${bottomY}`,
    ...pts.map(([x, y]) => `L ${x} ${y}`),
    `L ${pts[pts.length - 1][0]} ${bottomY}`,
    "Z",
  ].join(" ");

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");

  // Show year labels: first, last, and ~3 evenly spaced in between
  const labelIndices = new Set<number>([0, entries.length - 1]);
  if (entries.length > 3) {
    const step = Math.floor(entries.length / 3);
    for (let i = step; i < entries.length - step; i += step) labelIndices.add(i);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d94801" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d94801" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lineAreaGrad)" />
      <path d={linePath} fill="none" stroke="#d94801" strokeWidth="1.8" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#d94801" />
      ))}
      {[...labelIndices].map((i) => (
        <text
          key={entries[i][0]}
          x={toX(entries[i][0])}
          y={H - 5}
          textAnchor="middle"
          fontSize="8"
          fill="#666"
        >
          {entries[i][0]}
        </text>
      ))}
    </svg>
  );
}

export default function EcosystemDashboard({
  geoJsonPath,
  datasetLabel,
}: DashboardProps) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [rowData, setRowData] = useState<DataRow[]>([]);
  const [dataset, setDataset] = useState<"noncomm" | "comm">("noncomm");
  const [showRawData, setShowRawData] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");  // area_id for comm, county name for noncomm

  const [selectedYearStart, setSelectedYearStart] = useState<number | null>(null);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // Load GeoJSON boundaries + fisheries GeoJSON whenever dataset changes
  useEffect(() => {
    async function loadData() {
      const [geoRes, dataRes] = await Promise.all([
        fetch(geoJsonPath),
        fetch(
          dataset === "noncomm"
            ? "/fisheriesdata/20260216_tidied_noncomm_ev.geojson"
            : "/fisheriesdata/20260126_comm_ev_byMoku.geojson"
        ),
      ]);

      const [geo, dataGeo] = await Promise.all([geoRes.json(), dataRes.json()]);

      const rows =
        dataset === "noncomm"
          ? parseNoncommGeoJSON(dataGeo)
          : parseCommGeoJSON(dataGeo);

      // Comm: use moku GeoJSON as the boundary layer; noncomm: use county boundaries
      setGeoData(dataset === "comm" ? dataGeo : geo);
      setRowData(rows);

      // reset filters
      setSelectedCounty("");
      setSelectedYearStart(null);
      setSelectedYearEnd(null);
      setSelectedSpecies("");
      setSelectedEcosystem("");
      setShowRawData(false);
      setSelectedArea("");
    }

    loadData();
  }, [dataset, geoJsonPath]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // Unique values for filter dropdowns
  const counties = [...new Set(rowData.map((d) => d.county))].sort();
  const years = [...new Set(rowData.map((d) => d.year))].sort((a, b) => a - b);
  const speciesGroups = [...new Set(rowData.map((d) => d.species_group))].sort();
  const ecosystemTypes = [...new Set(rowData.map((d) => d.ecosystem_type))].sort();

  // Apply active filters
  const filteredRows = rowData.filter((row) => {
    return (
      (selectedYearStart === null || row.year >= selectedYearStart) &&
      (selectedYearEnd === null || row.year <= selectedYearEnd) &&
      (selectedCounty === "" || row.county === selectedCounty) &&
      (selectedSpecies === "" || row.species_group === selectedSpecies) &&
      (selectedEcosystem === "" || row.ecosystem_type === selectedEcosystem)
    );
  });

  // Sum exchange values by area_id for choropleth
  const totalsById: Record<string, number> = {};
  filteredRows.forEach((row) => {
    totalsById[row.area_id] = (totalsById[row.area_id] || 0) + row.exchange_value;
  });

  const aggregatedGeoJSON = {
    ...geoData,
    features: geoData.features.map((feature: GeoFeature) => {
      const key = dataset === "comm"
        ? String(feature.properties.area_id ?? "")
        : String(feature.properties.county ?? "");
      return {
        ...feature,
        properties: {
          ...feature.properties,
          total_exchange_value: totalsById[key] || 0,
        },
      };
    }),
  };

  // ---- Download helpers ----
  function buildCsvFromRows(rowsForCsv: DataRow[]) {
    if (rowsForCsv.length === 0) return "";
    const cols: (keyof DataRow)[] = ["year", "county", "species_group", "ecosystem_type", "exchange_value"];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [cols.join(","), ...rowsForCsv.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
  }

  function triggerCsvDownload(filename: string, contents: string) {
    const blob = new Blob(["\uFEFF" + contents.replace(/\n/g, "\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const handleDownload = (mode: "ALL_SEPARATE" | "ONE_COUNTY", county?: string) => {
    const safe = (s: string) => s.replace(/[^\w\-]+/g, "_");
    const yearLabel =
      selectedYearStart || selectedYearEnd
        ? `${selectedYearStart ?? "start"}-${selectedYearEnd ?? "end"}`
        : "all-years";
    const base = [yearLabel, selectedSpecies || "all-species", selectedEcosystem || "all-ecosystems"];

    if (mode === "ONE_COUNTY") {
      if (!county) return;
      const csv = buildCsvFromRows(filteredRows.filter((r) => r.county === county));
      triggerCsvDownload(`${[dataset, safe(county), ...base].join("_")}.csv`, csv);
      return;
    }

    const grouped: Record<string, DataRow[]> = {};
    filteredRows.forEach((r) => {
      (grouped[r.county || "Unknown"] ||= []).push(r);
    });
    Object.entries(grouped).forEach(([c, rows], i) => {
      const csv = buildCsvFromRows(rows);
      window.setTimeout(
        () => triggerCsvDownload(`${[dataset, safe(c), ...base].join("_")}.csv`, csv),
        i * 250
      );
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const handleAreaClick = (areaId: string) => {
    setSelectedArea(selectedArea === areaId ? "" : areaId);
    setShowRawData(false);
  };

  // Panel rows: filter to the clicked area (moku for comm, county for noncomm)
  const panelRows = selectedArea
    ? filteredRows.filter((r) => r.area_id === selectedArea)
    : [];

  // ---- Panel data aggregations ----
  const byYear: Record<number, number> = {};
  const bySpecies: Record<string, number> = {};
  const byEcosystem: Record<string, number> = {};

  panelRows.forEach((row) => {
    byYear[row.year] = (byYear[row.year] || 0) + row.exchange_value;
    bySpecies[row.species_group] = (bySpecies[row.species_group] || 0) + row.exchange_value;
    byEcosystem[row.ecosystem_type] = (byEcosystem[row.ecosystem_type] || 0) + row.exchange_value;
  });

  const yearEntries = Object.entries(byYear)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([a], [b]) => a - b);

  const speciesEntries = Object.entries(bySpecies).sort(([, a], [, b]) => b - a);
  const ecosystemEntries = Object.entries(byEcosystem).sort(([, a], [, b]) => b - a);

  const maxSpecies = Math.max(...speciesEntries.map(([, v]) => v), 1);
  const maxEco = Math.max(...ecosystemEntries.map(([, v]) => v), 1);

  const tableTotal = panelRows.reduce((sum, r) => sum + r.exchange_value, 0);
  const tableRows = panelRows
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.species_group.localeCompare(b.species_group));

  // ---- Trend calculation ----
  let trendPct: number | null = null;
  let firstYear: number | null = null;
  let lastYear: number | null = null;
  if (yearEntries.length >= 2) {
    firstYear = yearEntries[0][0];
    lastYear = yearEntries[yearEntries.length - 1][0];
    const firstVal = yearEntries[0][1];
    const lastVal = yearEntries[yearEntries.length - 1][1];
    if (firstVal > 0) trendPct = ((lastVal - firstVal) / firstVal) * 100;
  }

  const topSpecies = speciesEntries[0]?.[0] ?? null;
  const topEcosystem = ecosystemEntries[0]?.[0] ?? null;

  const trendIsUp = trendPct !== null && trendPct > 0;
  const trendLabel = trendIsUp ? "Improving" : "Declining";

  const summaryText = (() => {
    const parts: string[] = [];
    if (trendPct !== null && firstYear && lastYear) {
      parts.push(
        `Exchange value ${trendIsUp ? "improved" : "declined"} ${Math.abs(trendPct).toFixed(1)}% from ${firstYear} to ${lastYear}.`
      );
    }
    if (topSpecies) parts.push(`${topSpecies} contributed the most across species.`);
    if (topEcosystem) parts.push(`The ${topEcosystem} ecosystem was the top contributor.`);
    return parts.join(" ");
  })();

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
          mapType={dataset}
          geoData={aggregatedGeoJSON}
          selectedCounty={selectedArea}
          selectedYearStart={selectedYearStart}
          selectedYearEnd={selectedYearEnd}
          selectedSpecies={selectedSpecies}
          selectedEcosystem={selectedEcosystem}
          onCountyClick={handleAreaClick}
        />

        {selectedArea && (
          <div className="data-panel">
            {/* Header */}
            <div className="data-panel-header">
              <div>
                <div className="data-panel-title">
                  {dataset === "comm" ? selectedArea : `${selectedArea} County`}
                </div>
                <div className="data-panel-subtitle">
                  {tableRows.length} record{tableRows.length !== 1 ? "s" : ""}&nbsp;&mdash;&nbsp;Total {formatCurrency(tableTotal)}
                </div>
              </div>
              <button className="data-panel-close" onClick={() => setSelectedArea("")}>
                ✕
              </button>
            </div>

            <div className="data-panel-scroll">

              {/* Hero metric card */}
              <div className="metric-hero-card">
                <div className="metric-hero-value">{formatCurrency(tableTotal)}</div>
                <div className="metric-hero-label">TOTAL EXCHANGE VALUE</div>

                {trendPct !== null && (
                  <div className="metric-trend">
                    <span className="metric-trend-arrow">{trendIsUp ? "▲" : "▼"}</span>
                    <span className="metric-trend-pct">{Math.abs(trendPct).toFixed(1)}%</span>
                    <span className={`metric-trend-label ${trendIsUp ? "trend-up" : "trend-down"}`}>
                      {trendLabel}
                    </span>
                  </div>
                )}

                {summaryText && (
                  <p className="metric-summary">{summaryText}</p>
                )}
              </div>

              {/* Line chart: Exchange value trend by year */}
              {yearEntries.length > 0 && (
                <div className="chart-section">
                  <div className="chart-section-label">Exchange Value Trend by Year</div>
                  <LineChart entries={yearEntries} />
                </div>
              )}

              {/* Bar chart: By Species Group */}
              {speciesEntries.length > 0 && (
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
              )}

              {/* Bar chart: By Ecosystem Type */}
              {ecosystemEntries.length > 0 && (
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
              )}

              {/* Collapsible raw data table */}
              <div className="raw-data-section">
                <button
                  className="raw-data-toggle"
                  onClick={() => setShowRawData((v) => !v)}
                >
                  <span className="raw-data-toggle-arrow">{showRawData ? "▲" : "▼"}</span>
                  Show raw data
                </button>

                {showRawData && (
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
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
