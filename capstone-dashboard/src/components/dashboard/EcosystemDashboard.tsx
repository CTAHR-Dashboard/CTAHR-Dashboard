"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";

const Map = dynamic(() => import("../map/Map"), { ssr: false });

interface DashboardProps {
  datasetLabel: string;
}

export default function EcosystemDashboard({ datasetLabel }: DashboardProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [dataset, setDataset] = useState<"noncomm" | "comm">("noncomm");

  const [selectedYearStart, setSelectedYearStart] = useState<number | null>(null);
  const [selectedYearEnd, setSelectedYearEnd] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // prevent Leaflet crash
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ---------------------------------------------
  // LOAD GEOJSON BASED ON DATASET
  // ---------------------------------------------
  useEffect(() => {
    async function loadData() {
      const geoPath =
        dataset === "noncomm"
          ? "/fisheriesdata/20260216_tidied_noncomm_ev.geojson"
          : "/fisheriesdata/20260126_comm_ev_byMoku.geojson";

      const res = await fetch(geoPath);
      const geo = await res.json();

      setGeoData(geo);

      // reset filters
      setSelectedCounty("");
      setSelectedYearStart(null);
      setSelectedYearEnd(null);
      setSelectedSpecies("");
      setSelectedEcosystem("");
    }

    loadData();
  }, [dataset]);

  if (!geoData) return <div>Loading {datasetLabel}...</div>;

  // ---------------------------------------------
  // CLEAN STRING (SAFE FOR ALL TYPES)
  // ---------------------------------------------
  const cleanString = (val: any): string => {
    if (!val) return "";

    // handle arrays (comm dataset)
    if (Array.isArray(val)) {
      return val.map(v => cleanString(v)).join(", ");
    }

    // force string
    const str = String(val);

    let cleaned = str.replace(/\s+/g, " ").trim();

    // fix duplicated strings
    const half = cleaned.substring(0, cleaned.length / 2);
    if (cleaned === half + half) {
      cleaned = half;
    }

    return cleaned;
  };

  // ---------------------------------------------
  // EXTRACT VALUES FROM GEOJSON
  // ---------------------------------------------
  const allFeatures = geoData?.features ?? [];

  const countySet = new Set<string>();
  const yearSet = new Set<number>();
  const speciesSet = new Set<string>();
  const ecosystemSet = new Set<string>();

  allFeatures.forEach((f: any) => {
    const p = f.properties;

    if (p.county) {
      countySet.add(cleanString(p.county));
    }

    // NONCOMM (flat)
    if (dataset === "noncomm") {
      if (p.year) yearSet.add(Number(p.year));

      if (p.species_group) {
        speciesSet.add(cleanString(p.species_group));
      }

      if (p.ecosystem_type) {
        ecosystemSet.add(cleanString(p.ecosystem_type));
      }
    }

    // COMM (array-based)
    if (dataset === "comm") {
      const years = p.year || [];
      const species = p.species_group || [];
      const ecosystems = p.ecosystem_type || [];

      for (let i = 0; i < years.length; i++) {
        if (years[i]) yearSet.add(Number(years[i]));

        if (species[i]) {
          speciesSet.add(cleanString(species[i]));
        }

        if (ecosystems[i]) {
          ecosystemSet.add(cleanString(ecosystems[i]));
        }
      }
    }
  });

  const counties = Array.from(countySet).sort();
  const years = Array.from(yearSet).sort();
  const speciesGroups = Array.from(speciesSet).sort();
  const ecosystemTypes = Array.from(ecosystemSet).sort();

  // ---------------------------------------------
  // FILTER FEATURES (NONCOMM ONLY)
  // ---------------------------------------------
  const filteredFeatures =
    dataset === "noncomm"
      ? allFeatures.filter((f: any) => {
          const p = f.properties;

          return (
            (selectedYearStart === null || p.year >= selectedYearStart) &&
            (selectedYearEnd === null || p.year <= selectedYearEnd) &&
            (selectedCounty === "" || p.county === selectedCounty) &&
            (selectedSpecies === "" ||
              cleanString(p.species_group) === selectedSpecies) &&
            (selectedEcosystem === "" ||
              cleanString(p.ecosystem_type) === selectedEcosystem)
          );
        })
      : allFeatures;

  // ---------------------------------------------
  // AGGREGATE VALUES (NONCOMM)
  // ---------------------------------------------
  const totalsByCounty: Record<string, number> = {};

  if (dataset === "noncomm") {
    filteredFeatures.forEach((f: any) => {
      const county = f.properties.county;
      const value = f.properties.exchange_value || 0;

      totalsByCounty[county] =
        (totalsByCounty[county] || 0) + value;
    });
  }

  // ---------------------------------------------
  // ATTACH TOTALS
  // ---------------------------------------------
  const aggregatedFeatures = allFeatures.map((feature: any) => {
    const county = feature.properties.county;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        total_exchange_value:
          dataset === "noncomm"
            ? totalsByCounty[county] || 0
            : 0,
      },
    };
  });

  const aggregatedGeoJSON = {
    ...geoData,
    features: aggregatedFeatures,
  };

  const handleCountyClick = (county: string) => {
    setSelectedCounty(selectedCounty === county ? "" : county);
  };

  return (
    <div className="dashboard-container">
      <FilterSidebar
        dataset={dataset}
        setDataset={setDataset}
        counties={counties}
        years={years}
        speciesGroups={speciesGroups}
        ecosystemTypes={ecosystemTypes}
        selectedCounty={selectedCounty}
        selectedYearStart={selectedYearStart}
        selectedYearEnd={selectedYearEnd}
        selectedSpecies={selectedSpecies}
        selectedEcosystem={selectedEcosystem}
        setSelectedCounty={setSelectedCounty}
        setSelectedYearStart={setSelectedYearStart}
        setSelectedYearEnd={setSelectedYearEnd}
        setSelectedSpecies={setSelectedSpecies}
        setSelectedEcosystem={setSelectedEcosystem}
      />

      <div className="map-wrapper">
        {isMounted && (
          <Map
            geoData={aggregatedGeoJSON}
            mapType={dataset}
            selectedCounty={selectedCounty}
            selectedYearStart={selectedYearStart}
            selectedYearEnd={selectedYearEnd}
            selectedSpecies={selectedSpecies}
            selectedEcosystem={selectedEcosystem}
            onCountyClick={handleCountyClick}
          />
        )}
      </div>
    </div>
  );
}
