import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeCard from "../../components/IndividualProject/EmployeeCard";

// --------------------
// Mock router
// --------------------
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("EmployeeCard", () => {
  const makeEmployee = (overrides = {}) => ({
    name: "John Doe",
    specialisms: ["Frontend Developer"],
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

  it("renders employee name and allocation", () => {
    render(<EmployeeCard {...baseProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("5 days")).toBeInTheDocument();
  });

  it("navigates when card is clicked", () => {
    render(<EmployeeCard {...baseProps} />);

    fireEvent.click(screen.getByText("John Doe"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/Employee/John%20Doe"
    );
  });

  it("opens modal when edit button is clicked", () => {
    render(<EmployeeCard {...baseProps} />);

    fireEvent.click(screen.getByText("..."));

    expect(screen.getByText("Edit Allocation")).toBeInTheDocument();
  });

  it("updates allocation when saving", () => {
    render(<EmployeeCard {...baseProps} />);

    fireEvent.click(screen.getByText("..."));

    const input = screen.getByDisplayValue("5");
    fireEvent.change(input, { target: { value: "8" } });

    fireEvent.click(screen.getByText("Save"));

    expect(baseProps.onUpdateAllocation).toHaveBeenCalledWith(
      "John Doe",
      8
    );
  });

  it("deletes allocation when clicking delete", () => {
    render(<EmployeeCard {...baseProps} />);

    fireEvent.click(screen.getByText("..."));
    fireEvent.click(screen.getByText("Delete"));

    expect(baseProps.onDeleteAllocation).toHaveBeenCalledWith(
      "John Doe"
    );
  });

  it("does not navigate when clicking edit button", () => {
    render(<EmployeeCard {...baseProps} />);

    fireEvent.click(screen.getByText("..."));

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});