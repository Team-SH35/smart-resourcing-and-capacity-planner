import { describe, test, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import EmployeeProjects from "../../pages/EmployeeProjects";

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/employees/Charlotte"]}>
      <Routes>
        <Route
          path="/employees/:employeeName"
          element={<EmployeeProjects />}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("EmployeeProjects Page", () => {

  test("renders employee name and role", () => {
    renderPage();

    expect(screen.getByText(/Charlotte/i)).toBeInTheDocument();
  });

  test("shows month navigation", () => {
    renderPage();

    expect(screen.getByText(/today/i)).toBeInTheDocument();
    expect(screen.getByText("←")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  test("opens add allocation modal", () => {
    renderPage();

    const newButton = screen.getByText("+ New");
    fireEvent.click(newButton);

    expect(screen.getByText(/add allocation/i)).toBeInTheDocument();
  });

  test("opens filter modal", () => {
    renderPage();

    const filterButton = screen.getByText(/filters/i);
    fireEvent.click(filterButton);

    expect(screen.getByText(/business units/i)).toBeInTheDocument();
  });

  test("sort dropdown exists", () => {
    renderPage();

    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();
  });

  test("month navigation buttons change month", () => {
    renderPage();

    const nextButton = screen.getByText("→");
    fireEvent.click(nextButton);

    const prevButton = screen.getByText("←");
    fireEvent.click(prevButton);

    expect(prevButton).toBeInTheDocument();
  });

});