// Main dashboard component that loads GeoJSON and CSV data, manages filter state, and renders the map and sidebar.
"use client";

import { useEffect, useState } from "react";
import Map from "../map/Map";
import CommMap from "../map/CommMap";
import "./dashboard.css";
import FilterSidebar from "./FilterSidebar";
import CommFisheriesDashboard from "./commFisheriesMap";

interface DashboardProps {
  geoJsonPath: string;
  datasetLabel: string;
}

interface CsvRow {
  year: number;
  county: string;
  species_group: string;
  ecosystem_type: string;
  exchange_value: number;
}

interface GeoPolygon {
  year: number[];
  area_id: string;
  county_olelo: string;
  species_group: string[];
  ecosystem_type: string[];
  exchange_value: number[];
}

export default function EcosystemDashboard({
  geoJsonPath,
  datasetLabel,
}: DashboardProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [geoDataComm, setGeoDataComm] = useState<any>(null); // created by Micaiah - is for comm geojson
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [dataset, setDataset] = useState<"noncomm" | "comm">("noncomm");

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState("");

  // variables for comm (created by Micaiah)

  const [commCounties, setCommCounties] = useState<string[]>([]);
  const [commYears, setCommYears] = useState<number[]>([]);
  const [commSpecies, setCommSpecies] = useState<string[]>([]);
  const [commEcosystem, setCommEcosystem] = useState<string[]>([]);

  // end variables for comm

  // -------------------------------------------------
  // LOAD GEOJSON + CSV (DATASET DEPENDENT)
  // -------------------------------------------------
  useEffect(() => {
    async function loadData() {

      if (dataset == "noncomm") {
        // this is Pelita's branch.
        const geoRes = await fetch(geoJsonPath);
        const geo = await geoRes.json();

        const csvPath =
          dataset === "noncomm"
            ? "/fisheriesdata/20260216_tidied_noncomm_ev.csv"
            : "/fisheriesdata/20260216_tidied_comm_ev.csv";

        const csvRes = await fetch(csvPath);
        const csvText = await csvRes.text();

        const lines = csvText.split("\n").filter((r) => r.trim() !== "");

        const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

        const parsed: CsvRow[] = lines.slice(1).map((line) => {
          const values = line.split(",");

          const row: any = {};

          headers.forEach((header, index) => {
            row[header] = values[index]?.replace(/"/g, "").trim();
          });

          let county = row["county"];

          // Normalize Lanai / Molokai into Maui
          if (county === "Lanai" || county === "Molokai") {
            county = "Maui";
          }

          return {
            year: Number(row["year"]),
            county,
            species_group: row["species_group"],
            ecosystem_type: row["ecosystem_type"],
            exchange_value: Number(row["exchange_value"]) || 0,
          };
        });

        setGeoData(geo);
        setCsvData(parsed);

        // Reset filters when dataset changes
        setSelectedCounty("");
        setSelectedYear(null);
        setSelectedSpecies("");
        setSelectedEcosystem("");

      } else if (dataset == "comm") {
        // this is Micaiah's branch. simply fetch the geojson! everything is aggreated
        fetch("fisheriesdata/20260126_comm_ev_byMoku.geojson")
        // fetch("fisheriesdata/test.geojson")
        .then((response) => response.json())
        .then((data) => {
          setGeoDataComm(data)
          let geoDataCleaned: GeoPolygon[]
          geoDataCleaned = data.features.map((polygon: {properties: any}) => polygon.properties)
          console.log(geoDataCleaned)

          setCommCounties([...new Set(geoDataCleaned.map((d) => d.county_olelo))])
          setCommYears([...new Set(geoDataCleaned[0].year)].sort())
          setCommSpecies([...new Set(geoDataCleaned[0].species_group)])
          setCommEcosystem([...new Set(geoDataCleaned[0].ecosystem_type)])
        })
      }
    }

    loadData();
  }, [geoJsonPath, dataset]);

  if ((dataset == "noncomm" && !geoData) || (dataset == "comm" && !geoDataComm)) return <div>Loading {datasetLabel}...</div>;

  // FILTERING FUNCTIONALITY HERE

  // --> aggregatedGeoJSON is Pelita's (for noncomm data)
  // --> aggregatedCommGeoJSON is Micaiah's (for comm data)

  let aggregatedGeoJSON, aggregatedCommGeoJSON

  // this is for Pelita
  let counties: String[]
  let years: number[]
  let speciesGroups: String[]
  let ecosystemTypes : String[]

  if (dataset == "noncomm") {
    // pelita's filtering here

    // -------------------------------------------------
    // DERIVE FILTER VALUES FROM CSV
    // -------------------------------------------------

    counties = [...new Set(csvData.map((d) => d.county))];
    years = [...new Set(csvData.map((d) => d.year))].sort();
    speciesGroups = [...new Set(csvData.map((d) => d.species_group))];
    ecosystemTypes = [...new Set(csvData.map((d) => d.ecosystem_type))];

    // -------------------------------------------------
    // APPLY FILTERS TO CSV
    // -------------------------------------------------
    const filteredRows = csvData.filter((row) => {
      return (
        (selectedYear === null || row.year === selectedYear) &&
        (selectedCounty === "" || row.county === selectedCounty) &&
        (selectedSpecies === "" || row.species_group === selectedSpecies) &&
        (selectedEcosystem === "" || row.ecosystem_type === selectedEcosystem)
      );
    });

    // -------------------------------------------------
    // AGGREGATE BY COUNTY
    // -------------------------------------------------
    const totalsByCounty: Record<string, number> = {};

    filteredRows.forEach((row) => {
      totalsByCounty[row.county] = (totalsByCounty[row.county] || 0) + row.exchange_value;
    });

    // -------------------------------------------------
    // ATTACH TOTALS TO GEOJSON
    // -------------------------------------------------
    const aggregatedFeatures = geoData.features.map((feature: any) => {
      const county = feature.properties.county;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          total_exchange_value: totalsByCounty[county] || 0,
        },
      };
    });

    aggregatedGeoJSON = {
      ...geoData,
      features: aggregatedFeatures,
    };
  } else {
    // micaiah's filtering here

    const raw_features = geoDataComm.features
    const geoDataCleaned = raw_features.map((polygon: { properties: any }, ind) => {return {...polygon.properties, index: ind}})
      .filter((item: any) => ((selectedCounty == "") || item.county_olelo == selectedCounty))
      .map((item: any) => {
        let finalIndices = []
        for (let ind = 0; ind < item.year.length; ind++) {
          if ((!selectedYear || item.year[ind] == selectedYear) && 
          (!selectedSpecies || item.species_group[ind] == selectedSpecies) && 
          (!selectedEcosystem || item.ecosystem_type[ind] == selectedEcosystem)) {
            finalIndices.push(ind)
          }
        }

        const exchange_value_list = finalIndices.map(ind => item.exchange_value[ind])

        const innerJSON = {
          ...item,
          year: finalIndices.map(ind => item.year[ind]),
          species_group: finalIndices.map(ind => item.species_group[ind]),
          ecosystem_type: finalIndices.map(ind => item.ecosystem_type[ind]),
          exchange_value: exchange_value_list,
          total_exchange_value: exchange_value_list.reduce((acc, curr) => ((curr != -1) ? acc + curr : acc), 0)
        }

        return ({
          type: "Feature",
          properties: innerJSON,
          geometry: raw_features[item.index].geometry
        })
      })

      aggregatedCommGeoJSON = {
        ...geoDataComm,
        features: geoDataCleaned
      }

      console.log(JSON.stringify(aggregatedCommGeoJSON))
  }
  

  function buildCsvFromRows(rowsForCsv: CsvRow[]) {
    if (rowsForCsv.length === 0) return "";

    const csvColumnOrder: (keyof CsvRow)[] = [
      "year",
      "county",
      "species_group",
      "ecosystem_type",
      "exchange_value",
    ];

    const escapeCsvCell = (cellValue: unknown) => {
      const cellText = String(cellValue ?? "");
      const needsQuotes = /[",\n"]/.test(cellText);
      return needsQuotes ? `"${cellText.replace(/"/g, '""')}"` : cellText;
    };

    const headerRow = csvColumnOrder.join(",");
    const dataRows = rowsForCsv.map((row) =>
      csvColumnOrder.map((col) => escapeCsvCell(row[col])).join(",")
    );

    return [headerRow, ...dataRows].join("\n");
  }

  function triggerCsvDownload(csvFilename: string, csvContents: string) {
  const csvWithWindowsNewlines = csvContents.replace(/\n/g, "\r\n");
  const csvWithBom = "\uFEFF" + csvWithWindowsNewlines; // helps Excel + UTF-8

  const fileBlob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const fileUrl = URL.createObjectURL(fileBlob);

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = fileUrl;
  downloadAnchor.download = csvFilename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  URL.revokeObjectURL(fileUrl);
}

  const handleDownload = (
    downloadMode: "ALL_SEPARATE" | "ONE_COUNTY",
    county?: string
  ) => {

    const safe = (s: string) => s.replace(/[^\w\-]+/g, "_");

    const filenameBaseParts = [
      selectedYear ?? "all-years",
      selectedSpecies || "all-species",
      selectedEcosystem || "all-ecosystems",
    ];

    if (downloadMode === "ONE_COUNTY") {
      if (!county) return;
      const countyRows = filteredRows.filter((r) => r.county === county);
      const csv = buildCsvFromRows(countyRows);
      const filename = `${[dataset, safe(county), ...filenameBaseParts].join("_")}.csv`;
      triggerCsvDownload(filename, csv);
      return;
    }

    // ALL_SEPARATE: download each county separately
    const rowsGroupedByCounty: Record<string, CsvRow[]> = {};
    filteredRows.forEach((row) => {
      const countyName = row.county || "Unknown";
      (rowsGroupedByCounty[countyName] ||= []).push(row);
    });

    Object.entries(rowsGroupedByCounty).forEach(([countyName, countyRows], index) => {
      const csv = buildCsvFromRows(countyRows);
      const filename = `${[dataset, safe(countyName), ...filenameBaseParts].join("_")}.csv`;

      // small stagger helps browsers allow multiple downloads
      window.setTimeout(() => triggerCsvDownload(filename, csv), index * 250);
    });
  };

  return (
    <div className="dashboard-container">
      {(dataset == "noncomm") ? (
        /* this is Pelita's noncomm sidebar. */
        <FilterSidebar
          dataset={dataset}
          setDataset={setDataset}
          counties={counties}
          years={years}
          speciesGroups={speciesGroups}
          ecosystemTypes={ecosystemTypes}
          selectedCounty={selectedCounty}
          selectedYear={selectedYear}
          selectedSpecies={selectedSpecies}
          selectedEcosystem={selectedEcosystem}
          setSelectedCounty={setSelectedCounty}
          setSelectedYear={setSelectedYear}
          setSelectedSpecies={setSelectedSpecies}
          setSelectedEcosystem={setSelectedEcosystem}
          onDownload={handleDownload}
        />
      ) : (
        /* this is Micaiah's comm sidebar. */
        <FilterSidebar
          dataset={dataset}
          setDataset={setDataset}
          counties={commCounties}
          years={commYears}
          speciesGroups={commSpecies}
          ecosystemTypes={commEcosystem}
          selectedCounty={selectedCounty}
          selectedYear={selectedYear}
          selectedSpecies={selectedSpecies}
          selectedEcosystem={selectedEcosystem}
          setSelectedCounty={setSelectedCounty}
          setSelectedYear={setSelectedYear}
          setSelectedSpecies={setSelectedSpecies}
          setSelectedEcosystem={setSelectedEcosystem}
          onDownload={handleDownload}
        />
        /*<p>oops</p>*/
      )}
      
      
      {(dataset == "noncomm") ? (
        <div className="map-wrapper">
          <Map
            geoData={aggregatedGeoJSON}
            selectedCounty={selectedCounty}
            selectedYear={selectedYear}
            selectedSpecies={selectedSpecies}
            selectedEcosystem={selectedEcosystem}
          />
        </div>) : (
          <div className="map-wrapper">
            { /* this is micaiah's */ }
            <CommMap
              geoData={aggregatedCommGeoJSON}
              selectedCounty={selectedCounty}
              selectedYear={selectedYear}
              selectedSpecies={selectedSpecies}
              selectedEcosystem={selectedEcosystem}
            />
          </div>
        )
      }
    </div>
  );
}