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
  area_id: string;
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

function parseNoncommGeoJSON(geojson: GeoJSON): DataRow[] {
  return geojson.features
    .map((feat: GeoFeature) => {
      const p = feat.properties;
      const county = normalizeCounty(String(p.county ?? ""));
      return {
        year: Number(p.year),
        county,
        area_id: county,
        species_group: String(p.species_group ?? ""),
        ecosystem_type: String(p.ecosystem_type ?? ""),
        exchange_value: Number(p.exchange_value) || 0,
      } as DataRow;
    })
    .filter((r: DataRow) => r.exchange_value > 0);
}

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
      if (val <= 0) continue;
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

function LineChart({ entries }: { entries: [number, number][] }) {
  const [hovered, setHovered] = useState<number | null>(null);

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

  const labelIndices = new Set<number>([0, entries.length - 1]);
  if (entries.length > 3) {
    const step = Math.floor(entries.length / 3);
    for (let i = step; i < entries.length - step; i += step) labelIndices.add(i);
  }

  const formatK = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}K`
      : `$${v.toFixed(0)}`;

  // Tooltip box: flip to left side if point is in the right half of the chart
  const tooltip = hovered !== null ? (() => {
    const [cx, cy] = pts[hovered];
    const [year, val] = entries[hovered];
    const label = formatK(val);
    const tipW = 68, tipH = 26, tipR = 3;
    const flipLeft = cx > W / 2;
    const tx = flipLeft ? cx - tipW - 6 : cx + 6;
    const ty = Math.max(padT, cy - tipH / 2);
    return { cx, cy, year, label, tx, ty, tipW, tipH, tipR };
  })() : null;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
    >
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d94801" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d94801" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#lineAreaGrad)" />
      <path d={linePath} fill="none" stroke="#d94801" strokeWidth="1.8" strokeLinejoin="round" />

      {/* Invisible wider hit areas so hover is easy to trigger */}
      {pts.map(([x, y], i) => (
        <circle
          key={`hit-${i}`}
          cx={x} cy={y} r="8"
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {/* Visible dots — enlarge on hover */}
      {pts.map(([x, y], i) => (
        <circle
          key={`dot-${i}`}
          cx={x} cy={y}
          r={hovered === i ? 4 : 2.5}
          fill="#d94801"
          style={{ pointerEvents: "none", transition: "r 0.1s" }}
        />
      ))}

      {/* Vertical guide line on hover */}
      {tooltip && (
        <line
          x1={tooltip.cx} y1={padT}
          x2={tooltip.cx} y2={bottomY}
          stroke="#d94801" strokeWidth="0.8" strokeDasharray="3 2"
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Tooltip box */}
      {tooltip && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={tooltip.tx} y={tooltip.ty}
            width={tooltip.tipW} height={tooltip.tipH}
            rx={tooltip.tipR} ry={tooltip.tipR}
            fill="#1a1a1a" stroke="#d94801" strokeWidth="0.8"
          />
          <text x={tooltip.tx + tooltip.tipW / 2} y={tooltip.ty + 10} textAnchor="middle" fontSize="7.5" fill="#888">
            {tooltip.year}
          </text>
          <text x={tooltip.tx + tooltip.tipW / 2} y={tooltip.ty + 20} textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#d94801">
            {tooltip.label}
          </text>
        </g>
      )}

      {/* X-axis year labels */}
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

export default function EcosystemDashboard({ geoJsonPath, datasetLabel }: DashboardProps) {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [rowData, setRowData] = useState<DataRow[]>([]);
  const [dataset, setDataset] = useState<"noncomm" | "comm">("noncomm");
  const [showRawData, setShowRawData] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");
  const [activeTab, setActiveTab] = useState<"filter" | "viz">("filter");

  const [selectedYearStart, setSelectedYearStart] = useState<number | null>(null);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  const [downloadCounty, setDownloadCounty] = useState("");
  const [downloadMode, setDownloadMode] = useState<"ALL_SEPARATE" | "ONE_COUNTY">("ONE_COUNTY");

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

      setGeoData(dataset === "comm" ? dataGeo : geo);
      setRowData(rows);

      setSelectedCounty("");
      setSelectedYearStart(null);
      setSelectedYearEnd(null);
      setSelectedSpecies("");
      setSelectedEcosystem("");
      setShowRawData(false);
      setSelectedArea("");
      setActiveTab("filter");
    }

    loadData();
  }, [dataset, geoJsonPath]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  const counties = [...new Set(rowData.map((d) => d.county))].sort();
  const years = [...new Set(rowData.map((d) => d.year))].sort((a, b) => a - b);
  const speciesGroups = [...new Set(rowData.map((d) => d.species_group))].sort();
  const ecosystemTypes = [...new Set(rowData.map((d) => d.ecosystem_type))].sort();

  const filteredRows = rowData.filter((row) => {
    return (
      (selectedYearStart === null || row.year >= selectedYearStart) &&
      (selectedYearEnd === null || row.year <= selectedYearEnd) &&
      (selectedCounty === "" || row.county === selectedCounty) &&
      (selectedSpecies === "" || row.species_group === selectedSpecies) &&
      (selectedEcosystem === "" || row.ecosystem_type === selectedEcosystem)
    );
  });

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
    const next = selectedArea === areaId ? "" : areaId;
    setSelectedArea(next);
    setShowRawData(false);
    if (next !== "") setActiveTab("viz");
  };

  const panelRows = selectedArea
    ? filteredRows.filter((r) => r.area_id === selectedArea)
    : [];

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

      {/* Left nav — logo + page label only */}
      <FilterSidebar />

      {/* Map */}
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
      </div>

      {/* Right panel with Filter / Viz tabs */}
      <div className="right-panel">

        {/* Tab header */}
        <div className="right-panel-tabs">
          <button
            className={`rp-tab ${activeTab === "filter" ? "active" : ""}`}
            onClick={() => setActiveTab("filter")}
          >
            Filter
          </button>
          <button
            className={`rp-tab ${activeTab === "viz" ? "active" : ""}`}
            onClick={() => setActiveTab("viz")}
          >
            Data View
          </button>
        </div>

        {/* ── FILTER TAB ── */}
        {activeTab === "filter" && (
          <div className="rp-content">

            {/* Data Source */}
            <div className="rp-section">
              <div className="filter-label">Data Source</div>
              <select
                className="filter-select"
                value={dataset}
                onChange={(e) => setDataset(e.target.value as "noncomm" | "comm")}
              >
                <option value="noncomm">Non-Commercial</option>
                <option value="comm">Commercial</option>
              </select>
            </div>

            {/* County */}
            <div className="rp-section">
              <div className="filter-label">County</div>
              <select
                className="filter-select"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                <option value="">All Counties</option>
                {counties.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Year Range */}
            <div className="rp-section">
              <div className="filter-label">Year Range</div>
              <div className="year-range-row">
                <select
                  className="filter-select"
                  value={selectedYearStart ?? ""}
                  onChange={(e) =>
                    setSelectedYearStart(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">Start</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
                <span className="year-range-arrow">→</span>
                <select
                  className="filter-select"
                  value={selectedYearEnd ?? ""}
                  onChange={(e) =>
                    setSelectedYearEnd(e.target.value === "" ? null : Number(e.target.value))
                  }
                >
                  <option value="">End</option>
                  {years.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            {/* Species Group */}
            <div className="rp-section">
              <div className="filter-label">Species Group</div>
              <div className="button-group">
                <button
                  className={`filter-btn ${selectedSpecies === "" ? "active" : ""}`}
                  onClick={() => setSelectedSpecies("")}
                >
                  All
                </button>
                {speciesGroups.map((s) => (
                  <button
                    key={s}
                    className={`filter-btn ${selectedSpecies === s ? "active" : ""}`}
                    onClick={() => setSelectedSpecies(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Ecosystem Type */}
            <div className="rp-section">
              <div className="filter-label">Ecosystem Type</div>
              <div className="button-group">
                <button
                  className={`filter-btn ${selectedEcosystem === "" ? "active" : ""}`}
                  onClick={() => setSelectedEcosystem("")}
                >
                  All
                </button>
                {ecosystemTypes.map((e) => (
                  <button
                    key={e}
                    className={`filter-btn ${selectedEcosystem === e ? "active" : ""}`}
                    onClick={() => setSelectedEcosystem(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Download */}
            <div className="rp-section">
              <div className="filter-label">Download CSV</div>
              <select
                className="filter-select"
                value={downloadMode}
                onChange={(e) => setDownloadMode(e.target.value as "ALL_SEPARATE" | "ONE_COUNTY")}
              >
                <option value="ONE_COUNTY">One county</option>
                <option value="ALL_SEPARATE">All counties (separate files)</option>
              </select>

              {downloadMode === "ONE_COUNTY" && (
                <select
                  className="filter-select"
                  value={downloadCounty}
                  onChange={(e) => setDownloadCounty(e.target.value)}
                  style={{ marginTop: 8 }}
                >
                  <option value="">Choose a county…</option>
                  {counties.map((c) => <option key={c}>{c}</option>)}
                </select>
              )}

              <button
                className="filter-btn"
                style={{ marginTop: 10 }}
                onClick={() => handleDownload(downloadMode, downloadMode === "ONE_COUNTY" ? downloadCounty : undefined)}
                disabled={downloadMode === "ONE_COUNTY" && !downloadCounty}
              >
                Download CSV
              </button>
            </div>

          </div>
        )}

        {/* ── VIZ TAB ── */}
        {activeTab === "viz" && (
          <div className="rp-content">
            {!selectedArea ? (
              <div className="rp-empty">
                <div className="rp-empty-icon">◎</div>
                <div className="rp-empty-text">Click a region on the map to view its data</div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="viz-header">
                  <div>
                    <div className="data-panel-title">
                      {dataset === "comm" ? selectedArea : `${selectedArea} County`}
                    </div>
                    <div className="data-panel-subtitle">
                      {tableRows.length} record{tableRows.length !== 1 ? "s" : ""}&nbsp;&mdash;&nbsp;Total {formatCurrency(tableTotal)}
                    </div>
                  </div>
                  <button className="data-panel-close" onClick={() => setSelectedArea("")}>✕</button>
                </div>

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

                  {summaryText && <p className="metric-summary">{summaryText}</p>}
                </div>

                {/* Year trend chart */}
                {yearEntries.length > 0 && (
                  <div className="chart-section">
                    <div className="chart-section-label">Exchange Value Trend by Year</div>
                    <LineChart entries={yearEntries} />
                  </div>
                )}

                {/* By Species */}
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

                {/* By Ecosystem */}
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

                {/* Raw data table */}
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
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
