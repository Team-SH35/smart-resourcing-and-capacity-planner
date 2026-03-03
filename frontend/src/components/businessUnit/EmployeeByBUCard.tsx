import { useMemo } from "react";
import { employees } from "../data/employees";
import { forecastEntries } from "../data/forecastEntries";
import { jobCodes } from "../data/jobCodes";

interface Props {
  businessUnit: string;
  filterName?: string;
  filterSpecialism?: string;
  filterAllocation?: "under" | "correct" | "over" | "";
  sortBy?: "name-asc" | "name-desc" | "alloc-asc" | "alloc-desc";
}

function getWorkingDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const current = new Date(year, month, day);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
  }
  return workingDays;
}

export default function EmployeeByBUCard({
  businessUnit,
  filterName = "",
  filterSpecialism = "",
  filterAllocation = "",
  sortBy = "name-asc",
}: Props) {
  const today = new Date();
  const monthKey = today.toLocaleString("default", { month: "long", year: "numeric" });
  const workingDays = getWorkingDaysInMonth(today);

  // Employees for this unit via forecastEntries + jobCodes
  const unitJobCodes = jobCodes.filter((job) => job.businessUnit === businessUnit).map((job) => job.jobCode);
  const unitEmployeeNames = new Set(
    unitJobCodes.flatMap((code) =>
      forecastEntries.filter((entry) => entry.jobCode === code).map((entry) => entry.employeeName)
    )
  );

  const unitEmployees = employees.filter((emp) => unitEmployeeNames.has(emp.name));

  // Allocation
  const employeesWithAllocation = useMemo(() => {
    return unitEmployees.map((employee) => {
      const totalAllocated = forecastEntries
        .filter((entry) => entry.employeeName === employee.name && entry.month === monthKey)
        .reduce((sum, entry) => sum + entry.days, 0);
      const allocation = workingDays > 0 ? Math.round((totalAllocated / workingDays) * 100) : 0;
      return { ...employee, allocation };
    });
  }, [unitEmployees, monthKey, workingDays]);

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let result = [...employeesWithAllocation];

    if (filterName) result = result.filter((e) => e.name.toLowerCase().includes(filterName.toLowerCase()));
    if (filterSpecialism) result = result.filter((e) => e.specialisms?.[0].toLowerCase() === filterSpecialism.toLowerCase());

    if (filterAllocation) {
    result = result.filter((e) => {
        if (filterAllocation === "under") return e.allocation < 80;
        if (filterAllocation === "correct") return e.allocation >= 80 && e.allocation <= 100;
        if (filterAllocation === "over") return e.allocation > 100;
        return true;
    });
}

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "alloc-asc": return a.allocation - b.allocation;
        case "alloc-desc": return b.allocation - a.allocation;
        default: return 0;
      }
    });

    return result;
  }, [employeesWithAllocation, filterName, filterSpecialism, filterAllocation, sortBy]);

  const getAllocationColor = (value: number) => {
    if (value < 80) return "text-orange-500";
    if (value <= 100) return "text-green-500";
    return "text-red-500";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {filteredAndSorted.length === 0 && (
        <div className="p-12 text-center text-slate-400">No employees match the filters.</div>
      )}

      {filteredAndSorted.map((employee, index) => (
        <div key={employee.name}>
          <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex flex-col">
                <div className="font-medium text-slate-800">{employee.name}</div>
                <div className="text-slate-500">{employee.specialisms?.[0]}</div>
              </div>
            </div>

            <div className={`font-semibold text-lg ${getAllocationColor(employee.allocation)}`}>
              {employee.allocation}%
            </div>
          </div>
          {index !== filteredAndSorted.length - 1 && <div className="border-t border-slate-200 mx-6" />}
        </div>
      ))}
    </div>
  );
}