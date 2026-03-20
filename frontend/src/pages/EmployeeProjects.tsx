import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import type { ForecastEntry, JobCode, Employee } from "../components/data/types";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

import {
  getEmployees,
  getJobs,
  getForecastEntries,
} from "../api/client";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

export default function EmployeeProjects() {
  const { employeeName } = useParams();
  const decodedName = decodeURIComponent(employeeName || "");

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobCodes, setJobCodes] = useState<JobCode[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [clientFilter, setClientFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  useEffect(() => {
    async function load() {
      try {
        const [empData, jobData, forecastData] = await Promise.all([
          getEmployees(),
          getJobs(),
          getForecastEntries(),
        ]);

        setEmployees(empData);
        setJobCodes(jobData);
        setForecastEntries(forecastData);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (!decodedName) return null;
  if (loading) return <p className="p-6">Loading...</p>;

  const employee = employees.find(
    e => e.name.trim().toLowerCase() === decodedName.trim().toLowerCase()
  );

  if (!employee) return <p className="p-6">Employee not found</p>;

  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const currentMonthName = currentDate.toLocaleString("default", {
    month: "long",
  });


  const filteredForecastEntries = forecastEntries.filter(entry => {
    const sameEmployee =
      entry.employeeName.trim().toLowerCase() ===
      employee.name.trim().toLowerCase();

    const sameMonth = entry.month === currentMonthName;

    if (!sameEmployee || !sameMonth) return false;

    if (
      clientFilter &&
      !entry.customer.toLowerCase().includes(clientFilter.toLowerCase())
    )
      return false;

    if (teamFilter.length > 0) {
      const job = jobCodes.find(j => j.jobCode === entry.jobCode);
      if (!job || !teamFilter.includes(job.businessUnit)) return false;
    }

    if (entry.days === 0) return false;

    return true;
  });

  const sortedForecastEntries = [...filteredForecastEntries].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.description.localeCompare(b.description);
      case "name-desc":
        return b.description.localeCompare(a.description);
      case "days-asc":
        return a.days - b.days;
      case "days-desc":
        return b.days - a.days;
      default:
        return 0;
    }
  });

  const monthAllocations = sortedForecastEntries;

  const getWorkingDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    let workingDays = 0;
    const current = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    while (current <= last) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) workingDays++;
      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };

  const workingDays = getWorkingDaysInMonth(currentDate);

  const totalAllocated = monthAllocations.reduce(
    (sum, entry) => sum + entry.days,
    0
  );

  const updateAllocation = (jobCode: string, newDays: number) => {
    setForecastEntries(prev =>
      prev.map(entry =>
        entry.employeeName === employee.name &&
        entry.jobCode === jobCode &&
        entry.month === currentMonthName
          ? { ...entry, days: newDays }
          : entry
      )
    );
  };

  const deleteAllocation = (jobCode: string) => {
    setForecastEntries(prev =>
      prev.filter(
        entry =>
          !(
            entry.employeeName === employee.name &&
            entry.jobCode === jobCode &&
            entry.month === currentMonthName
          )
      )
    );
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const goPrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{employee.name}</h1>
            <p className="text-slate-400">{employee.specialisms[0]}</p>
          </div>

          <div
            className={`w-60 rounded-lg border px-3 py-2 text-sm font-medium ${
              totalAllocated < workingDays
                ? "bg-red-100 text-red-400"
                : totalAllocated > workingDays
                ? "bg-yellow-100 text-yellow-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            <div className="font-semibold">
              Status:{" "}
              {totalAllocated < workingDays
                ? "Underallocated"
                : totalAllocated > workingDays
                ? "Overallocated"
                : "Fully allocated"}
            </div>

            <hr className="my-2 border-current border-[2px] opacity-90" />

            <div className="text-xs">
              {totalAllocated < workingDays
                ? `${workingDays - totalAllocated} days left`
                : totalAllocated > workingDays
                ? `${totalAllocated - workingDays} days overallocated`
                : "All days allocated"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="border rounded px-3 py-1"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="days-asc">Days Low–High</option>
            <option value="days-desc">Days High–Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <div className="font-semibold">{monthKey}</div>
            <div className="text-sm text-slate-400">
              Hypo/Working Days: {workingDays}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={goToToday} className="border rounded px-3 py-1">
              Today
            </button>
            <button onClick={goPrevMonth} className="border rounded px-3 py-1">
              ←
            </button>
            <button onClick={goNextMonth} className="border rounded px-3 py-1">
              →
            </button>
          </div>
        </div>

        <div className="p-4">
          {monthAllocations.length === 0 ? (
            <p className="p-4 text-slate-400">No allocations this month</p>
          ) : (
            <EmployeeProjectSchedule
              employeeName={employee.name}
              forecastEntries={sortedForecastEntries}
              jobCodes={jobCodes}
              currentDate={currentDate}
              onUpdateAllocation={updateAllocation}
              onDeleteAllocation={deleteAllocation}
            />
          )}
        </div>
      </div>
    </div>
  );
}