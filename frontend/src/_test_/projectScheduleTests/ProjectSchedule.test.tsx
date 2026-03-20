import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ProjectSchedule from "../../pages/ProjectSchedule";

// mock router
vi.mock("react-router-dom", () => ({
  useSearchParams: () => [new URLSearchParams()],
}));

// mock child calendar
vi.mock("../../components/projectSchedule/ProjectCalendar", () => ({
  default: () => <div>MockCalendar</div>,
}));

// mock API
vi.mock("../../api/client", () => ({
  getBusinessUnits: vi.fn(),
}));

import { getBusinessUnits } from "../../api/client";

describe("ProjectSchedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and calendar", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("MockCalendar")).toBeInTheDocument();
  });

  it("toggles view dropdown and selects option", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText(/View By:/));

    expect(screen.getByText("Week")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Week"));

    expect(screen.queryByText("Week")).not.toBeInTheDocument(); // dropdown closed
  });

  it("opens and closes filters modal", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    expect(screen.getByRole("heading", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Client name")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Close"));

    expect(screen.queryByPlaceholderText("Client name")).not.toBeInTheDocument();
  });

  it("shows loading state for business units", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    expect(
      await screen.findByText("Loading business units...")
    ).toBeInTheDocument();
  });

  it("renders business units when loaded", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([
      "Dev",
      "Design",
    ]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    expect(await screen.findByText("Dev")).toBeInTheDocument();
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("handles empty business units", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    expect(
      await screen.findByText("No business units available")
    ).toBeInTheDocument();
  });

  it("updates client filter input", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    const input = await screen.findByPlaceholderText("Client name");

    fireEvent.change(input, { target: { value: "ABC" } });

    expect(input).toHaveValue("ABC");
  });

  it("toggles activeOnly checkbox", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue([]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    const checkbox = await screen.findByLabelText(
      "Only active projects"
    );

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it("toggles business unit selection", async () => {
    vi.mocked(getBusinessUnits).mockResolvedValue(["Dev"]);

    render(<ProjectSchedule />);

    fireEvent.click(screen.getByText("Filters"));

    const checkbox = await screen.findByLabelText("Dev");

    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });
});