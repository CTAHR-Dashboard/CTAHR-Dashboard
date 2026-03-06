// Side bar component for dataset selection and filtering.
// Contains dataset selector, county/year dropdowns, and species/ecosystem button groups.
// Updates parent state on user interaction to trigger map updates.

"use client";

import "./dashboard.css";
import Image from "next/image";

interface FilterSidebarProps {
  dataset: "both" | "noncomm" | "comm";
  setDataset: (val: "both" | "noncomm" | "comm") => void;

  counties: string[];
  years: number[];
  speciesGroups: string[];
  ecosystemTypes: string[];

  selectedCounty: string;
  startYear: number | null;
  endYear: number | null;
  selectedSpecies: string;
  selectedEcosystem: string;

  setSelectedCounty: (val: string) => void;
  setStartYear: (val: number | null) => void;
  setEndYear: (val: number | null) => void;
  setSelectedSpecies: (val: string) => void;
  setSelectedEcosystem: (val: string) => void;
}

export default function FilterSidebar({
  dataset,
  setDataset,
  counties,
  years,
  speciesGroups,
  ecosystemTypes,
  selectedCounty,
  startYear,
  endYear,
  selectedSpecies,
  selectedEcosystem,
  setSelectedCounty,
  setStartYear,
  setEndYear,
  setSelectedSpecies,
  setSelectedEcosystem,
}: FilterSidebarProps) {

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

        {/* Dataset category */}
        <div className="tab active">
          Fishery Accounts
        </div>

      </div>


      {/* RIGHT PANEL */}
      <div className="sidebar-panel">


        {/* DATASET SELECTOR */}
        <div>
          <div className="filter-label">Fishery Type</div>

          <div className="button-group">

            <button
              type="button"
              className={dataset === "both" ? "filter-btn active" : "filter-btn"}
              onClick={() => setDataset("both")}
            >
              All
            </button>

            <button
              type="button"
              className={dataset === "comm" ? "filter-btn active" : "filter-btn"}
              onClick={() => setDataset("comm")}
            >
              Commercial
            </button>

            <button
              type="button"
              className={dataset === "noncomm" ? "filter-btn active" : "filter-btn"}
              onClick={() => setDataset("noncomm")}
            >
              Non-Commercial
            </button>

          </div>
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
              <option key={c} value={c}>
                {c}
              </option>
            ))}

          </select>
        </div>


        {/* YEAR RANGE */}
        <div>

          <div className="filter-label">Year Range</div>

          <div className="year-range" style={{ display: "flex", gap: "8px" }}>

            {/* START YEAR */}
            <select
              className="filter-select"
              value={startYear ?? ""}
              onChange={(e) => {

                const val =
                  e.target.value === ""
                    ? null
                    : Number(e.target.value);

                setStartYear(val);

                // Prevent end year < start year
                if (endYear !== null && val !== null && endYear < val) {
                  setEndYear(val);
                }

              }}
            >

              <option value="">Start</option>

              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}

            </select>


            {/* ARROW */}
            <div style={{ display: "flex", alignItems: "center" }}>
              →
            </div>


            {/* END YEAR */}
            <select
              className="filter-select"
              value={endYear ?? ""}
              onChange={(e) =>
                setEndYear(
                  e.target.value === ""
                    ? null
                    : Number(e.target.value)
                )
              }
            >

              <option value="">End</option>

              {years
                .filter((y) => startYear === null || y >= startYear)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}

            </select>

          </div>


          {/* RANGE DISPLAY */}
          <div style={{ fontSize: "12px", marginTop: "6px", color: "#aaa" }}>
            {startYear && endYear
              ? `Years: ${startYear} — ${endYear}`
              : "All Years"}
          </div>

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


      </div>
    </div>
  );
}
