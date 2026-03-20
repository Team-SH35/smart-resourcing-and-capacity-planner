import { useMemo, useState } from "react";
import type { Employee, ForecastEntry } from "../data/types";
import EmployeeRow from "./EmployeeRow";

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
}: any) {

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

  const employeesForMonth = useMemo(() => {
    return employees
      .map((employee: Employee) => {
        const entry = forecastEntries.find(
          (f: ForecastEntry) =>
            f.employeeName?.toLowerCase() === employee.name.toLowerCase() &&
            f.jobCode === jobCode &&
            f.month?.toLowerCase() === monthKey.toLowerCase()
        );

        if (!entry || entry.days === 0) return null;

        return {
          employee,
          daysAllocated: entry.days,
        };
      })
      .filter(Boolean);
  }, [employees, forecastEntries, jobCode, monthKey]);

  const specialisms = [
    ...new Set(employees.flatMap((e: Employee) => e.specialisms)),
  ] as string[];

  const displayedEmployees = employeesForMonth
    .filter((f: any) =>
      f.employee.name.toLowerCase().includes(searchName.toLowerCase())
    )
    .filter((f: any) =>
      !specialismFilter || f.employee.specialisms.includes(specialismFilter)
    );

  return (
    <div className="space-y-4 relative">
      {displayedEmployees.map(({ employee, daysAllocated }: any) => (
        <EmployeeRow
          key={employee.name}
          employee={employee}
          daysAllocated={daysAllocated}
          daysInMonth={daysInMonth}
          onUpdateAllocation={onUpdateAllocation}
          onDeleteAllocation={onDeleteAllocation}
        />
      ))}

      {/* FILTER OVERLAY */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Filters</h2>

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
              {specialisms.map((s: string) => (
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