import { render, screen, fireEvent } from "@testing-library/react";
import AddUnitCard from "../../components/dashboard/AddUnitCard";
import { describe, it, expect, vi } from "vitest";

describe("AddUnitCard", () => {
  it("renders button", () => {
    render(<AddUnitCard />);

    expect(screen.getByText("Add unit")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();

    render(<AddUnitCard onClick={onClick} />);

    fireEvent.click(screen.getByText("Add unit"));

    expect(onClick).toHaveBeenCalled();
  });
});