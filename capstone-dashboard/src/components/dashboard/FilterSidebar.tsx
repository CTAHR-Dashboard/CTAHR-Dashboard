// Side bar component for dataset selection and filtering. 
// Contains dataset toggle, county/year dropdowns, and species/ecosystem button groups. 
// Updates parent state on user interaction to trigger map updates.
"use client";
import "./dashboard.css";
import Image from "next/image";
import { useEffect, useState } from "react";

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
}: FilterSidebarProps) {

  // Files available to download 
  const noncommFiles = [
    { label: "Non-Commercial CSV", path: "/fisheriesdata/20260216_tidied_noncomm_ev.csv" },
    { label: "Moku Extents CSV", path: "/mokuextentsdata/moku.csv" }, // <-- change filename if needed
  ];

  const commFiles = [
    { label: "Commercial CSV", path: "/fisheriesdata/20260216_tidied_comm_ev.csv" },
  ];

  const files = dataset === "noncomm" ? noncommFiles : commFiles;

  // Selected file for dropdown
  const [selectedFile, setSelectedFile] = useState<string>(files[0]?.path ?? "");

  // When user switches tabs, reset the dropdown to the first option
  useEffect(() => {
    setSelectedFile(files[0]?.path ?? "");
  }, [dataset]); // eslint-disable-line react-hooks/exhaustive-deps

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

        {/* DOWNLOAD DATA */}
        <div>
          <div className="filter-label">Download Data</div>

          <select
            className="filter-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
          >
            {files.map((f) => (
              <option key={f.path} value={f.path}>
                {f.label}
              </option>
            ))}
          </select>

          <div className="button-group" style={{ marginTop: 10 }}>
            <a href={selectedFile} download className="filter-btn">
              Download CSV
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}