import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch so the dashboard component can load without requiring
// the actual GeoJSON dataset during testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        type: "FeatureCollection",
        features: [],
      }),
  })
) as jest.Mock;

describe("Dataset selector", () => {

  // verifies that the dataset selector defaults to the Non-Commercial dataset
  // when the dashboard first loads, confirming the correct initial state
  test("defaults to Non-Commercial dataset", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const selector = await screen.findByDisplayValue("Non-Commercial");

    expect(selector).toBeInTheDocument();
  });

  // verifies that selecting the Commercial dataset updates the selector value
  // this simulates a user switching datasets and confirms the component state
  // updates correctly after interaction with the dataset dropdown
  test("switches dataset to Commercial when selected", async () => {

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const selector = await screen.findByDisplayValue("Non-Commercial");

    // simulate selecting the Commercial dataset from the dropdown
    fireEvent.change(selector, {
      target: { value: "comm" },
    });

    // confirm that the selector now reflects the Commercial dataset
    expect(selector).toHaveValue("comm");
  });

});