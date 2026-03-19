import { useMemo, useState } from "react";
import type { Employee, ForecastEntry } from "../data/types";
import EmployeeRow from "./EmployeeRow";

interface Props {
  employees: Employee[];
  forecastEntries: ForecastEntry[];
  currentDate: Date;
  jobCode: string;
  sortBy: "name-asc" | "name-desc" | "days-asc" | "days-desc";
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

export default function EmployeeSchedule({
  employees,
  forecastEntries,
  currentDate,
  jobCode,
  sortBy,
  filtersOpen,
  setFiltersOpen,
  onUpdateAllocation,
  onDeleteAllocation
}: Props) {

  // ✅ FIX: match backend format ("jan", "feb", etc.)
  const monthKey = useMemo(() => {
    return currentDate.toLocaleString("default", { month: "long" });
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
  }, [currentDate]);

  const [searchName, setSearchName] = useState("");
  const [specialismFilter, setSpecialismFilter] = useState("");

  const employeesForMonth = useMemo(() => {
    return employees
      .map(employee => {
        const entry = forecastEntries.find(
          f =>
            f.employeeName === employee.name &&
            String(f.jobCode).toLowerCase() === String(jobCode).toLowerCase() &&
            f.month?.trim().toLowerCase() === monthKey.toLowerCase()
        );

        if (!entry) return null;

        return {
          employee,
          daysAllocated: entry.days,
        };
      })
      .filter(Boolean) as { employee: Employee; daysAllocated: number }[];
  }, [employees, forecastEntries, jobCode, monthKey]);

  const specialisms = useMemo(
    () => Array.from(new Set(employees.flatMap(e => e.specialisms))),
    [employees]
  );

  const displayedEmployees = useMemo(() => {
    let filtered = employeesForMonth;

    if (searchName) {
      filtered = filtered.filter(f =>
        f.employee.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (specialismFilter) {
      filtered = filtered.filter(f =>
        f.employee.specialisms.includes(specialismFilter)
      );
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return a.employee.name.localeCompare(b.employee.name);
      if (sortBy === "name-desc") return b.employee.name.localeCompare(a.employee.name);
      if (sortBy === "days-asc") return a.daysAllocated - b.daysAllocated;
      if (sortBy === "days-desc") return b.daysAllocated - a.daysAllocated;
      return 0;
    });

    return filtered;
  }, [employeesForMonth, sortBy, searchName, specialismFilter]);

  console.log("monthKey:", monthKey);
  console.log("jobCode:", jobCode);
  console.log("forecastEntries:", forecastEntries);
  console.log("employeesForMonth:", employeesForMonth);

  if (employeesForMonth.length === 0) {
    return (
      <div className="p-4 text-slate-400">
        No allocations this month
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {displayedEmployees.map(({ employee, daysAllocated }) => (
        <EmployeeRow
          key={employee.name}
          employee={employee}
          daysAllocated={daysAllocated}
          daysInMonth={daysInMonth}
          onUpdateAllocation={onUpdateAllocation}
          onDeleteAllocation={onDeleteAllocation}
        />
      ))}

      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Filters</h2>

            <input
              placeholder="Search employee"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              className="border rounded w-full px-3 py-2"
            />

            <select
              value={specialismFilter}
              onChange={e => setSpecialismFilter(e.target.value)}
              className="border rounded w-full px-3 py-2"
            >
              <option value="">All Specialisms</option>
              {specialisms.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-4">
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

