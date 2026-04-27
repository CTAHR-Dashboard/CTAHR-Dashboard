import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch so the dashboard loads sample ecosystem data
// without requiring the actual GeoJSON dataset during testing
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
              county: "Maui",
              species_group: "Crab",
              ecosystem_type: "Deep Sea",
              exchange_value: 2000,
            },
          },
        ],
      }),
  })
) as jest.Mock;

describe("Ecosystem Type filter", () => {

  // verifies that the ecosystem type filter section renders correctly
  // this confirms the dashboard creates filter buttons based on dataset values
  test("renders ecosystem type buttons", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    // check that the ecosystem filter label appears
    expect(await screen.findByText("Ecosystem Type")).toBeInTheDocument();

    // check that ecosystem buttons from the dataset appear
    expect(screen.getByRole("button", { name: "Reef" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deep Sea" })).toBeInTheDocument();
  });

  // verifies that selecting an ecosystem type activates the selected filter button
  // this simulates user interaction and confirms the selected ecosystem becomes active
  test("selecting an ecosystem type makes it active", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const reefButton = await screen.findByRole("button", { name: "Reef" });

    // simulate clicking the Reef ecosystem filter
    fireEvent.click(reefButton);

    // confirm the button now has the active styling class applied
    expect(reefButton).toHaveClass("active");
  });

});