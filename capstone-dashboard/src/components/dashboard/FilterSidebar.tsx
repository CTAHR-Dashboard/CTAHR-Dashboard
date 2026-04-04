"use client";

import { useState, useEffect } from "react";

interface FilterSidebarProps {
  dataset: "noncomm" | "comm";
  setDataset: (val: "noncomm" | "comm") => void;
  counties: string[];
  years: number[];
  speciesGroups: string[];
  ecosystemTypes: string[];
  selectedCounty: string;
  selectedYearStart: number | null;
  selectedYearEnd: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
  setSelectedCounty: (val: string) => void;
  setSelectedYearStart: (val: number | null) => void;
  setSelectedYearEnd: (val: number | null) => void;
  setSelectedSpecies: (val: string) => void;
  setSelectedEcosystem: (val: string) => void;

  onDownload: (
    downloadMode: "ALL_SEPARATE" | "ONE_COUNTY",
    county?: string
  ) => void;
}

export default function FilterSidebar({
  dataset,
  setDataset,
  counties,
  years,
  speciesGroups,
  ecosystemTypes,
  selectedCounty,
  selectedYearStart,
  selectedYearEnd,
  selectedSpecies,
  selectedEcosystem,
  setSelectedCounty,
  setSelectedYearStart,
  setSelectedYearEnd,
  setSelectedSpecies,
  setSelectedEcosystem,
  onDownload,
}: FilterSidebarProps) {

  const [downloadCounty, setDownloadCounty] = useState("");
  const [downloadMode, setDownloadMode] = useState<
    "ALL_SEPARATE" | "ONE_COUNTY"
  >("ONE_COUNTY");

  /*
    ---------------------------------------------
    RESET FILTERS WHEN DATASET CHANGES
    ---------------------------------------------
    Fixes issue where species/ecosystem from previous
    dataset stays selected and breaks UI
  */
  useEffect(() => {
    setSelectedSpecies("");
    setSelectedEcosystem("");

    // optional resets (recommended)
    setSelectedYearStart(null);
    setSelectedYearEnd(null);

    // optional:
    // setSelectedCounty("");

  }, [dataset]);

  return (
    <div className="sidebar">

      {/* LEFT */}
      <div className="sidebar-tabs">
        <div className="tabs-header">
          <img src="/logo.png" className="sidebar-logo" />
          <div className="sidebar-title">Hawaiʻi</div>
          <div className="sidebar-subtitle">Ecosystem Accounts</div>
        </div>

        <div className="tab active">Fisheries</div>
      </div>

      {/* RIGHT */}
      <div className="sidebar-panel">

        {/* DATA SOURCE */}
        <div>
          <div className="filter-label">Data Source</div>
          <select
            className="filter-select"
            value={dataset}
            onChange={(e) =>
              setDataset(e.target.value as "noncomm" | "comm")
            }
          >
            <option value="noncomm">Non-Commercial</option>
            <option value="comm">Commercial</option>
          </select>
        </div>

        {/* COUNTY */}
        <div>
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

        {/* YEAR */}
        <div>
          <div className="filter-label">Year Range</div>
          <div className="year-range-row">
            <select
              className="filter-select"
              value={selectedYearStart ?? ""}
              onChange={(e) =>
                setSelectedYearStart(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">Start</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <span className="year-range-arrow">→</span>

            <select
              className="filter-select"
              value={selectedYearEnd ?? ""}
              onChange={(e) =>
                setSelectedYearEnd(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">End</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SPECIES */}
        <div>
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
                className={`filter-btn ${
                  selectedSpecies === s ? "active" : ""
                }`}
                onClick={() => setSelectedSpecies(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ECOSYSTEM */}
        <div>
          <div className="filter-label">Ecosystem Type</div>
          <div className="button-group">
            <button
              className={`filter-btn ${
                selectedEcosystem === "" ? "active" : ""
              }`}
              onClick={() => setSelectedEcosystem("")}
            >
              All
            </button>

            {ecosystemTypes.map((e) => (
              <button
                key={e}
                className={`filter-btn ${
                  selectedEcosystem === e ? "active" : ""
                }`}
                onClick={() => setSelectedEcosystem(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* DOWNLOAD (RESTORED) */}
        <div style={{ marginTop: 16 }}>
          <div className="filter-label">Download CSV</div>

          <select
            className="filter-select"
            value={downloadMode}
            onChange={(e) =>
              setDownloadMode(
                e.target.value as "ALL_SEPARATE" | "ONE_COUNTY"
              )
            }
          >
            <option value="ONE_COUNTY">One county</option>
            <option value="ALL_SEPARATE">
              All counties (separate files)
            </option>
          </select>

          {downloadMode === "ONE_COUNTY" && (
            <select
              className="filter-select"
              value={downloadCounty}
              onChange={(e) => setDownloadCounty(e.target.value)}
              style={{ marginTop: 8 }}
            >
              <option value="">Choose a county…</option>
              {counties.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}

          <button
            className="filter-btn"
            style={{ marginTop: 10 }}
            onClick={() =>
              onDownload(
                downloadMode,
                downloadMode === "ONE_COUNTY"
                  ? downloadCounty
                  : undefined
              )
            }
            disabled={
              downloadMode === "ONE_COUNTY" && !downloadCounty
            }
          >
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}
