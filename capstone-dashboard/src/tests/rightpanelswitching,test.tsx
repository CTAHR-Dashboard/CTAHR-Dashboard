import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch so the dashboard loads without needing the real dataset
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        type: "FeatureCollection",
        features: [],
      }),
  })
) as jest.Mock;

describe("Right panel tab switching", () => {

  // checks that the Filter tab is selected by default when the dashboard loads
  // confirms the correct initial tab state of the right-side panel
  test("Filter tab is active by default", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const filterTab = await screen.findByRole("button", { name: "Filter" });

    expect(filterTab).toHaveClass("active");
  });

  // checks that clicking the Data View tab switches the active panel
  // simulates user interaction with the tab navigation controls
  test("clicking Data View switches tabs", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const dataViewTab = await screen.findByRole("button", { name: "Data View" });

    // simulate clicking the Data View tab
    fireEvent.click(dataViewTab);

    // confirm the Data View tab becomes the active panel
    expect(dataViewTab).toHaveClass("active");
  });

});