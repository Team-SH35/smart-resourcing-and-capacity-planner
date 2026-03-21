import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BusinessUnitCard from "../../components/dashboard/BusinessUnitCard";

// mock router
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("BusinessUnitCard", () => {
  const baseProps = {
    name: "Dev",
    icon: "code",
    iconBgColor: "bg",
    iconColor: "text",
    avatars: [{ initials: "JD", color: "bg" }],
    employees: [
      { name: "John Doe", specialisms: [], excludedFromAI: false },
    ],
  };

  it("renders name", () => {
    render(<BusinessUnitCard {...baseProps} />);

    expect(screen.getByText("Dev")).toBeInTheDocument();
  });

  it("navigates on card click", () => {
    render(<BusinessUnitCard {...baseProps} />);

    fireEvent.click(screen.getByText("Dev"));

    expect(mockNavigate).toHaveBeenCalledWith("/businessunit/Dev");
  });

  it("opens edit modal", () => {
    render(<BusinessUnitCard {...baseProps} />);

    fireEvent.click(screen.getByText("more_horiz"));

    expect(screen.getByText("Edit Business Unit")).toBeInTheDocument();
  });

  it("adds employee", () => {
    render(<BusinessUnitCard {...baseProps} />);

    fireEvent.click(screen.getByText("more_horiz"));

    const input = screen.getByPlaceholderText("Add employee");

    fireEvent.change(input, { target: { value: "Jane" } });
    fireEvent.click(screen.getByText("Add"));

    expect(screen.getByText("Jane")).toBeInTheDocument();
  });
});