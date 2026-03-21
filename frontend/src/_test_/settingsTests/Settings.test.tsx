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

  it("uploads file successfully", async () => {
    vi.mocked(uploadExcel).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)));

    render(<Settings />);

    const file = new File(["test"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

 
    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    expect(await screen.findByText("Uploading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(uploadExcel).toHaveBeenCalledWith(file);
    });

    expect(
      await screen.findByText("Excel uploaded successfully")
    ).toBeInTheDocument();
  });

  it("handles upload error", async () => {
    vi.mocked(uploadExcel).mockRejectedValue(new Error("fail"));

    render(<Settings />);

    const file = new File(["test"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(uploadExcel).toHaveBeenCalled();
    });

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
  });

  it("does nothing if no file selected", async () => {
    render(<Settings />);

    const fileInput = document.querySelector("input[type='file']") as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: { files: [] },
    });

    expect(uploadExcel).not.toHaveBeenCalled();
  });
});