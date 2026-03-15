import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmployeeProjectRow from "../../components/employeeProjects/EmployeeProjectRow";

type EmployeeProjectRowProps = {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  currentDate: Date;
  maxAllocatedDays: number;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
};

describe("EmployeeProjectRow", () => {
  const defaultProps: EmployeeProjectRowProps = {
    jobCode: "J123",
    jobDescription: "Test Project",
    daysAllocated: 5,
    currentDate: new Date(),
    maxAllocatedDays: 10,
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  it("renders EmployeeProjectCard inside row", () => {
    render(<EmployeeProjectRow {...defaultProps} />);
    expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
  });
});