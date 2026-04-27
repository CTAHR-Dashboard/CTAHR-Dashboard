import { filterData } from '../utils/filterData';

// mock dataset used to test filtering behavior
// includes multiple counties, years, species groups, and ecosystem types
// so each filter condition can be verified independently
const mockData = [
  {
    county: 'Oahu',
    year: 2020,
    species_group: 'Fish',
    ecosystem_type: 'Marine',
    exchange_value: 100,
  },
  {
    county: 'Maui',
    year: 2021,
    species_group: 'Crab',
    ecosystem_type: 'Coastal',
    exchange_value: 200,
  },
  {
    county: 'Oahu',
    year: 2022,
    species_group: 'Fish',
    ecosystem_type: 'Coastal',
    exchange_value: 300,
  },
];

describe('filterData utility function', () => {

  // verifies that the function returns all dataset rows
  // when no filters are applied
  // confirms default behavior does not remove any data
  it('returns all rows when no filters are applied', () => {
    const result = filterData(mockData, {});
    expect(result).toHaveLength(3);
  });

  // verifies filtering by county removes rows from other counties
  // confirms the county filter condition works correctly
  it('filters by county', () => {
    const result = filterData(mockData, { county: 'Oahu' });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.county === 'Oahu')).toBe(true);
  });

  // verifies filtering by starting year removes earlier rows
  // confirms year lower-bound filtering logic works correctly
  it('filters by startYear', () => {
    const result = filterData(mockData, { startYear: 2021 });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.year >= 2021)).toBe(true);
  });

  // verifies filtering by ending year removes later rows
  // confirms year upper-bound filtering logic works correctly
  it('filters by endYear', () => {
    const result = filterData(mockData, { endYear: 2021 });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.year <= 2021)).toBe(true);
  });

  // verifies filtering by species group returns only matching species
  // confirms species-based filtering logic works correctly
  it('filters by species group', () => {
    const result = filterData(mockData, { speciesGroup: 'Fish' });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.species_group === 'Fish')).toBe(true);
  });

  // verifies filtering by ecosystem type returns only matching ecosystem values
  // confirms ecosystem-type filtering logic works correctly
  it('filters by ecosystem type', () => {
    const result = filterData(mockData, { ecosystemType: 'Coastal' });

    expect(result).toHaveLength(2);
    expect(result.every((row) => row.ecosystem_type === 'Coastal')).toBe(true);
  });

  // verifies multiple filters applied together narrow results correctly
  // confirms combined filtering logic behaves as expected
  it('applies multiple filters together', () => {
    const result = filterData(mockData, {
      county: 'Oahu',
      speciesGroup: 'Fish',
      ecosystemType: 'Marine',
    });

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      county: 'Oahu',
      year: 2020,
      species_group: 'Fish',
      ecosystem_type: 'Marine',
      exchange_value: 100,
    });
  });

});