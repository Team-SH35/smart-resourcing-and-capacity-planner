import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Settings from "../../pages/Settings";

// mock API
vi.mock("../../api/client", () => ({
  uploadExcel: vi.fn(),
}));

import { uploadExcel } from "../../api/client";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page content", () => {
    render(<Settings />);

    expect(screen.getByText(/Hi SH35/)).toBeInTheDocument();
    expect(
      screen.getByText("Upload Resource Plan")
    ).toBeInTheDocument();
  });
})