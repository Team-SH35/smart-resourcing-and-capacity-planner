import { render } from "@testing-library/react";
import { vi } from "vitest";
import CalendarRows from "../../components/projectSchedule/CalendarRows";

// mock child
vi.mock("../../components/projectSchedule/ProjectBlock", () => ({
  default: vi.fn(() => <div>MockBlock</div>),
}));

import ProjectBlock from "../../components/projectSchedule/ProjectBlock";

describe("CalendarRows", () => {
  const makeProject = (overrides = {}) => ({
    id: "1",
    title: "Project",
    team: "Dev",
    client: "Client",
    startDate: "2024-01-01",
    endDate: "2024-01-02",
    color: "#000",
    ...overrides,
  });

  const rows = [
    {
      rowId: "r1",
      team: "Dev",
      projects: [makeProject()],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders visible projects", () => {
    render(
      <CalendarRows
        rows={rows}
        calendarStart={new Date("2024-01-01")}
        daysVisible={7}
      />
    );

    expect(ProjectBlock).toHaveBeenCalled();
  });

  it("filters out projects outside range", () => {
    const rows = [
      {
        rowId: "r1",
        team: "Dev",
        projects: [
          makeProject({
            startDate: "2025-01-01",
            endDate: "2025-01-02",
          }),
        ],
      },
    ];

    render(
      <CalendarRows
        rows={rows}
        calendarStart={new Date("2024-01-01")}
        daysVisible={7}
      />
    );

    expect(ProjectBlock).not.toHaveBeenCalled();
  });

  it("pads rows to minimum", () => {
    render(
      <CalendarRows
        rows={rows}
        calendarStart={new Date("2024-01-01")}
        daysVisible={7}
      />
    );

    // MIN_ROWS = 5
    const rowDivs = document.querySelectorAll(".h-20");

    expect(rowDivs.length).toBeGreaterThanOrEqual(5);
  });
});