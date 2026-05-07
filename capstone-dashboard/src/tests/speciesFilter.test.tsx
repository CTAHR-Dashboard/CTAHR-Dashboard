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

  // checks that buttons are created based on species group values in the dataset
  test("renders one button per species group", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    expect(await screen.findByText("Species Group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fish" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crab" })).toBeInTheDocument();
  });

  // checks that the first species group is selected by default when no
  // aggregate row (e.g. "All Species") exists in the data
  test("defaults to the first species group when no aggregate row exists", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const crabButton = await screen.findByRole("button", { name: "Crab" });
    expect(crabButton).toHaveClass("active");
  });

  // checks that selecting a species group activates the selected filter button
  test("selecting a species makes it active", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const fishButton = await screen.findByRole("button", { name: "Fish" });
    fireEvent.click(fishButton);
    expect(fishButton).toHaveClass("active");
  });

});