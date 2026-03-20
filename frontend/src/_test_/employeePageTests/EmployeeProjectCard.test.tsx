import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EmployeeProjectCard from "../../components/employeeProjects/EmployeeProjectCard";


vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("EmployeeProjectCard", () => {
  const defaultProps = {
    jobCode: "ABC123",
    jobDescription: "Test Project",
    daysAllocated: 5,
    daysInMonth: 20,
    maxAllocatedDays: 10,
    onUpdateAllocation: vi.fn(),
    onDeleteAllocation: vi.fn(),
  };

  it("renders job info correctly", () => {
    render(<EmployeeProjectCard {...defaultProps} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("opens edit modal when clicking menu button", () => {
    render(<EmployeeProjectCard {...defaultProps} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(screen.getByText("Edit Allocation")).toBeInTheDocument();
  });

  it("updates allocation when saving", () => {
    render(<EmployeeProjectCard {...defaultProps} />);

    fireEvent.click(screen.getByRole("button"));

    const input = screen.getByDisplayValue("5");
    fireEvent.change(input, { target: { value: "8" } });

    fireEvent.click(screen.getByText("Save"));

    expect(defaultProps.onUpdateAllocation).toHaveBeenCalledWith("ABC123", 8);
  });

  it("calls delete when confirmed", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<EmployeeProjectCard {...defaultProps} />);

    fireEvent.click(screen.getByRole("button")); 
    fireEvent.click(screen.getByText("Delete Allocation"));

    expect(defaultProps.onDeleteAllocation).toHaveBeenCalledWith("ABC123");
  });
});