import { render } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeProjectSchedule from "../../components/employeeProjects/EmployeeProjectSchedule";

// Mock child component
vi.mock("../../components/employeeProjects/EmployeeProjectRow", () => ({
  default: vi.fn(() => <div>MockRow</div>),
}));

import EmployeeProjectRow from "../../components/employeeProjects/EmployeeProjectRow";

describe("EmployeeProjectSchedule", () => {
  const makeForecast = (overrides = {}) => ({
    employeeName: "John",
    customer: "Test Customer",
    description: "Test Project",
    cost: null,
    month: "January",
    jobCode: "A",
    days: 5,
    ...overrides,
  });

  const makeJob = (overrides = {}) => ({
    jobCode: "A",
    description: "Test Project",
    customerName: "Test Customer",
    businessUnit: "Dev",
    startDate: "2024-01-01",
    ...overrides,
  });

  const baseProps = {
    employeeName: "John",
    currentDate: new Date(),
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a row for each forecast entry", () => {
    const forecastEntries = [
      makeForecast({ jobCode: "A", days: 5 }),
      makeForecast({ jobCode: "B", days: 10 }),
    ];

    const jobCodes = [
      makeJob({ jobCode: "A", description: "Project A" }),
      makeJob({ jobCode: "B", description: "Project B" }),
    ];

    render(
      <EmployeeProjectSchedule
        {...baseProps}
        forecastEntries={forecastEntries}
        jobCodes={jobCodes}
      />
    );

    expect(EmployeeProjectRow).toHaveBeenCalledTimes(2);
  });

  it("passes correct maxAllocatedDays to all rows", () => {
    const forecastEntries = [
      makeForecast({ jobCode: "A", days: 5 }),
      makeForecast({ jobCode: "B", days: 10 }),
    ];

    const jobCodes = [
      makeJob({ jobCode: "A" }),
      makeJob({ jobCode: "B" }),
    ];

    render(
      <EmployeeProjectSchedule
        {...baseProps}
        forecastEntries={forecastEntries}
        jobCodes={jobCodes}
      />
    );

    expect(EmployeeProjectRow).toHaveBeenCalled();

    const calls = vi.mocked(EmployeeProjectRow).mock.calls;

    const firstCallProps = calls[0][0];
    const secondCallProps = calls[1][0];

    expect(firstCallProps.maxAllocatedDays).toBe(10);
    expect(secondCallProps.maxAllocatedDays).toBe(10);
  });

  it("uses job description when available", () => {
    const forecastEntries = [
      makeForecast({ jobCode: "A", days: 5 }),
    ];

    const jobCodes = [
      makeJob({ jobCode: "A", description: "Project A" }),
    ];

    render(
      <EmployeeProjectSchedule
        {...baseProps}
        forecastEntries={forecastEntries}
        jobCodes={jobCodes}
      />
    );

    const propsPassed =
      vi.mocked(EmployeeProjectRow).mock.calls[0][0];

    expect(propsPassed.jobDescription).toBe("Project A");
  });

  it("falls back to jobCode if job description is missing", () => {
    const forecastEntries = [
      makeForecast({ jobCode: "A", days: 5 }),
      makeForecast({ jobCode: "B", days: 10 }),
    ];

    const jobCodes = [
      makeJob({ jobCode: "A", description: "Project A" }),
      // B intentionally missing
    ];

    render(
      <EmployeeProjectSchedule
        {...baseProps}
        forecastEntries={forecastEntries}
        jobCodes={jobCodes}
      />
    );

    const propsPassed =
      vi.mocked(EmployeeProjectRow).mock.calls[1][0];

    expect(propsPassed.jobDescription).toBe("B");
  });

  it("handles empty forecastEntries safely", () => {
    render(
      <EmployeeProjectSchedule
        {...baseProps}
        forecastEntries={[]}
        jobCodes={[]}
      />
    );

    expect(EmployeeProjectRow).not.toHaveBeenCalled();
  });
});