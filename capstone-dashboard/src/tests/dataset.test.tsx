import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch responses so the dashboard can load test data
// without needing the real GeoJSON dataset files
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

  // verifies that the county dropdown filter appears when the dashboard loads
  // this confirms that the filter UI renders correctly using the dataset values
  test("county dropdown appears", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    // look for the default dropdown option shown before any selection is made
    const dropdown = await screen.findByDisplayValue("All Counties");

    // confirm the dropdown exists in the document
    expect(dropdown).toBeInTheDocument();
  });

  // verifies that selecting a county from the dropdown updates the selected value
  // this simulates a user interacting with the county filter and confirms
  // that the component state updates correctly after the selection
  test("selecting a county updates dropdown value", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const dropdown = await screen.findByDisplayValue("All Counties");

    // simulate selecting "Hawaii" from the dropdown menu
    fireEvent.change(dropdown, {
      target: { value: "Hawaii" },
    });

    // confirm that the dropdown now reflects the selected county
    expect(dropdown).toHaveValue("Hawaii");
  });

});