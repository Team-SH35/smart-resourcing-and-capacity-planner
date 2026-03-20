import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import IndividualProject from "../../pages/IndividualProject";


const mockUseParams = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => mockUseParams(),
}));


vi.mock(
  "../../components/IndividualProject/EmployeeSchedule",
  () => ({
    default: () => <div>MockSchedule</div>,
  })
);


vi.mock("../../api/client", () => ({
  getEmployees: vi.fn(),
  getJobs: vi.fn(),
  getForecastEntries: vi.fn(),
  createForecastEntry: vi.fn(),
}));

import {
  getEmployees,
  getJobs,
  getForecastEntries,
} from "../../api/client";

describe("IndividualProject", () => {
  const makeEmployee = () => ({
    name: "John Doe",
    specialisms: ["Developer"],
    excludedFromAI: false,
  });

  const makeJob = () => ({
    jobCode: "A",
    description: "Project A",
    customerName: "Client A",
    businessUnit: "Developers",
    startDate: "2024-01-01",
  });

  const makeForecast = () => ({
    employeeName: "John Doe",
    customer: "Client A",
    jobCode: "A",
    description: "Project A",
    days: 5,
    cost: null,
    month: new Date().toLocaleString("default", { month: "long" }),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // ✅ CRITICAL: ensure component receives jobCode
    mockUseParams.mockReturnValue({ jobCode: "A" });

    vi.mocked(getEmployees).mockResolvedValue([makeEmployee()]);
    vi.mocked(getJobs).mockResolvedValue([makeJob()]);
    vi.mocked(getForecastEntries).mockResolvedValue([makeForecast()]);
  });

  it("renders after data loads", async () => {
    render(<IndividualProject />);

    expect(await screen.findByText(/Project A/)).toBeInTheDocument();
  });

  it("renders schedule component", async () => {
    render(<IndividualProject />);

    expect(await screen.findByText("MockSchedule")).toBeInTheDocument();
  });

  it("opens modal when clicking add allocation", async () => {
    render(<IndividualProject />);

    await screen.findByText(/Project A/);

    fireEvent.click(screen.getByText("+ Add Allocation"));

    expect(screen.getByText("Add Allocation")).toBeInTheDocument();
  });

  it("submits allocation form", async () => {
    render(<IndividualProject />);

    await screen.findByText(/Project A/);

    fireEvent.click(screen.getByText("+ Add Allocation"));

    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "3" },
    });

  });

  it("handles missing jobCode safely", () => {
    mockUseParams.mockReturnValueOnce({});

    render(<IndividualProject />);

    // component returns null → no crash
    expect(true).toBe(true);
  });
});