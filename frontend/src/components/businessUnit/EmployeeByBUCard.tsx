import { useMemo } from "react";
import type { Employee, ForecastEntry } from "../data/types";
import { useNavigate } from "react-router-dom";

type SortOption = "name-asc" | "name-desc" | "alloc-asc" | "alloc-desc";
type AllocationFilter = "under" | "correct" | "over" | "";

interface Props {
  employees: Employee[];
  forecastEntries: ForecastEntry[];
  filterName?: string;
  filterSpecialism?: string;
  filterAllocation?: AllocationFilter;
  sortBy?: SortOption;
}

function getWorkingDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day).getDay();
    if (d !== 0 && d !== 6) workingDays++;
  }

  return workingDays;
}

export default function EmployeeByBUCard({
  employees,
  forecastEntries,
  filterName = "",
  filterSpecialism = "",
  filterAllocation = "",
  sortBy = "name-asc",
}: Props) {
  const navigate = useNavigate(); // ✅ correct place

  const today = new Date();

  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });

  const workingDays = getWorkingDaysInMonth(today);

  const normalize = (str: string) => str.toLowerCase().trim();

  const employeesWithAllocation = useMemo(() => {
    return employees.map((employee) => {
      const totalAllocated = forecastEntries
        .filter(
          (entry) =>
            normalize(entry.employeeName) === normalize(employee.name) &&
            normalize(entry.month) === normalize(currentMonth)
        )
        .reduce((sum, entry) => sum + entry.days, 0);

      const allocation =
        workingDays > 0
          ? Math.round((totalAllocated / workingDays) * 100)
          : 0;

      return { ...employee, allocation };
    });
  }, [employees, forecastEntries, currentMonth, workingDays]);

  const filteredAndSorted = useMemo(() => {
    let result = [...employeesWithAllocation];

    if (filterName) {
      result = result.filter((e) =>
        e.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    if (filterSpecialism) {
      result = result.filter((e) =>
        e.specialisms?.some(
          (s) => s.toLowerCase() === filterSpecialism.toLowerCase()
        )
      );
    }

    if (filterAllocation) {
      result = result.filter((e) => {
        if (filterAllocation === "under") return e.allocation < 80;
        if (filterAllocation === "correct")
          return e.allocation >= 80 && e.allocation <= 100;
        if (filterAllocation === "over") return e.allocation > 100;
        return true;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "alloc-asc":
          return a.allocation - b.allocation;
        case "alloc-desc":
          return b.allocation - a.allocation;
        default:
          return 0;
      }
    });

    return result;
  }, [
    employeesWithAllocation,
    filterName,
    filterSpecialism,
    filterAllocation,
    sortBy,
  ]);

  const getColor = (val: number) => {
    if (val < 80) return "text-orange-500";
    if (val <= 100) return "text-green-500";
    return "text-red-500";
  };

  if (filteredAndSorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
        No employees found for this business unit.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      {filteredAndSorted.map((e, i) => (
        <div key={e.name}>
          <div
            onClick={() =>
              navigate(`/Employee/${encodeURIComponent(e.name)}`)
            }
            className="flex justify-between px-6 py-4 hover:bg-slate-50 cursor-pointer transition"
          >
            <div>
              <div className="font-medium">{e.name}</div>
              <div className="text-slate-500">
                {e.specialisms?.join(", ")}
              </div>
            </div>

            <div className={`font-semibold ${getColor(e.allocation)}`}>
              {e.allocation}%
            </div>
          </div>

          {i !== filteredAndSorted.length - 1 && (
            <div className="border-t mx-6" />
          )}
        </div>
      ))}
    </div>
  );
}