import { render } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeSchedule from "../../components/IndividualProject/EmployeeSchedule";


vi.mock("../../components/IndividualProject/EmployeeRow", () => ({
  default: vi.fn(() => <div>MockRow</div>),
}));

import EmployeeRow from "../../components/IndividualProject/EmployeeRow";

describe("EmployeeSchedule", () => {
  const makeEmployee = (overrides = {}) => ({
    name: "John Doe",
    specialisms: ["Developer"],
    excludedFromAI: false,
    ...overrides,
  });

  const makeForecast = (overrides = {}) => ({
    employeeName: "John Doe",
    customer: "Client",
    jobCode: "A",
    description: "Project A",
    days: 5,
    cost: null,
    month: new Date().toLocaleString("default", { month: "long" }),
    ...overrides,
  });

  const baseProps = {
    employees: [makeEmployee()],
    forecastEntries: [makeForecast()],
    currentDate: new Date(),
    jobCode: "A",
    sortBy: "name-asc" as const,
    filtersOpen: false,
    setFiltersOpen: vi.fn(),
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a row for each matching employee", () => {
    render(<EmployeeSchedule {...baseProps} />);

    expect(EmployeeRow).toHaveBeenCalledTimes(1);
  });

  it("passes correct daysAllocated to row", () => {
    render(<EmployeeSchedule {...baseProps} />);

    const propsPassed =
      vi.mocked(EmployeeRow).mock.calls[0][0];

    expect(propsPassed.daysAllocated).toBe(5);
  });

  it("filters out employees with no allocation", () => {
    const props = {
      ...baseProps,
      forecastEntries: [makeForecast({ days: 0 })],
    };

    render(<EmployeeSchedule {...props} />);

    expect(EmployeeRow).not.toHaveBeenCalled();
  });

  it("calculates maxDays correctly", () => {
    const props = {
      ...baseProps,
      forecastEntries: [
        makeForecast({ employeeName: "John Doe", days: 5 }),
        makeForecast({ employeeName: "Jane Smith", days: 10 }),
      ],
      employees: [
        makeEmployee({ name: "John Doe" }),
        makeEmployee({ name: "Jane Smith" }),
      ],
    };

    render(<EmployeeSchedule {...props} />);

    const calls = vi.mocked(EmployeeRow).mock.calls;

    expect(calls[0][0].maxDays).toBe(10);
    expect(calls[1][0].maxDays).toBe(10);
  });

  it("sorts employees by days descending", () => {
    const props = {
      ...baseProps,
      sortBy: "days-desc" as const,
      forecastEntries: [
        makeForecast({ employeeName: "John Doe", days: 5 }),
        makeForecast({ employeeName: "Jane Smith", days: 10 }),
      ],
      employees: [
        makeEmployee({ name: "John Doe" }),
        makeEmployee({ name: "Jane Smith" }),
      ],
    };

    render(<EmployeeSchedule {...props} />);

    const calls = vi.mocked(EmployeeRow).mock.calls;

    expect(calls[0][0].employee.name).toBe("Jane Smith");
    expect(calls[1][0].employee.name).toBe("John Doe");
  });

  it("passes handlers correctly", () => {
    render(<EmployeeSchedule {...baseProps} />);

    const propsPassed =
      vi.mocked(EmployeeRow).mock.calls[0][0];

    expect(propsPassed.onUpdateAllocation).toBe(
      baseProps.onUpdateAllocation
    );
    expect(propsPassed.onDeleteAllocation).toBe(
      baseProps.onDeleteAllocation
    );
  });
});