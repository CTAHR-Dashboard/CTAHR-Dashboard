import { filterData } from '../utils/filterData';

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

describe('filterData', () => {
  it('returns all rows when no filters are applied', () => {
    const result = filterData(mockData, {});
    expect(result).toHaveLength(3);
  });

  it('filters by county', () => {
    const result = filterData(mockData, { county: 'Oahu' });
    expect(result).toHaveLength(2);
    expect(result.every((row) => row.county === 'Oahu')).toBe(true);
  });

  it('filters by startYear', () => {
    const result = filterData(mockData, { startYear: 2021 });
    expect(result).toHaveLength(2);
    expect(result.every((row) => row.year >= 2021)).toBe(true);
  });

  it('filters by endYear', () => {
    const result = filterData(mockData, { endYear: 2021 });
    expect(result).toHaveLength(2);
    expect(result.every((row) => row.year <= 2021)).toBe(true);
  });

  it('filters by species group', () => {
    const result = filterData(mockData, { speciesGroup: 'Fish' });
    expect(result).toHaveLength(2);
    expect(result.every((row) => row.species_group === 'Fish')).toBe(true);
  });

  it('filters by ecosystem type', () => {
    const result = filterData(mockData, { ecosystemType: 'Coastal' });
    expect(result).toHaveLength(2);
    expect(result.every((row) => row.ecosystem_type === 'Coastal')).toBe(true);
  });

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