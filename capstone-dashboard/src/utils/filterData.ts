export type DashboardRow = {
  county: string;
  year: number;
  species_group: string;
  ecosystem_type: string;
  exchange_value?: number;
};

export type Filters = {
  county?: string;
  startYear?: number;
  endYear?: number;
  speciesGroup?: string;
  ecosystemType?: string;
};

export function filterData(data: DashboardRow[], filters: Filters): DashboardRow[] {
  return data.filter((item) => {
    const countyMatch = !filters.county || item.county === filters.county;
    const startYearMatch = filters.startYear === undefined || item.year >= filters.startYear;
    const endYearMatch = filters.endYear === undefined || item.year <= filters.endYear;
    const speciesMatch =
      !filters.speciesGroup || item.species_group === filters.speciesGroup;
    const ecosystemMatch =
      !filters.ecosystemType || item.ecosystem_type === filters.ecosystemType;

    return (
      countyMatch &&
      startYearMatch &&
      endYearMatch &&
      speciesMatch &&
      ecosystemMatch
    );
  });
}