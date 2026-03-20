import { render, screen } from "@testing-library/react";
import Dashboard from "../../pages/Dashboard";
import { describe, it, expect, vi } from "vitest";

vi.mock("../../components/dashboard/BusinessUnitSection", () => ({
  default: () => <div>MockBUSection</div>,
}));

vi.mock("../../components/dashboard/ProjectsSection", () => ({
  default: () => <div>MockProjectsSection</div>,
}));

describe("Dashboard", () => {
  it("renders heading and sections", () => {
    render(<Dashboard />);

    expect(screen.getByText(/Hi /)).toBeInTheDocument();
    expect(screen.getByText("MockBUSection")).toBeInTheDocument();
    expect(screen.getByText("MockProjectsSection")).toBeInTheDocument();
  });

  it("renders filter button", () => {
    render(<Dashboard />);

    expect(screen.getByText("Filter")).toBeInTheDocument();
  });
});