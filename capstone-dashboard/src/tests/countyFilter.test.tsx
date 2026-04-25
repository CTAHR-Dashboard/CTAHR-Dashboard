import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// Mock fetch so the dashboard can load without needing the real dataset files.
// This lets us test the filter behavior by itself.
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
        ],
      }),
  })
) as jest.Mock;

describe("County filter", () => {

  // check that the county dropdown appears when the dashboard loads.
  test("county dropdown appears", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const dropdown = await screen.findByDisplayValue("All Counties");

    expect(dropdown).toBeInTheDocument();
  });

  // check that selecting a county changes the dropdown value correctly.
  test("selecting a county updates dropdown value", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const dropdown = await screen.findByDisplayValue("All Counties");

    // simulate selecting Hawaii from the dropdown
    fireEvent.change(dropdown, {
      target: { value: "Hawaii" },
    });

    expect(dropdown).toHaveValue("Hawaii");
  });

});