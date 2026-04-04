"use client";

import { useState } from "react";

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
  const [downloadCounty, setDownloadCounty] = useState<string>("");
  const [downloadMode, setDownloadMode] = useState<"ALL_SEPARATE" | "ONE_COUNTY">("ONE_COUNTY");

  return (
    <div className="sidebar">

      {/* Left tab rail */}
      <div className="sidebar-tabs">
        <div className="tabs-header">
          <img src="/logo.png" alt="Oleson Lab" className="sidebar-logo" />
          <div className="sidebar-title">Hawaiʻi</div>
          <div className="sidebar-subtitle">Ecosystem Accounts</div>
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

      {/* Right filter panel */}
      <div className="sidebar-panel">

        {/* County */}
        <div>
          <div className="filter-label">County</div>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="filter-select"
          >
            <option value="">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Year Range */}
        <div>
          <div className="filter-label">Year Range</div>
          <div className="year-range-row">
            <select
              value={selectedYearStart ?? ""}
              onChange={(e) => setSelectedYearStart(e.target.value === "" ? null : Number(e.target.value))}
              className="filter-select"
            >
              <option value="">Start</option>
              {years.filter((y) => selectedYearEnd === null || y <= selectedYearEnd).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="year-range-arrow">→</span>
            <select
              value={selectedYearEnd ?? ""}
              onChange={(e) => setSelectedYearEnd(e.target.value === "" ? null : Number(e.target.value))}
              className="filter-select"
            >
              <option value="">End</option>
              {years.filter((y) => selectedYearStart === null || y >= selectedYearStart).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {!selectedYearStart && !selectedYearEnd && (
            <div className="year-range-hint">All Years</div>
          )}
        </div>

        {/* Species Group */}
        <div>
          <div className="filter-label">Species Group</div>
          <div className="button-group">
            <button
              className={`filter-btn ${selectedSpecies === "" ? "active" : ""}`}
              onClick={() => setSelectedSpecies("")}
            >
              All
            </button>
            {speciesGroups.map((o) => (
              <button
                key={o}
                className={`filter-btn ${selectedSpecies === o ? "active" : ""}`}
                onClick={() => setSelectedSpecies(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Ecosystem Type */}
        <div>
          <div className="filter-label">Ecosystem Type</div>
          <div className="button-group">
            <button
              className={`filter-btn ${selectedEcosystem === "" ? "active" : ""}`}
              onClick={() => setSelectedEcosystem("")}
            >
              All
            </button>
            {ecosystemTypes.map((o) => (
              <button
                key={o}
                className={`filter-btn ${selectedEcosystem === o ? "active" : ""}`}
                onClick={() => setSelectedEcosystem(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Download */}
        <div style={{ marginTop: 16 }}>
          <div className="filter-label">Download</div>

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
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="filter-btn"
            style={{ marginTop: 10 }}
            onClick={() => onDownload(downloadMode, downloadMode === "ONE_COUNTY" ? downloadCounty : undefined)}
            disabled={downloadMode === "ONE_COUNTY" && !downloadCounty}
          >
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}
