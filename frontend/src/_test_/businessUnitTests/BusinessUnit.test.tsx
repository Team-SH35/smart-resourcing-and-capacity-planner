import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";

import BusinessUnit from "../../pages/BusinessUnit";
import EmployeeByBUCard from "../../components/businessUnit/EmployeeByBUCard";
import * as api from "../../api/client";

import type {
  Employee,
  JobCode,
  ForecastEntry,
} from "../../components/data/types";

// --------------------
// Router mock (simple + stable)
// --------------------
const mockUseParams = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => mockUseParams(),
}));

// --------------------
// Component mock (FIXED typing)
// --------------------
type CardProps = ComponentProps<typeof EmployeeByBUCard>;

const mockCard = vi.fn<(props: CardProps) => void>();

vi.mock("../../components/businessUnit/EmployeeByBUCard", () => ({
  default: (props: CardProps) => {
    mockCard(props);
    return <div>MockCard</div>;
  },
}));

// --------------------
// API mock (Vitest-safe)
// --------------------
vi.mock("../../api/client");

const mockedApi = vi.mocked(api);

// --------------------
// Test data factories (fully typed)
// --------------------
const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  name: "John Doe",
  specialisms: ["Developer"],
  excludedFromAI: false,
  ...overrides,
});

const makeJob = (overrides: Partial<JobCode> = {}): JobCode => ({
  jobCode: "A",
  description: "Project A",
  customerName: "Client",
  businessUnit: "Developers",
  startDate: "2024-01-01",
  ...overrides,
});

const makeForecast = (
  overrides: Partial<ForecastEntry> = {}
): ForecastEntry => ({
  employeeName: "John Doe",
  customer: "Client",
  jobCode: "A",
  description: "Project A",
  days: 5,
  cost: null,
  month: new Date().toLocaleString("default", { month: "long" }),
  ...overrides,
});

// --------------------
// Tests
// --------------------
describe("BusinessUnit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ unit: "Developers" });
  });

  it("shows loading initially", () => {
    mockedApi.getEmployees.mockResolvedValue([]);
    mockedApi.getJobs.mockResolvedValue([]);
    mockedApi.getForecastEntries.mockResolvedValue([]);

    render(<BusinessUnit />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders business unit title after load", async () => {
    mockedApi.getEmployees.mockResolvedValue([makeEmployee()]);
    mockedApi.getJobs.mockResolvedValue([makeJob()]);
    mockedApi.getForecastEntries.mockResolvedValue([makeForecast()]);

    render(<BusinessUnit />);

    expect(await screen.findByText("Developers")).toBeInTheDocument();
  });

  it("filters employees by business unit correctly", async () => {
    mockedApi.getEmployees.mockResolvedValue([
      makeEmployee({ name: "John Doe" }),
      makeEmployee({ name: "Jane Smith" }),
    ]);

    mockedApi.getJobs.mockResolvedValue([
      makeJob({ jobCode: "A", businessUnit: "Developers" }),
      makeJob({ jobCode: "B", businessUnit: "Analytics" }),
    ]);

    mockedApi.getForecastEntries.mockResolvedValue([
      makeForecast({ employeeName: "John Doe", jobCode: "A" }),
      makeForecast({ employeeName: "Jane Smith", jobCode: "B" }),
    ]);

    render(<BusinessUnit />);

    await screen.findByText("MockCard");

    expect(mockCard).toHaveBeenCalled();

    const propsPassed = mockCard.mock.calls[0][0];

    expect(propsPassed.employees).toHaveLength(1);
    expect(propsPassed.employees[0].name).toBe("John Doe");
  });

  it("passes filters and sort state to child", async () => {
    mockedApi.getEmployees.mockResolvedValue([makeEmployee()]);
    mockedApi.getJobs.mockResolvedValue([makeJob()]);
    mockedApi.getForecastEntries.mockResolvedValue([makeForecast()]);

    render(<BusinessUnit />);

    await screen.findByText("MockCard");

    const propsPassed = mockCard.mock.calls[0][0];

    expect(propsPassed.filterName).toBe("");
    expect(propsPassed.filterSpecialism).toBe("");
    expect(propsPassed.filterAllocation).toBe("");
    expect(propsPassed.sortBy).toBe("name-asc");
  });


});