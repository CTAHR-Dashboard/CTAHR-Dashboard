"use client";

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
  return (
    <div className="w-72 bg-white shadow-lg rounded-lg p-4 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-bold">Hawaiʻi</h1>
        <p className="text-sm text-gray-500">Ecosystem Accounts</p>
      </div>

      {/* Dataset Tabs */}
      <div className="flex flex-col gap-2">
        <button
          className={`px-3 py-2 rounded ${
            dataset === "noncomm" ? "bg-blue-500 text-white font-semibold" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setDataset("noncomm")}
        >
          Non-Commercial Fishery Values
        </button>

        <button
          className={`px-3 py-2 rounded ${
            dataset === "comm" ? "bg-blue-500 text-white font-semibold" : "bg-gray-100 text-gray-700"
          }`}
          onClick={() => setDataset("comm")}
        >
          Commercial Fishery Values
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">

        {/* County */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">County</label>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Year</label>
          <select
            value={selectedYear ?? ""}
            onChange={(e) =>
              setSelectedYear(e.target.value === "" ? null : Number(e.target.value))
            }
            className="border border-gray-300 rounded px-2 py-1"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Species Group */}
        <ButtonGroup
          label="Species Group"
          options={speciesGroups}
          selected={selectedSpecies}
          setSelected={setSelectedSpecies}
        />

        {/* Ecosystem Type */}
        <ButtonGroup
          label="Ecosystem Type"
          options={ecosystemTypes}
          selected={selectedEcosystem}
          setSelected={setSelectedEcosystem}
        />

      </div>
    </div>
  );
}

interface ButtonGroupProps {
  label: string;
  options: string[];
  selected: string;
  setSelected: (val: string) => void;
}

function ButtonGroup({ label, options, selected, setSelected }: ButtonGroupProps) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{label}</p>
      <div className="flex flex-wrap gap-2">
        <button
          className={`px-3 py-1 rounded ${
            selected === "" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
          onClick={() => setSelected("")}
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o}
            className={`px-3 py-1 rounded ${
              selected === o ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => setSelected(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

