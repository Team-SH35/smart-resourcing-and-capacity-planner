import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BusinessUnitSection from "../../components/dashboard/BusinessUnitSection";

// mock children
vi.mock("../../components/dashboard/BusinessUnitCard", () => ({
  default: () => <div>MockCard</div>,
}));

vi.mock("../../components/dashboard/AddUnitCard", () => ({
  default: () => <div>MockAdd</div>,
}));

vi.mock("../../components/dashboard/EmptyStateCard", () => ({
  default: () => <div>EmptyState</div>,
}));

// mock API
vi.mock("../../api/client", () => ({
  getBusinessUnits: vi.fn(),
  getEmployees: vi.fn(),
  getJobs: vi.fn(),
  getForecastEntries: vi.fn(),
}));

import {
  getBusinessUnits,
  getEmployees,
  getJobs,
  getForecastEntries,
} from "../../api/client";

describe("BusinessUnitSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading", async () => {
    vi.mocked(getBusinessUnits).mockImplementation(
        () => new Promise(() => {}) 
    );

    render(<BusinessUnitSection />);

    expect(
        screen.getByText(/Loading business units/)
    ).toBeInTheDocument();
    });

  it("renders units", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue(["Dev"]);
    vi.mocked(getEmployees).mockResolvedValue([
      { name: "John", specialisms: [], excludedFromAI: false },
    ]);
    vi.mocked(getJobs).mockResolvedValue([
      { jobCode: "A", businessUnit: "Dev" },
    ] as any);
    vi.mocked(getForecastEntries).mockResolvedValue([
      { jobCode: "A", employeeName: "John" },
    ] as any);

    render(<BusinessUnitSection />);

    expect(await screen.findByText("MockCard")).toBeInTheDocument();
    expect(screen.getByText("MockAdd")).toBeInTheDocument();
  });

  it("shows empty state", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);
    vi.mocked(getEmployees).mockResolvedValue([]);
    vi.mocked(getJobs).mockResolvedValue([]);
    vi.mocked(getForecastEntries).mockResolvedValue([]);

    render(<BusinessUnitSection />);

    expect(await screen.findByText("EmptyState")).toBeInTheDocument();
  });
});