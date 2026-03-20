import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import ProjectCalendar from "../../components/projectSchedule/ProjectCalendar";

// mock children
vi.mock("../../components/projectSchedule/CalendarHeader", () => ({
  default: () => <div>MockHeader</div>,
}));

vi.mock("../../components/projectSchedule/CalendarRows", () => ({
  default: () => <div>MockRows</div>,
}));

// mock API
vi.mock("../../api/client", () => ({
  getJobs: vi.fn(),
}));

import { getJobs } from "../../api/client";

describe("ProjectCalendar", () => {
  const makeJob = () => ({
    jobCode: "A",
    description: "Project A",
    customerName: "Client",
    businessUnit: "Dev",
    startDate: "2024-01-01",
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading initially", async () => {
    vi.mocked(getJobs).mockResolvedValue([]);

    render(
      <ProjectCalendar
        view="week"
        clientFilter=""
        activeOnly={false}
        teamFilter={[]}
      />
    );

    expect(await screen.findByText("Loading calendar...")).toBeInTheDocument();
  });

  it("renders calendar after load", async () => {
    vi.mocked(getJobs).mockResolvedValue([makeJob()]);

    render(
      <ProjectCalendar
        view="week"
        clientFilter=""
        activeOnly={false}
        teamFilter={[]}
      />
    );

    expect(await screen.findByText("MockHeader")).toBeInTheDocument();
    expect(screen.getByText("MockRows")).toBeInTheDocument();
  });

  it("shows empty state when no rows", async () => {
    vi.mocked(getJobs).mockResolvedValue([]);

    render(
      <ProjectCalendar
        view="week"
        clientFilter="zzz"
        activeOnly={false}
        teamFilter={[]}
      />
    );

    expect(await screen.findByText("No projects available")).toBeInTheDocument();
  });

  it("handles navigation buttons", async () => {
    vi.mocked(getJobs).mockResolvedValue([makeJob()]);

    render(
      <ProjectCalendar
        view="week"
        clientFilter=""
        activeOnly={false}
        teamFilter={[]}
      />
    );

    await screen.findByText("MockHeader");

    fireEvent.click(screen.getByText("→"));
    fireEvent.click(screen.getByText("←"));
    fireEvent.click(screen.getByText("Today"));

    expect(screen.getByText("MockHeader")).toBeInTheDocument();
  });
});