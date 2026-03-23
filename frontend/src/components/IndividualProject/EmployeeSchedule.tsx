import { useMemo, useState } from "react";
import type { Employee, ForecastEntry } from "../data/types";
import EmployeeRow from "./EmployeeRow";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

interface Props {
  employees: Employee[];
  forecastEntries: ForecastEntry[];
  currentDate: Date;
  jobCode: string;
  sortBy: SortOption;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

type EmployeeWithDays = {
  employee: Employee;
  daysAllocated: number;
};

export default function EmployeeSchedule({
  employees,
  forecastEntries,
  currentDate,
  jobCode,
  sortBy,
  filtersOpen,
  setFiltersOpen,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
  });

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const [searchName, setSearchName] = useState("");
  const [specialismFilter, setSpecialismFilter] = useState("");

  // ✅ Build clean typed array (no nulls)
  const employeesForMonth = useMemo<EmployeeWithDays[]>(() => {
    return employees.flatMap((employee) => {
      const entry = forecastEntries.find(
        (f) =>
          f.employeeName?.toLowerCase() === employee.name.toLowerCase() &&
          f.jobCode === jobCode &&
          f.month?.toLowerCase() === monthKey.toLowerCase()
      );

      if (!entry || entry.days === 0) return [];

      return [
        {
          employee,
          daysAllocated: entry.days,
        },
      ];
    });
  }, [employees, forecastEntries, jobCode, monthKey]);

  const specialisms: string[] = [
    ...new Set(employees.flatMap((e) => e.specialisms)),
  ];

  // ✅ Filter + sort (fully typed)
  const displayedEmployees = useMemo<EmployeeWithDays[]>(() => {
    return employeesForMonth
      .filter((f) =>
        f.employee.name.toLowerCase().includes(searchName.toLowerCase())
      )
      .filter(
        (f) =>
          !specialismFilter ||
          f.employee.specialisms.includes(specialismFilter)
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "name-asc":
            return a.employee.name.localeCompare(b.employee.name);

          case "name-desc":
            return b.employee.name.localeCompare(a.employee.name);

          case "days-asc":
            return a.daysAllocated - b.daysAllocated;

          case "days-desc":
            return b.daysAllocated - a.daysAllocated;

          default:
            return 0;
        }
      });
  }, [employeesForMonth, searchName, specialismFilter, sortBy]);

  // ✅ Safe max calculation
  const maxDays = useMemo(() => {
    return Math.max(...employeesForMonth.map((e) => e.daysAllocated), 1);
  }, [employeesForMonth]);

  return (
    <div className="space-y-4 relative">
      {displayedEmployees.map(({ employee, daysAllocated }) => (
        <EmployeeRow
          key={employee.name}
          employee={employee}
          daysAllocated={daysAllocated}
          daysInMonth={daysInMonth}
          maxDays={maxDays}
          onUpdateAllocation={onUpdateAllocation}
          onDeleteAllocation={onDeleteAllocation}
        />
      ))}

      {/* FILTER OVERLAY */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <div className="flex gap-2">
              <span className="material-icons-outlined text">
                filter_alt
              </span>
              <h2 className="font-semibold text-lg">Filters</h2>
            </div>

            <input
              placeholder="Search employee"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border rounded w-full px-3 py-2"
            />

            <select
              value={specialismFilter}
              onChange={(e) => setSpecialismFilter(e.target.value)}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">All Specialisms</option>
              {specialisms.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setFiltersOpen(false)}
                className="border rounded px-3 py-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}