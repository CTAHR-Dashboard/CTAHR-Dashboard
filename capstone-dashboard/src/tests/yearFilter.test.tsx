import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch so the dashboard loads year values
// without requiring the real dataset during testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        type: "FeatureCollection",
        features: [
          {
            properties: {
              year: 2020,
              county: "Hawaii",
              species_group: "Fish",
              ecosystem_type: "Reef",
              exchange_value: 1000,
            },
          },
          {
            properties: {
              year: 2021,
              county: "Hawaii",
              species_group: "Fish",
              ecosystem_type: "Reef",
              exchange_value: 2000,
            },
          },
        ],
      }),
  })
) as jest.Mock;

describe("Year range filter", () => {

  // checks that the Year Range filter section renders correctly
  // confirms both start and end year dropdown selectors appear
  test("year range dropdowns appear", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    expect(await screen.findByText("Year Range")).toBeInTheDocument();

    // confirm the start year selector appears
    expect(screen.getByDisplayValue("Start")).toBeInTheDocument();

    // confirm the end year selector appears
    expect(screen.getByDisplayValue("End")).toBeInTheDocument();
  });

  // checks that selecting start and end years updates the dropdown values
  // confirms the year range filter responds correctly to user interaction
  test("selecting start and end years updates dropdown values", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const startDropdown = await screen.findByDisplayValue("Start");
    const endDropdown = screen.getByDisplayValue("End");

    // simulate selecting a start year
    fireEvent.change(startDropdown, {
      target: { value: "2020" },
    });

    // simulate selecting an end year
    fireEvent.change(endDropdown, {
      target: { value: "2021" },
    });

    // confirm both dropdown values update correctly
    expect(startDropdown).toHaveValue("2020");
    expect(endDropdown).toHaveValue("2021");
  });

});