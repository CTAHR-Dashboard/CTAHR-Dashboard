import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock the Map component so we can simulate clicking a region
// without needing the Leaflet environment during testing
jest.mock("../components/map/Map", () => {
  return function MockMap(props: { onCountyClick?: (county: string) => void }) {
    return (
      <button
        onClick={() => props.onCountyClick?.("Hawaii")}
      >
        Mock Map Region
      </button>
    );
  };
});

// mock fetch so the dashboard can load dataset values
// without requiring the real GeoJSON file
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

describe("Map interaction opens Data View panel", () => {

  // checks that clicking a region on the map switches the interface
  // to the Data View tab after a county is selected
  test("clicking a map region switches to Data View tab", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    // simulate clicking a county region on the map
    const mapButton = await screen.findByText("Mock Map Region");
    fireEvent.click(mapButton);

    // confirm that the Data View tab becomes active after the click
    const dataViewTab = screen.getByRole("button", {
      name: "Data View",
    });

    expect(dataViewTab).toHaveClass("active");
  });

});
