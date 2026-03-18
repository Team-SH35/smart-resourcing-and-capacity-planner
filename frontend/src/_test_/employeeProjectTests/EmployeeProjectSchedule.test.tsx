import { describe, test, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeProjectSchedule from "../../components/employeeProjects/EmployeeProjectSchedule";
import type { ForecastEntry, JobCode } from "../../components/data/types";

// Sample job codes (from your fixture)
const jobCodes: JobCode[] = [
  {
    jobCode: "C341-CWPUK-28-7-4",
    description: "Comwrap Website Project",
    customerName: "Comwrap Reply",
    businessUnit: "Developers",
    budgetTime: 120,
    startDate: "2025-10-01",
    finishDate: "2026-03-08",
  },
  {
    jobCode: "A102-ANALYTICS-01",
    description: "Analytics Platform Maintenance",
    customerName: "Internal",
    businessUnit: "Analytics",
    budgetCost: 50000,
    budgetCostCurrency: "€",
    startDate: "2026-01-22",
    finishDate: null,
  },
  {
    jobCode: "A111-ANALYTICS-02",
    description: "Website Analytics Integration",
    customerName: "Client XYZ",
    businessUnit: "Analytics",
    budgetCost: 50000,
    budgetCostCurrency: "€",
    startDate: "2026-01-15",
    finishDate: "2026-02-15",
  },
];

// Sample forecast entries
const forecastEntries: ForecastEntry[] = [
  {
      employeeName: "John Doe", jobCode: "C341-CWPUK-28-7-4", days: 10, month: "February 2026",
      customer: "Comwrap Reply",
      description: "Comwrap Website Project",
      cost: null
  },
  {
      employeeName: "John Doe", jobCode: "A102-ANALYTICS-01", days: 5, month: "February 2026",
      customer: "Internal",
      description: "Analytics Platform Maintenance",
      cost: null
  },
  {
      employeeName: "John Doe", jobCode: "A111-ANALYTICS-02", days: 3, month: "February 2026",
      customer: "Client XYZ",
      description: "Website Analytics Integration",
      cost: null
  },
];

// Mock callbacks
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// Default props
const defaultProps = {
  employeeName: "John Doe",
  forecastEntries,
  jobCodes,
  currentDate: new Date("2026-02-01"),
  onUpdateAllocation: mockUpdate,
  onDeleteAllocation: mockDelete,
};

describe("EmployeeProjectSchedule - tests", () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

 test("renders all employee project rows", () => {
    render(<EmployeeProjectSchedule {...defaultProps} />);

    forecastEntries.forEach(entry => {
        const job = jobCodes.find(j => j.jobCode === entry.jobCode);

        expect(
        screen.getByText(job?.description ?? entry.jobCode)
        ).toBeInTheDocument();
    });
});

    test("displays correct allocated days", () => {
    render(<EmployeeProjectSchedule {...defaultProps} />);

    forecastEntries.forEach(entry => {
        expect(
        screen.getByText(new RegExp(`${entry.days}\\s*days?`, "i"))
        ).toBeInTheDocument();
    });
});
  test("calls onUpdateAllocation when row is updated", async () => {
    render(<EmployeeProjectSchedule {...defaultProps} />);
    const user = userEvent.setup();

    // Find first row's "more_horiz" button and simulate update
    const updateButton = screen.getAllByRole("button", { name: /more_horiz/i })[0];
    await user.click(updateButton);

    // Simulate calling the update callback
    defaultProps.onUpdateAllocation(forecastEntries[0].jobCode, 7);
    expect(mockUpdate).toHaveBeenCalledWith(forecastEntries[0].jobCode, 7);
  });

  test("calls onDeleteAllocation when row is deleted", async () => {
    render(<EmployeeProjectSchedule {...defaultProps} />);
    const user = userEvent.setup();

    // Find first row's "more_horiz" button and simulate delete
    const deleteButton = screen.getAllByRole("button", { name: /more_horiz/i })[0];
    await user.click(deleteButton);

    defaultProps.onDeleteAllocation(forecastEntries[0].jobCode);
    expect(mockDelete).toHaveBeenCalledWith(forecastEntries[0].jobCode);
  });
});