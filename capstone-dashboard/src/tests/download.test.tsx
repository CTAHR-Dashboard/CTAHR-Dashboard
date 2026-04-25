import { render, screen, fireEvent } from "@testing-library/react";
import EcosystemDashboard from "../components/dashboard/EcosystemDashboard";

// mock fetch responses so the dashboard can load sample test data
// without needing the real GeoJSON files during testing
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

describe("Download CSV controls", () => {
  // checks that the download button starts disabled
  // this prevents users from downloading before selecting a county
  test("download button is disabled before choosing a county", async () => {
    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const button = await screen.findByRole("button", { name: "Download CSV" });

    expect(button).toBeDisabled();
  });

  // checks that selecting a county enables the download button
  // this confirms the dashboard only allows downloads after a valid filter choice
  test("download button becomes enabled after choosing a county", async () => {
    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const countyDropdown = await screen.findByDisplayValue("Choose a county…");

    fireEvent.change(countyDropdown, {
      target: { value: "Hawaii" },
    });

    const button = screen.getByRole("button", { name: "Download CSV" });

    expect(button).toBeEnabled();
  });

  // checks that clicking the enabled button creates and triggers a CSV download
  // this mocks the browser download behavior so the test can verify the logic
  // without actually saving a file
  test("clicking download creates a CSV download link", async () => {
    const createObjectURLMock = jest.fn(() => "mock-url");
    const revokeObjectURLMock = jest.fn();

    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = jest.fn();
    const originalCreateElement = document.createElement.bind(document);

    jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName) as HTMLAnchorElement;

      // replace the anchor click behavior with a mock function
      // so we can confirm the download link was triggered
      if (tagName === "a") {
        element.click = clickMock;
      }

      return element;
    });

    render(
      <EcosystemDashboard
        geoJsonPath="/mock.geojson"
        datasetLabel="Test Dataset"
      />
    );

    const countyDropdown = await screen.findByDisplayValue("Choose a county…");

    fireEvent.change(countyDropdown, {
      target: { value: "Hawaii" },
    });

    const button = screen.getByRole("button", { name: "Download CSV" });

    fireEvent.click(button);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});