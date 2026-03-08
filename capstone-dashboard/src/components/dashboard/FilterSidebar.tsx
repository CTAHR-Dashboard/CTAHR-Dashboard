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
  selectedYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;
  setSelectedCounty: (val: string) => void;
  setSelectedYear: (val: number | null) => void;
  setSelectedSpecies: (val: string) => void;
  setSelectedEcosystem: (val: string) => void;
  onDownload: (scope: "filtered" | "all") => void;
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
  const [downloadScope, setDownloadScope] = useState<"filtered" | "all">("filtered");

  return (
    <div className="sidebar">

      {/* Left tab rail */}
      <div className="sidebar-tabs">
        <div className="tabs-header">
          {/* Drop your logo at public/logo.png */}
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

        {/* Year */}
        <div>
          <div className="filter-label">Year</div>
          <select
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(e.target.value === "" ? null : Number(e.target.value))
            }
            className="filter-select"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
        <div>
          <div className="filter-label">Download</div>
          <select
            value={downloadScope}
            onChange={(e) => setDownloadScope(e.target.value as "filtered" | "all")}
            className="filter-select"
          >
            <option value="filtered">Current filter (single file)</option>
            <option value="all">All data (single file)</option>
          </select>
          <button className="download-btn" onClick={() => onDownload(downloadScope)}>
            Download CSV
          </button>
        </div>

      </div>
    </div>
  );
}
