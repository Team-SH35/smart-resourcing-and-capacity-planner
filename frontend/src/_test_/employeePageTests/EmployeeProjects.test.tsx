import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeProjects from "../../pages/EmployeeProjects";


vi.mock("react-router-dom", () => ({
  useParams: () => ({ employeeName: "John%20Doe" }),
}));

vi.mock(
  "../../components/employeeProjects/EmployeeProjectSchedule",
  () => ({
    default: () => <div>MockSchedule</div>,
  })
);

vi.mock("../../api/client", () => ({
  getEmployees: vi.fn(),
  getJobs: vi.fn(),
  getForecastEntries: vi.fn(),
  updateForecast: vi.fn(),
  deleteForecast: vi.fn(),
  createForecastEntry: vi.fn(),
}));

import {
  getEmployees,
  getJobs,
  getForecastEntries,
} from "../../api/client";

describe("EmployeeProjects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEmployee = {
    name: "John Doe",
    specialisms: ["Developer"],
  };

  const mockJobs = [
    {
      jobCode: "A",
      description: "Project A",
      customerName: "Client A",
      businessUnit: "Developers",
      startDate: "2024-01-01",
    },
  ];

  const makeForecast = (overrides = {}) => ({
    employeeName: "John Doe",
    customer: "Client A",
    jobCode: "A",
    description: "Project A",
    days: 5,
    cost: null,
    month: new Date().toLocaleString("default", { month: "long" }),
    ...overrides,
  });

  it("shows loading initially", async () => {
    (getEmployees as any).mockResolvedValue([]);
    (getJobs as any).mockResolvedValue([]);
    (getForecastEntries as any).mockResolvedValue([]);

    render(<EmployeeProjects />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders employee name after load", async () => {
    (getEmployees as any).mockResolvedValue([mockEmployee]);
    (getJobs as any).mockResolvedValue(mockJobs);
    (getForecastEntries as any).mockResolvedValue([]);

    render(<EmployeeProjects />);

    await screen.findByText("John Doe");

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Developer")).toBeInTheDocument();
  });

  it("shows 'No allocations this month' when empty", async () => {
    (getEmployees as any).mockResolvedValue([mockEmployee]);
    (getJobs as any).mockResolvedValue(mockJobs);
    (getForecastEntries as any).mockResolvedValue([]);

    render(<EmployeeProjects />);

    await screen.findByText("John Doe");

    expect(
      screen.getByText("No allocations this month")
    ).toBeInTheDocument();
  });

  it("renders schedule when allocations exist", async () => {
    (getEmployees as any).mockResolvedValue([mockEmployee]);
    (getJobs as any).mockResolvedValue(mockJobs);
    (getForecastEntries as any).mockResolvedValue([
      makeForecast(),
    ]);

    render(<EmployeeProjects />);

    await screen.findByText("MockSchedule");

    expect(screen.getByText("MockSchedule")).toBeInTheDocument();
  });

  it("shows correct allocation status (underallocated)", async () => {
    (getEmployees as any).mockResolvedValue([mockEmployee]);
    (getJobs as any).mockResolvedValue(mockJobs);

    (getForecastEntries as any).mockResolvedValue([
      makeForecast({ days: 2 }),
    ]);

    render(<EmployeeProjects />);

    await screen.findByText("John Doe");

    expect(screen.getByText(/Underallocated/)).toBeInTheDocument();
  });

  it("shows correct allocation status (overallocated)", async () => {
    (getEmployees as any).mockResolvedValue([mockEmployee]);
    (getJobs as any).mockResolvedValue(mockJobs);

    (getForecastEntries as any).mockResolvedValue([
      makeForecast({ days: 30 }),
    ]);

    render(<EmployeeProjects />);

    await screen.findByText("John Doe");

    expect(screen.getByText(/Overallocated/)).toBeInTheDocument();
  });

  it("shows employee not found if missing", async () => {
    (getEmployees as any).mockResolvedValue([]);
    (getJobs as any).mockResolvedValue([]);
    (getForecastEntries as any).mockResolvedValue([]);

    render(<EmployeeProjects />);

    await waitFor(() => {
      expect(
        screen.getByText("Employee not found")
      ).toBeInTheDocument();
    });
  });
});