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

interface ExtentsRow {
  year: number;
  moku_olelo: string;
  island_olelo: string;
  moku_key: string; // "moku_olelo (island_olelo)" — globally unique
  realm: string;
  ecosystem_type: string;
  area_km2: number;
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

function LineChart({ entries, formatValue }: { entries: [number, number][]; formatValue?: (v: number) => string }) {
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
    formatValue
      ? formatValue(v)
      : v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(0)}K`
      : `$${v.toFixed(0)}`;

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

      {pts.map(([x, y], i) => (
        <circle
          key={`dot-${i}`}
          cx={x} cy={y}
          r={hovered === i ? 4 : 2.5}
          fill="#d94801"
          style={{ pointerEvents: "none", transition: "r 0.1s" }}
        />
      ))}

      {tooltip && (
        <line
          x1={tooltip.cx} y1={padT}
          x2={tooltip.cx} y2={bottomY}
          stroke="#d94801" strokeWidth="0.8" strokeDasharray="3 2"
          style={{ pointerEvents: "none" }}
        />
      )}

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

  // Fisheries filters
  const [selectedYearStart, setSelectedYearStart] = useState<number | null>(null);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // Layer toggle
  const [layer, setLayer] = useState<"fisheries" | "extents">("fisheries");

  // Extents data + filters
  const [extentsData, setExtentsData] = useState<ExtentsRow[]>([]);
  const [extentsGeoData, setExtentsGeoData] = useState<GeoJSON | null>(null);
  const [selectedExtentsYearStart, setSelectedExtentsYearStart] = useState<number | null>(null);
  const [selectedExtentsYearEnd, setSelectedExtentsYearEnd] = useState<number | null>(null);
  const [selectedExtentsEcosystem, setSelectedExtentsEcosystem] = useState("");
  const [selectedExtentsMoku, setSelectedExtentsMoku] = useState("");

  const [downloadCounty, setDownloadCounty] = useState("");
  const [downloadMode, setDownloadMode] = useState<"ALL_SEPARATE" | "ONE_COUNTY">("ONE_COUNTY");
  const [downloadExtentsMokus, setDownloadExtentsMokus] = useState<string[]>([]);
  const [downloadExtentsEcosystems, setDownloadExtentsEcosystems] = useState<string[]>([]);

  // Load fisheries data
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

  // Load extents data once on mount
  useEffect(() => {
    async function loadExtents() {
      const res = await fetch("/mokuextentsdata/mokus_extents.geojson");
      const geo = await res.json();

      const rows: ExtentsRow[] = geo.features
        .map((feat: GeoFeature) => {
          const p = feat.properties;
          const moku_olelo = String(p.moku_olelo ?? "");
          const island_olelo = String(p.island_olelo ?? "");
          return {
            year: Number(p.year),
            moku_olelo,
            island_olelo,
            moku_key: `${moku_olelo} (${island_olelo})`,
            realm: String(p.realm ?? ""),
            ecosystem_type: String(p.ecosystem_type ?? ""),
            area_km2: Number(p.area_km2) || 0,
          };
        })
        .filter((r: ExtentsRow) => r.area_km2 > 0);

      setExtentsData(rows);
      setExtentsGeoData(geo);
    }

    loadExtents();
  }, []);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // ----------------------------------
  // Fisheries derived values
  // ----------------------------------
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
    features: geoData.features
      .map((feature: GeoFeature) => {
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
      })
      .filter((feature: GeoFeature) =>
        (feature.properties.total_exchange_value as number) > 0
      ),
  };

  // ----------------------------------
  // Extents derived values
  // ----------------------------------
  const extentsYears = [...new Set(extentsData.map((d) => d.year))].sort((a, b) => a - b);
  const extentsEcosystems = [...new Set(extentsData.map((d) => d.ecosystem_type))].sort();
  const extentsMokus = [...new Set(extentsData.map((d) => d.moku_key))].sort();

  const filteredExtentsRows = extentsData.filter((row) => {
    return (
      (selectedExtentsYearStart === null || row.year >= selectedExtentsYearStart) &&
      (selectedExtentsYearEnd === null || row.year <= selectedExtentsYearEnd) &&
      (selectedExtentsEcosystem === "" || row.ecosystem_type === selectedExtentsEcosystem) &&
      (selectedExtentsMoku === "" || row.moku_key === selectedExtentsMoku)
    );
  });

  // Realm-ecosystem mapping — ecosystems that belong to each realm
  const MARINE_ECOSYSTEMS = new Set([
    "Coral Dominated Hard Bottom", "Open Ocean", "Other Hard Bottom",
    "Pavement", "Rock/Boulder", "Soft Bottom",
  ]);
  const TERRESTRIAL_ECOSYSTEMS = new Set([
    "Barren", "Beaches/Dunes", "Cropland", "Developed", "Estuarine Wetlands",
    "Freshwater Wetlands", "Grass/Shrub", "Pasture", "Tree Cover",
  ]);

  // Sum area_km2 per moku_key+realm so each polygon gets realm-appropriate values
  const extentsTotalsByMokuRealm: Record<string, number> = {};
  // Also sum per moku_key (for viz panel totals)
  const extentsTotalsByMoku: Record<string, number> = {};
  filteredExtentsRows.forEach((row) => {
    const realmForEco = MARINE_ECOSYSTEMS.has(row.ecosystem_type)
      ? "Marine"
      : TERRESTRIAL_ECOSYSTEMS.has(row.ecosystem_type)
      ? "Terrestrial"
      : row.realm;
    const realmKey = `${row.moku_key}||${realmForEco}`;
    extentsTotalsByMokuRealm[realmKey] = (extentsTotalsByMokuRealm[realmKey] || 0) + row.area_km2;
    extentsTotalsByMoku[row.moku_key] = (extentsTotalsByMoku[row.moku_key] || 0) + row.area_km2;
  });

  // Only show moku+realm combos that have data after filtering
  const activeMokuRealms = new Set(Object.keys(extentsTotalsByMokuRealm));

  // Deduplicate to one geometry per moku_key+realm, restricted to active combos
  const extentsAggregated: GeoJSON | null = extentsGeoData
    ? (() => {
        const seenMokuRealm = new Set<string>();
        const deduped = extentsGeoData.features.filter((feat: GeoFeature) => {
          const moku = String(feat.properties.moku_olelo ?? "");
          const island = String(feat.properties.island_olelo ?? "");
          const moku_key = `${moku} (${island})`;
          const realm = String(feat.properties.realm ?? "");
          const key = `${moku_key}||${realm}`;
          if (!activeMokuRealms.has(key)) return false;
          if (selectedExtentsMoku !== "" && moku_key !== selectedExtentsMoku) return false;
          if (seenMokuRealm.has(key)) return false;
          seenMokuRealm.add(key);
          return true;
        });
        return {
          ...extentsGeoData,
          features: deduped.map((feat: GeoFeature) => {
            const moku = String(feat.properties.moku_olelo ?? "");
            const island = String(feat.properties.island_olelo ?? "");
            const moku_key = `${moku} (${island})`;
            const realm = String(feat.properties.realm ?? "");
            const key = `${moku_key}||${realm}`;
            return {
              ...feat,
              properties: {
                ...feat.properties,
                moku_key,  // attach so Map can use it as click key
                total_area_km2: extentsTotalsByMokuRealm[key] || 0,
              },
            };
          }),
        };
      })()
    : null;

  // Active map data — switch based on layer
  const activeGeoData =
    layer === "extents" && extentsAggregated ? extentsAggregated : aggregatedGeoJSON;

  // Stable color scale thresholds — computed from ALL data, not filtered,
  // so polygon colors don't shift when filters change.
  const stableColorThresholds = (() => {
    if (layer === "extents") {
      // Build full moku+realm totals from ALL extents rows (no filter)
      const allTotals: Record<string, number> = {};
      extentsData.forEach((row) => {
        const realmForEco =
          ["Coral Dominated Hard Bottom", "Open Ocean", "Other Hard Bottom", "Pavement", "Rock/Boulder", "Soft Bottom"]
            .includes(row.ecosystem_type)
            ? "Marine"
            : "Terrestrial";
        const key = `${row.moku_key}||${realmForEco}`;
        allTotals[key] = (allTotals[key] || 0) + row.area_km2;
      });
      const sorted = Object.values(allTotals).sort((a, b) => a - b);
      return {
        q1: sorted[Math.floor(sorted.length * 0.2)] || 0,
        q2: sorted[Math.floor(sorted.length * 0.4)] || 0,
        q3: sorted[Math.floor(sorted.length * 0.6)] || 0,
        q4: sorted[Math.floor(sorted.length * 0.8)] || 0,
      };
    } else {
      // Build full moku/county totals from ALL fisheries rows (no filter)
      const allTotals: Record<string, number> = {};
      rowData.forEach((row) => {
        allTotals[row.area_id] = (allTotals[row.area_id] || 0) + row.exchange_value;
      });
      const sorted = Object.values(allTotals).sort((a, b) => a - b);
      return {
        q1: sorted[Math.floor(sorted.length * 0.2)] || 0,
        q2: sorted[Math.floor(sorted.length * 0.4)] || 0,
        q3: sorted[Math.floor(sorted.length * 0.6)] || 0,
        q4: sorted[Math.floor(sorted.length * 0.8)] || 0,
      };
    }
  })();

  // ----------------------------------
  // Download helpers
  // ----------------------------------
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

  const handleExtentsDownload = () => {
    const safe = (s: string) => s.replace(/[^\w\-]+/g, "_");
    const mokusToDownload = downloadExtentsMokus.length > 0 ? downloadExtentsMokus : null;
    const ecosToDownload = downloadExtentsEcosystems.length > 0 ? downloadExtentsEcosystems : null;

    const rows = extentsData.filter((r) => {
      return (
        (mokusToDownload === null || mokusToDownload.includes(r.moku_key)) &&
        (ecosToDownload === null || ecosToDownload.includes(r.ecosystem_type))
      );
    });

    const cols: (keyof ExtentsRow)[] = ["year", "moku_olelo", "island_olelo", "realm", "ecosystem_type", "area_km2"];
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");

    const mokusLabel = mokusToDownload ? safe(mokusToDownload.join("-")).slice(0, 40) : "all-mokus";
    const ecosLabel = ecosToDownload ? safe(ecosToDownload.join("-")).slice(0, 40) : "all-ecosystems";
    triggerCsvDownload(`extents_${mokusLabel}_${ecosLabel}.csv`, csv);
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

  // ----------------------------------
  // Viz panel data
  // ----------------------------------
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

  // Extents viz panel data — uses filteredExtentsRows which already has year range applied
  const extentsAllPanelRows = selectedArea
    ? extentsData.filter((r) => r.moku_key === selectedArea)
    : [];

  // Available years for this moku (all years, for reference in insight text)
  const extentsVizYears = [...new Set(extentsAllPanelRows.map((r) => r.year))].sort((a, b) => a - b);

  const extentsPanelRows = selectedArea
    ? filteredExtentsRows.filter((r) => r.moku_key === selectedArea)
    : [];

  const extentsByYear: Record<number, number> = {};
  const extentsByEcosystem: Record<string, number> = {};
  const extentsByRealm: Record<string, number> = {};
  extentsPanelRows.forEach((row) => {
    extentsByYear[row.year] = (extentsByYear[row.year] || 0) + row.area_km2;
    extentsByEcosystem[row.ecosystem_type] = (extentsByEcosystem[row.ecosystem_type] || 0) + row.area_km2;
    extentsByRealm[row.realm] = (extentsByRealm[row.realm] || 0) + row.area_km2;
  });
  const extentsYearEntries = Object.entries(extentsByYear)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort(([a], [b]) => a - b);
  const extentsEcoEntries = Object.entries(extentsByEcosystem).sort(([, a], [, b]) => b - a);
  const extentsRealmEntries = Object.entries(extentsByRealm).sort(([, a], [, b]) => b - a);
  const extentsTotalArea = extentsPanelRows.reduce((sum, r) => sum + r.area_km2, 0);
  const maxExtentsEco = Math.max(...extentsEcoEntries.map(([, v]) => v), 1);
  const maxExtentsRealm = Math.max(...extentsRealmEntries.map(([, v]) => v), 1);

  // Per-ecosystem change between first and last year in viz range
  const extentsEcoByYear: Record<string, Record<number, number>> = {};
  extentsPanelRows.forEach((row) => {
    if (!extentsEcoByYear[row.ecosystem_type]) extentsEcoByYear[row.ecosystem_type] = {};
    extentsEcoByYear[row.ecosystem_type][row.year] =
      (extentsEcoByYear[row.ecosystem_type][row.year] || 0) + row.area_km2;
  });

  // Build insight: total % change + ecosystem with biggest absolute change
  const extentsInsight = (() => {
    if (extentsYearEntries.length < 2) return null;
    const firstYr = extentsYearEntries[0][0];
    const lastYr = extentsYearEntries[extentsYearEntries.length - 1][0];
    const firstTotal = extentsYearEntries[0][1];
    const lastTotal = extentsYearEntries[extentsYearEntries.length - 1][1];
    if (firstTotal <= 0) return null;
    const totalPct = ((lastTotal - firstTotal) / firstTotal) * 100;
    const totalIsUp = totalPct > 0;

    // Find ecosystem with biggest absolute change between first and last year
    let biggestEco = "";
    let biggestChange = 0;
    let biggestPct = 0;
    Object.entries(extentsEcoByYear).forEach(([eco, byYr]) => {
      const ecoFirst = byYr[firstYr] || 0;
      const ecoLast = byYr[lastYr] || 0;
      const abs = Math.abs(ecoLast - ecoFirst);
      if (abs > biggestChange) {
        biggestChange = abs;
        biggestEco = eco;
        biggestPct = ecoFirst > 0 ? ((ecoLast - ecoFirst) / ecoFirst) * 100 : 0;
      }
    });

    return { totalPct, totalIsUp, firstYr, lastYr, biggestEco, biggestPct, biggestChange };
  })();

  return (
    <div className="dashboard-container">

      {/* Left nav */}
      <FilterSidebar
        layer={layer}
        setLayer={setLayer}
        onLayerChange={() => setSelectedArea("")}
      />

      {/* Map */}
      <div className="map-wrapper">
        <Map
          mapType={dataset}
          layerType={layer}
          geoData={activeGeoData}
          selectedCounty={selectedArea}
          selectedYearStart={selectedYearStart}
          selectedYearEnd={selectedYearEnd}
          selectedSpecies={selectedSpecies}
          selectedEcosystem={layer === "extents" ? selectedExtentsEcosystem : selectedEcosystem}
          onCountyClick={handleAreaClick}
          colorThresholds={stableColorThresholds}
        />
      </div>

      {/* Right panel */}
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

            {/* ── EXTENTS FILTERS ── */}
            {layer === "extents" && (
              <>
                {/* Reset */}
                <div className="rp-section">
                  <button
                    className="filter-btn"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setSelectedExtentsMoku("");
                      setSelectedExtentsYearStart(null);
                      setSelectedExtentsYearEnd(null);
                      setSelectedExtentsEcosystem("");
                    }}
                  >
                    ↺ Reset Filters
                  </button>
                </div>

                <div className="rp-section">
                  <div className="filter-label">Moku</div>
                  <select
                    className="filter-select"
                    value={selectedExtentsMoku}
                    onChange={(e) => setSelectedExtentsMoku(e.target.value)}
                  >
                    <option value="">All Moku</option>
                    {extentsMokus.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="rp-section">
                  <div className="filter-label">Year Range</div>
                  <div className="year-range-row">
                    <select
                      className="filter-select"
                      value={selectedExtentsYearStart ?? ""}
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        setSelectedExtentsYearStart(val);
                        if (val !== null && selectedExtentsYearEnd !== null && val > selectedExtentsYearEnd) {
                          setSelectedExtentsYearEnd(null);
                        }
                      }}
                    >
                      <option value="">Start</option>
                      {extentsYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <span className="year-range-arrow">→</span>
                    <select
                      className="filter-select"
                      value={selectedExtentsYearEnd ?? ""}
                      onChange={(e) =>
                        setSelectedExtentsYearEnd(e.target.value === "" ? null : Number(e.target.value))
                      }
                    >
                      <option value="">End</option>
                      {extentsYears
                        .filter((y) => selectedExtentsYearStart === null || y >= selectedExtentsYearStart)
                        .map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rp-section">
                  <div className="filter-label">Ecosystem Type</div>
                  <div className="filter-sublabel">Marine</div>
                  <div className="button-group" style={{ marginBottom: 8 }}>
                    {[...MARINE_ECOSYSTEMS].sort().map((e) => (
                      <button
                        key={e}
                        className={`filter-btn ${selectedExtentsEcosystem === e ? "active" : ""}`}
                        onClick={() => setSelectedExtentsEcosystem(selectedExtentsEcosystem === e ? "" : e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="filter-sublabel mt">Terrestrial</div>
                  <div className="button-group">
                    {[...TERRESTRIAL_ECOSYSTEMS].sort().map((e) => (
                      <button
                        key={e}
                        className={`filter-btn ${selectedExtentsEcosystem === e ? "active" : ""}`}
                        onClick={() => setSelectedExtentsEcosystem(selectedExtentsEcosystem === e ? "" : e)}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extents Download */}
                <div className="rp-section">
                  <div className="filter-label">Download CSV</div>

                  <div className="filter-sublabel mt">
                    Moku (hold Ctrl/⌘ to select multiple)
                  </div>
                  <select
                    multiple
                    className="filter-select"
                    style={{ height: 100 }}
                    value={downloadExtentsMokus}
                    onChange={(e) =>
                      setDownloadExtentsMokus(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {extentsMokus.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <div className="filter-sublabel mt">
                    Ecosystem (hold Ctrl/⌘ to select multiple)
                  </div>
                  <select
                    multiple
                    className="filter-select"
                    style={{ height: 100 }}
                    value={downloadExtentsEcosystems}
                    onChange={(e) =>
                      setDownloadExtentsEcosystems(Array.from(e.target.selectedOptions).map((o) => o.value))
                    }
                  >
                    {extentsEcosystems.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button
                      className="filter-btn"
                      style={{ flex: 1 }}
                      onClick={() => { setDownloadExtentsMokus([]); setDownloadExtentsEcosystems([]); }}
                    >
                      Clear
                    </button>
                    <button
                      className="filter-btn"
                      style={{ flex: 2 }}
                      onClick={handleExtentsDownload}
                    >
                      Download CSV
                    </button>
                  </div>
                  <div className="filter-hint">
                    No selection = all mokus / all ecosystems
                  </div>
                </div>
              </>
            )}

            {/* ── FISHERIES FILTERS ── */}
            {layer === "fisheries" && (
              <>
                {/* Reset */}
                <div className="rp-section">
                  <button
                    className="filter-btn"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setSelectedCounty("");
                      setSelectedYearStart(null);
                      setSelectedYearEnd(null);
                      setSelectedSpecies("");
                      setSelectedEcosystem("");
                    }}
                  >
                    ↺ Reset Filters
                  </button>
                </div>

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
                      onChange={(e) => {
                        const val = e.target.value === "" ? null : Number(e.target.value);
                        setSelectedYearStart(val);
                        if (val !== null && selectedYearEnd !== null && val > selectedYearEnd) {
                          setSelectedYearEnd(null);
                        }
                      }}
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
                      {years
                        .filter((y) => selectedYearStart === null || y >= selectedYearStart)
                        .map((y) => <option key={y}>{y}</option>)}
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
              </>
            )}

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
            ) : layer === "extents" ? (
              /* ── EXTENTS VIZ ── */
              <>
                <div className="viz-header">
                  <div>
                    <div className="data-panel-title">{selectedArea}</div>
                    <div className="data-panel-subtitle">
                      {extentsPanelRows.length} record{extentsPanelRows.length !== 1 ? "s" : ""}&nbsp;&mdash;&nbsp;Total {extentsTotalArea.toFixed(2)} km²
                    </div>
                  </div>
                  <button className="data-panel-close" onClick={() => {
                    setSelectedArea("");
                    setSelectedExtentsMoku("");
                    setSelectedExtentsYearStart(null);
                    setSelectedExtentsYearEnd(null);
                    setSelectedExtentsEcosystem("");
                  }}>✕</button>
                </div>

                {/* Hero metric card */}
                <div className="metric-hero-card">
                  <div className="metric-hero-value">{extentsTotalArea.toFixed(2)} km²</div>
                  <div className="metric-hero-label">TOTAL ECOSYSTEM AREA</div>

                  {extentsInsight && (
                    <>
                      <div className="metric-trend">
                        <span className="metric-trend-arrow">{extentsInsight.totalIsUp ? "▲" : "▼"}</span>
                        <span className="metric-trend-pct">{Math.abs(extentsInsight.totalPct).toFixed(1)}%</span>
                        <span className={`metric-trend-label ${extentsInsight.totalIsUp ? "trend-up" : "trend-down"}`}>
                          {extentsInsight.totalIsUp ? "Increasing" : "Decreasing"}
                        </span>
                      </div>
                      <p className="metric-summary">
                        Total area {extentsInsight.totalIsUp ? "increased" : "decreased"} by{" "}
                        <strong>{Math.abs(extentsInsight.totalPct).toFixed(1)}%</strong> from{" "}
                        {extentsInsight.firstYr} to {extentsInsight.lastYr}.
                        {extentsInsight.biggestEco && (
                          <> The biggest change was in <strong>{extentsInsight.biggestEco}</strong> area
                          , which {extentsInsight.biggestPct >= 0 ? "grew" : "shrank"} by{" "}
                          {Math.abs(extentsInsight.biggestPct).toFixed(1)}% ({extentsInsight.biggestChange.toFixed(2)} km²).</>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Area trend line chart */}
                {extentsYearEntries.length > 0 && (
                  <div className="chart-section">
                    <div className="chart-section-label">Area Trend by Year (km²)</div>
                    <LineChart entries={extentsYearEntries} formatValue={(v) => `${v.toFixed(2)} km²`} />
                  </div>
                )}

                {/* By Realm */}
                {extentsRealmEntries.length > 0 && (
                  <div className="chart-section">
                    <div className="chart-section-label">By Realm</div>
                    {extentsRealmEntries.map(([name, value]) => (
                      <div key={name} className="bar-row">
                        <div className="bar-name" title={name}>{name}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(value / maxExtentsRealm) * 100}%` }} />
                        </div>
                        <div className="bar-value">{value.toFixed(2)} km²</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* By Ecosystem */}
                {extentsEcoEntries.length > 0 && (
                  <div className="chart-section">
                    <div className="chart-section-label">By Ecosystem Type</div>
                    {extentsEcoEntries.map(([name, value]) => (
                      <div key={name} className="bar-row">
                        <div className="bar-name" title={name}>{name}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${(value / maxExtentsEco) * 100}%` }} />
                        </div>
                        <div className="bar-value">{value.toFixed(2)} km²</div>
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
                          <th>Ecosystem</th>
                          <th>Area (km²)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extentsPanelRows
                          .slice()
                          .sort((a, b) => a.year - b.year)
                          .map((row, i) => (
                            <tr key={i}>
                              <td>{row.year}</td>
                              <td>{row.ecosystem_type}</td>
                              <td>{row.area_km2.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={2}>Total</td>
                          <td>{extentsTotalArea.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              </>
            ) : (
              /* ── FISHERIES VIZ (unchanged) ── */
              <>
                <div className="viz-header">
                  <div>
                    <div className="data-panel-title">
                      {dataset === "comm" ? selectedArea : `${selectedArea} County`}
                    </div>
                    <div className="data-panel-subtitle">
                      {tableRows.length} record{tableRows.length !== 1 ? "s" : ""}&nbsp;&mdash;&nbsp;Total {formatCurrency(tableTotal)}
                    </div>
                  </div>
                  <button className="data-panel-close" onClick={() => {
                    setSelectedArea("");
                    setSelectedCounty("");
                    setSelectedYearStart(null);
                    setSelectedYearEnd(null);
                    setSelectedSpecies("");
                    setSelectedEcosystem("");
                  }}>✕</button>
                </div>

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

                {yearEntries.length > 0 && (
                  <div className="chart-section">
                    <div className="chart-section-label">Exchange Value Trend by Year</div>
                    <LineChart entries={yearEntries} />
                  </div>
                )}

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
