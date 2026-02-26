"use client";
import "./dashboard.css";
import Image from "next/image";

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

export default function FilterSidebar(props: FilterSidebarProps) {
  const {
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
  } = props;

  // Helper to toggle active class
  const isActive = (val: string, selected: string) =>
    val === selected ? "filter-btn active" : "filter-btn";

  return (
    <aside className="sidebar">

      {/* LEFT TAB COLUMN */}
      <section className="sidebar-tabs">
        <div className="tabs-header">
          <Image src="/icon.png" alt="Lab Icon" width={150} height={32} />
          Hawaiʻi
          <div className="tabs-subtitle">Ecosystem Accounts</div>
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
      </section>

      {/* RIGHT PANEL */}
      <section className="sidebar-panel">

        {/* COUNTY */}
        <fieldset>
          <legend>County</legend>
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
        </fieldset>

        {/* YEAR */}
        <fieldset>
          <legend>Year</legend>
          <select
            className="filter-select"
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </fieldset>

        {/* SPECIES GROUP */}
        <FilterButtonGroup
          label="Species Group"
          options={speciesGroups}
          selected={selectedSpecies}
          setSelected={setSelectedSpecies}
        />

        {/* ECOSYSTEM TYPE */}
        <FilterButtonGroup
          label="Ecosystem Type"
          options={ecosystemTypes}
          selected={selectedEcosystem}
          setSelected={setSelectedEcosystem}
        />

      </section>
    </aside>
  );
}

// Reusable button group component
interface FilterButtonGroupProps {
  label: string;
  options: string[];
  selected: string;
  setSelected: (val: string) => void;
}

function FilterButtonGroup({ label, options, selected, setSelected }: FilterButtonGroupProps) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="button-group">
        <button
          type="button"
          className={selected === "" ? "filter-btn active" : "filter-btn"}
          onClick={() => setSelected("")}
        >
          All
        </button>
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            className={selected === opt ? "filter-btn active" : "filter-btn"}
            onClick={() => setSelected(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

