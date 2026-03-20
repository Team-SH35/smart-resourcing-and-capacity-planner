import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EmployeeRow from "../../components/IndividualProject/EmployeeRow";


vi.mock("../../components/IndividualProject/EmployeeCard", () => ({
  default: vi.fn(() => <div>MockCard</div>),
}));

import EmployeeCard from "../../components/IndividualProject/EmployeeCard";

describe("EmployeeRow", () => {
  const makeEmployee = (overrides = {}) => ({
    name: "John Doe",
    specialisms: ["Developer"],
    excludedFromAI: false,
    ...overrides,
  });

  const baseProps = {
    employee: makeEmployee(),
    daysAllocated: 5,
    daysInMonth: 20,
    maxDays: 10,
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders EmployeeCard with correct props", () => {
    render(<EmployeeRow {...baseProps} />);

    expect(EmployeeCard).toHaveBeenCalled();

    const propsPassed =
      vi.mocked(EmployeeCard).mock.calls[0][0];

    expect(propsPassed.employee.name).toBe("John Doe");
    expect(propsPassed.daysAllocated).toBe(5);
    expect(propsPassed.daysInMonth).toBe(20);
    expect(propsPassed.maxDays).toBe(10);
  });

  it("passes update and delete handlers", () => {
    render(<EmployeeRow {...baseProps} />);

    const propsPassed =
      vi.mocked(EmployeeCard).mock.calls[0][0];

    expect(propsPassed.onUpdateAllocation).toBe(
      baseProps.onUpdateAllocation
    );
    expect(propsPassed.onDeleteAllocation).toBe(
      baseProps.onDeleteAllocation
    );
  });
});