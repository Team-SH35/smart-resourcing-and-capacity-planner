import { render, screen } from "@testing-library/react";
import EmptyStateCard from "../../components/dashboard/EmptyStateCard";
import { describe, it, expect} from "vitest";

describe("EmptyStateCard", () => {
  it("renders empty state text", () => {
    render(<EmptyStateCard />);

    expect(screen.getByText("No data available")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload a resource plan/)
    ).toBeInTheDocument();
  });
});