// Side bar component for dataset selection and filtering. 
// Contains dataset toggle, county/year dropdowns, and species/ecosystem button groups. 
// Updates parent state on user interaction to trigger map updates.
"use client";
import "./dashboard.css";
import Image from "next/image";
import { useState } from "react";

interface FilterSidebarProps {
  dataset: "noncomm" | "comm";
  setDataset: (val: "noncomm" | "comm") => void;
  counties: string[];
  years: number[];
  speciesGroups: string[];
  ecosystemTypes: string[];
  selectedCounty: string;
  selectedYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
  setSelectedCounty: (val: string) => void;
  setSelectedYear: (val: number | null) => void;
  setSelectedSpecies: (val: string) => void;
  setSelectedEcosystem: (val: string) => void;
  onDownload: (downloadMode: "ALL_SEPARATE" | "ONE_COUNTY", county?: string) => void;
}

export default function FilterSidebar({
  dataset,
  setDataset,
  counties,
  years,
  speciesGroups,
  ecosystemTypes,
  selectedCounty,
  selectedYear,
  selectedSpecies,
  selectedEcosystem,
  setSelectedCounty,
  setSelectedYear,
  setSelectedSpecies,
  setSelectedEcosystem,
  onDownload,
}: FilterSidebarProps) {

  // controls the download dropdown (separate from your map filters)
  const [downloadCounty, setDownloadCounty] = useState<string>("");
  const [downloadMode, setDownloadMode] = useState<"ALL_SEPARATE" | "ONE_COUNTY">("ONE_COUNTY");

  return (
    <div className="sidebar">

      {/* LEFT TAB COLUMN */}
      <div className="sidebar-tabs">

        <div className="tabs-header">
          <Image src="/icon.png" alt="Lab Icon" width={150} height={32} />
          Hawaiʻi
          <div className="tabs-subtitle">
            Ecosystem Accounts
          </div>
        </div>

        <div
          className={`tab ${dataset === "noncomm" ? "active" : ""}`}
          onClick={() => setDataset("noncomm")}
        >
          Non-Commercial Fishery Values
        </div>

        <div
          className={`tab ${dataset === "comm" ? "active" : ""}`}
          onClick={() => setDataset("comm")}
        >
          Commercial Fishery Values
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="sidebar-panel">

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
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* YEAR */}
        <div>
          <div className="filter-label">Year</div>
          <select
            className="filter-select"
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* SPECIES BUTTON GROUP */}
        <div>
          <div className="filter-label">Species Group</div>
          <div className="button-group">

            <button
              type="button"
              className={selectedSpecies === "" ? "filter-btn active" : "filter-btn"}
              onClick={() => setSelectedSpecies("")}
            >
              All
            </button>

            {speciesGroups.map((s) => (
              <button
                type="button"
                key={s}
                className={
                  selectedSpecies === s
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setSelectedSpecies(s)}
              >
                {s}
              </button>
            ))}

          </div>
        </div>

        {/* ECOSYSTEM BUTTON GROUP */}
        <div>
          <div className="filter-label">Ecosystem Type</div>
          <div className="button-group">

            <button
              type="button"
              className={selectedEcosystem === "" ? "filter-btn active" : "filter-btn"}
              onClick={() => setSelectedEcosystem("")}
            >
              All
            </button>

            {ecosystemTypes.map((eType) => (
              <button
                type="button"
                key={eType}
                className={
                  selectedEcosystem === eType
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setSelectedEcosystem(eType)}
              >
                {eType}
              </button>
            ))}

          </div>
        </div>
        
        {/* DOWNLOAD CONTROLS */}
        <div style={{ marginTop: 16 }}>
          <div className="filter-label">Download</div>

          <select
            className="filter-select"
            value={downloadMode}
            onChange={(e) => setDownloadMode(e.target.value as any)}
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
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="filter-btn"
            style={{ marginTop: 10 }}
            onClick={() => {
              console.log("Sidebar button clicked:", downloadMode, downloadCounty);
              onDownload(downloadMode,downloadMode === "ONE_COUNTY" ? downloadCounty : undefined);
            }}
            disabled={downloadMode === "ONE_COUNTY" && !downloadCounty}
          >
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}
