import { render } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeProjectRow from "../../components/employeeProjects/EmployeeProjectRow";

// Mock the child component
vi.mock("../../components/employeeProjects/EmployeeProjectCard", () => ({
  default: vi.fn(() => <div>MockCard</div>),
}));

import EmployeeProjectCard from "../../components/employeeProjects/EmployeeProjectCard";

describe("EmployeeProjectRow", () => {
  const props = {
    jobCode: "ABC123",
    jobDescription: "Test Project",
    daysAllocated: 5,
    currentDate: new Date(2024, 0, 1), // Jan 2024 (31 days)
    maxAllocatedDays: 10,
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  it("renders EmployeeProjectCard with correct props", () => {
    render(<EmployeeProjectRow {...props} />);

    expect(EmployeeProjectCard).toHaveBeenCalled();

    const firstCallArgs = (EmployeeProjectCard as any).mock.calls[0][0];

    expect(firstCallArgs).toEqual(
        expect.objectContaining({
            jobCode: "ABC123",
            jobDescription: "Test Project",
            daysAllocated: 5,
            daysInMonth: 31,
            maxAllocatedDays: 10,
        })
    );
  });
});