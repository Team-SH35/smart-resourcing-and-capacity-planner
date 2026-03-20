import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import EmployeeByBUCard from "../../components/businessUnit/EmployeeByBUCard";


const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

describe("EmployeeByBUCard", () => {
  const todayMonth = new Date().toLocaleString("default", {
    month: "long",
  });

  const makeEmployee = (overrides = {}) => ({
    name: "John Doe",
    specialisms: ["Developer"],
    excludedFromAI: false,
    ...overrides,
  });

  const makeForecast = (overrides = {}) => ({
    employeeName: "John Doe",
    customer: "Client",
    jobCode: "A",
    description: "Project A",
    days: 10,
    cost: null,
    month: todayMonth,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders employees with allocation %", () => {
    render(
      <EmployeeByBUCard
        employees={[makeEmployee()]}
        forecastEntries={[makeForecast({ days: 10 })]}
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it("filters by name", () => {
    render(
      <EmployeeByBUCard
        employees={[
          makeEmployee({ name: "John Doe" }),
          makeEmployee({ name: "Jane Smith" }),
        ]}
        forecastEntries={[makeForecast()]}
        filterName="jane"
      />
    );

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("filters by specialism", () => {
    render(
      <EmployeeByBUCard
        employees={[
          makeEmployee({ name: "John", specialisms: ["Developer"] }),
          makeEmployee({ name: "Jane", specialisms: ["Analytics"] }),
        ]}
        forecastEntries={[makeForecast()]}
        filterSpecialism="Analytics"
      />
    );

    expect(screen.getByText("Jane")).toBeInTheDocument();
    expect(screen.queryByText("John")).not.toBeInTheDocument();
  });

  it("filters underallocated employees", () => {
    render(
      <EmployeeByBUCard
        employees={[makeEmployee()]}
        forecastEntries={[makeForecast({ days: 1 })]} // low allocation
        filterAllocation="under"
      />
    );

    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows empty state when no employees match", () => {
    render(
      <EmployeeByBUCard
        employees={[makeEmployee({ name: "John" })]}
        forecastEntries={[makeForecast()]}
        filterName="zzz"
      />
    );

    expect(
      screen.getByText("No employees found for this business unit.")
    ).toBeInTheDocument();
  });

  it("sorts by name descending", () => {
    render(
      <EmployeeByBUCard
        employees={[
          makeEmployee({ name: "Alice" }),
          makeEmployee({ name: "Bob" }),
        ]}
        forecastEntries={[makeForecast()]}
        sortBy="name-desc"
      />
    );

    const names = screen.getAllByText(/Alice|Bob/i);

    expect(names[0]).toHaveTextContent("Bob");
    expect(names[1]).toHaveTextContent("Alice");
  });

  it("navigates when clicking an employee", () => {
    render(
      <EmployeeByBUCard
        employees={[makeEmployee({ name: "John Doe" })]}
        forecastEntries={[makeForecast()]}
      />
    );

    screen.getByText("John Doe").click();

    expect(mockNavigate).toHaveBeenCalledWith(
      "/Employee/John%20Doe"
    );
  });
});