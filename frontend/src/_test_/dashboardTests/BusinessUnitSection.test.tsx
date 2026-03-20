import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BusinessUnitSection from "../../components/dashboard/BusinessUnitSection";

// ✅ import types
import type {
  Employee,
  JobCode,
  ForecastEntry,
} from "../../components/data/types";

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

// ✅ helper factories (typed)
const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  name: "John",
  specialisms: [],
  excludedFromAI: false,
  ...overrides,
});

const makeJob = (overrides: Partial<JobCode> = {}): JobCode => ({
  jobCode: "A",
  description: "Test Project",
  customerName: "Client",
  businessUnit: "Dev",
  startDate: "2024-01-01",
  finishDate: null,
  budgetCost: 0,
  ...overrides,
});

const makeForecast = (
  overrides: Partial<ForecastEntry> = {}
): ForecastEntry => ({
  employeeName: "John",
  customer: "Client",
  jobCode: "A",
  description: "Test Project",
  days: 5,
  cost: null,
  month: "January",
  ...overrides,
});

describe("BusinessUnitSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading", () => {
    vi.mocked(getBusinessUnits).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<BusinessUnitSection />);

    expect(
      screen.getByText(/Loading business units/)
    ).toBeInTheDocument();
  });

  it("renders units", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue(["Dev"]);
    vi.mocked(getEmployees).mockResolvedValue([
      makeEmployee({ name: "John" }),
    ]);
    vi.mocked(getJobs).mockResolvedValue([
      makeJob({ jobCode: "A", businessUnit: "Dev" }),
    ]);
    vi.mocked(getForecastEntries).mockResolvedValue([
      makeForecast({ jobCode: "A", employeeName: "John" }),
    ]);

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