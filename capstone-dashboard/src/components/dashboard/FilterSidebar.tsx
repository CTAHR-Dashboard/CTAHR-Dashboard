"use client";

import { useState } from "react";
import "./dashboard.css";

interface FilterSidebarProps {
  datasetLabel: string;
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
}

export default function FilterSidebar({
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
}: FilterSidebarProps) {

  const [activeTab, setActiveTab] = useState("fishery");

  return (
    <div className="sidebar">

      {/* LEFT TAB COLUMN */}
      <div className="sidebar-tabs">

        {/* Branding Header INSIDE tab rail */}
        <div className="tabs-header">
          Hawaiʻi
          <div className="tabs-subtitle">
            Coastal Ecosystem Accounts
          </div>
        </div>

        <div
          className={`tab ${activeTab === "fishery" ? "active" : ""}`}
          onClick={() => setActiveTab("fishery")}
        >
          Non-Commercial Fishery Values
        </div>

        <div
          className={`tab ${activeTab === "commercial" ? "active" : ""}`}
          onClick={() => setActiveTab("commercial")}
        >
          Commercial
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div key={activeTab} className="sidebar-panel">

        {activeTab === "fishery" && (
          <>
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
          </>
        )}

        {activeTab === "commercial" && (
          <div>
            <p style={{ opacity: 0.6 }}>
              Commercial filters coming soon...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
