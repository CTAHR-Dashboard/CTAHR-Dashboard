import { render, screen } from "@testing-library/react";
import FilterSidebar from "../FilterSidebar";

describe("FilterSidebar", () => {
  test("renders the Oleson Lab logo", () => {
    render(<FilterSidebar />);

    const logo = screen.getByAltText("Oleson Lab");
    expect(logo).toBeInTheDocument();
  });

  test("renders the dashboard title", () => {
    render(<FilterSidebar />);

    expect(screen.getByText("Hawaiʻi")).toBeInTheDocument();
    expect(screen.getByText("Ecosystem Accounts")).toBeInTheDocument();
  });

  test("renders Fisheries as the active section", () => {
    render(<FilterSidebar />);

    expect(screen.getByText("Fisheries")).toBeInTheDocument();
  });
});