import { render, screen } from "@testing-library/react";
import { describe, it, expect  } from "vitest";
import CalendarHeader from "../../components/projectSchedule/CalendarHeader";

describe("CalendarHeader", () => {
  it("renders correct number of days", () => {
    const days = [
      new Date("2024-01-01"),
      new Date("2024-01-02"),
      new Date("2024-01-03"),
    ];

    render(<CalendarHeader days={days} />);

    expect(screen.getAllByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/).length).toBe(3);
  });

  it("renders day numbers", () => {
    const days = [new Date("2024-01-05")];

    render(<CalendarHeader days={days} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });
});