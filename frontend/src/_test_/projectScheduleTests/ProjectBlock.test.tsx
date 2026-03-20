import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProjectBlock from "../../components/projectSchedule/ProjectBlock";

// router mock
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("ProjectBlock", () => {
  const project = {
    id: "1",
    title: "Test Project",
    team: "Dev",
    client: "Client A",
    startDate: "2024-01-01",
    endDate: "2024-01-03",
    color: "#000",
  };

  const baseProps = {
    project,
    calendarStart: new Date("2024-01-01"),
    daysVisible: 7,
  };

  it("renders project title", () => {
    render(<ProjectBlock {...baseProps} />);

    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });

  it("navigates on click", () => {
    render(<ProjectBlock {...baseProps} />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockNavigate).toHaveBeenCalledWith("/project/1");
  });

  it("does not render if project is outside range", () => {
    const props = {
      ...baseProps,
      project: {
        ...project,
        startDate: "2025-01-01",
        endDate: "2025-01-02",
      },
    };

    const { container } = render(<ProjectBlock {...props} />);

    expect(container.firstChild).toBeNull();
  });
});