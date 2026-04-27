import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch so the dashboard loads species group values
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

describe("Species Group filter", () => {

  // checks that the species group filter section renders correctly
  // confirms buttons are created based on species group values in the dataset
  test("renders species group buttons", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    expect(await screen.findByText("Species Group")).toBeInTheDocument();

    // confirm the default "All" button appears
    const allButtons = screen.getAllByRole("button", { name: "All" });
    expect(allButtons.length).toBeGreaterThan(0);

    // confirm dataset-generated species group buttons appear
    expect(screen.getByRole("button", { name: "Fish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crab" })).toBeInTheDocument();
  });

  // checks that selecting a species group activates the selected filter button
  // confirms the dashboard updates filter state after user interaction
  test("selecting a species makes it active", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const fishButton = await screen.findByRole("button", { name: "Fish" });

    // simulate clicking the Fish species group filter
    fireEvent.click(fishButton);

    // confirm the selected button becomes active
    expect(fishButton).toHaveClass("active");
  });

});