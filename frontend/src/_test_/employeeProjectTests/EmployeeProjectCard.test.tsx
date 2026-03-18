// _tests_/components/EmployeeProjectCard.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EmployeeProjectCard from "../../components/employeeProjects/EmployeeProjectCard";

type EmployeeProjectCardProps = {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  daysInMonth: number;
  maxAllocatedDays: number;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
};

describe("EmployeeProjectCard", () => {
  const defaultProps: EmployeeProjectCardProps = {
    jobCode: "J123",
    jobDescription: "Test Project",
    daysAllocated: 5,
    daysInMonth: 20,
    maxAllocatedDays: 10,
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  it("renders job description and code", () => {
    render(<EmployeeProjectCard {...defaultProps} />);
    expect(screen.getByText(/Test Project/i)).toBeInTheDocument();
    expect(screen.getByText(/J123/i)).toBeInTheDocument();
    expect(screen.getByText(/5 days/i)).toBeInTheDocument();
  });

  it("opens modal when more button is clicked", async () => {
    const user = userEvent.setup();
    render(<EmployeeProjectCard {...defaultProps} />);
    await user.click(screen.getByRole("button"));
    expect(screen.getByText(/Edit Allocation/i)).toBeInTheDocument();
  });
});