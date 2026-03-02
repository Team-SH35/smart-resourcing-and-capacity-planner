import { useParams } from "react-router-dom";
import { useState } from "react";
import { forecastEntries as initialForecastEntries } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import type { ForecastEntry } from "../components/data/types";
import { employees } from "../components/data/employees";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

export default function EmployeeProjects() {
  const { employeeName } = useParams();
  const employee = employees.find(e => e.name === employeeName);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecastEntries, setForecastEntries] =
    useState<ForecastEntry[]>(initialForecastEntries);

  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const [addOpen, setAddOpen] = useState(false);
  const [newJobCode, setNewJobCode] = useState(jobCodes[0]?.jobCode || "");
  const [newDays, setNewDays] = useState(0);

  const [clientFilter, setClientFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const businessUnits = ["Developers", "Analytics"];

  const [filtersOpen, setFiltersOpen] = useState(false);

    const filteredForecastEntries = forecastEntries.filter(entry => {
    // Only this employee
    if (entry.employeeName !== employeeName) return false;

    // Only this month
    if (entry.month !== monthKey) return false;

    // Client name filter
    if (
      clientFilter &&
      !entry.customer.toLowerCase().includes(clientFilter.toLowerCase())
    )
      return false;

    // Business unit filter
    if (teamFilter.length > 0) {
      const job = jobCodes.find(j => j.jobCode === entry.jobCode);
      if (!job || !teamFilter.includes(job.businessUnit)) return false;
    }

    return true;
  });

  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

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

  if (!employeeName) return null;

  const updateAllocation = (jobCode: string, newDays: number) => {
    setForecastEntries(prev =>
      prev.map(entry =>
        entry.employeeName === employeeName &&
        entry.jobCode === jobCode &&
        entry.month === monthKey
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
            entry.employeeName === employeeName &&
            entry.jobCode === jobCode &&
            entry.month === monthKey
          )
      )
    );
  };

    const getWorkingDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let workingDays = 0;
    const current = new Date(firstDay);

    while (current <= lastDay) {
      const day = current.getDay();

      if (day !== 0 && day !== 6) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  };
  const workingDays = getWorkingDaysInMonth(currentDate);

   const allocatedJobCodes = forecastEntries
  .filter(entry => entry.employeeName === employeeName && entry.month === monthKey)
  .map(entry => entry.jobCode);

  const availableProjects = jobCodes.filter(j => !allocatedJobCodes.includes(j.jobCode));

  // total allocated days for this employee this month
  const totalAllocated = forecastEntries
    .filter(entry => entry.employeeName === employeeName && entry.month === monthKey)
    .reduce((sum, entry) => sum + entry.days, 0);

  // remaining days (can be negative if overallocated)
  const remainingDays = workingDays - totalAllocated;

  const monthAllocations = forecastEntries.filter(
  entry =>
    entry.employeeName === employeeName &&
    entry.month === monthKey
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between mb-4">
        {/* Left: Name + Allocation */}
        <div className="flex items-end gap-4">
          {/* Employee info */}
          <div>
            <h1 className="text-xl font-semibold">{employee?.name}</h1>
            <p className="text-slate-400">{employee?.specialisms[0]}</p>
          </div>

          {/* Allocation status card */}
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
                ? `${workingDays - totalAllocated} day${
                    workingDays - totalAllocated !== 1 ? "s" : ""
                  } left`
                : totalAllocated > workingDays
                ? `${totalAllocated - workingDays} day${
                    totalAllocated - workingDays !== 1 ? "s" : ""
                  } overallocated`
                : "All days allocated"}
            </div>
          </div>
        </div>

        {/* Right:Filter + New button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltersOpen(true)}
            className="border rounded px-3 py-1"
          >
            Filters
          </button>

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

          <button
            onClick={() => {
              setNewJobCode(availableProjects[0]?.jobCode || "");
              setAddOpen(true);
            }}
            className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
          >
            + New
          </button>
        </div>
      </div>

      {/* Month Nav */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div> 
            <div className="font-semibold">{monthKey}</div>
            <div className="text-sm text-slate-400">
              Hypo/Working Days: {workingDays}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="border rounded px-3 py-1"
            >
              Today
            </button>

            <button
              onClick={() =>
                setCurrentDate(prev => {
                  const d = new Date(prev);
                  d.setMonth(d.getMonth() - 1);
                  return d;
                })
              }
              className="border rounded px-3 py-1"
            >
              ←
            </button>

            <button
              onClick={() =>
                setCurrentDate(prev => {
                  const d = new Date(prev);
                  d.setMonth(d.getMonth() + 1);
                  return d;
                })
              }
              className="border rounded px-3 py-1"
            >
              →
            </button>
          </div>
        </div>

        <div className="p-4">
          {monthAllocations.length === 0 ? (
            <p className="p-4 text-slate-400">
              No allocations this month
            </p>
          ) : (
            <EmployeeProjectSchedule
              employeeName={employeeName}
              forecastEntries={sortedForecastEntries}
              jobCodes={jobCodes}
              currentDate={currentDate}
              onUpdateAllocation={updateAllocation}
              onDeleteAllocation={deleteAllocation}
            />
          )}
        </div>
      </div>

      {addOpen && (
      <div
        className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        onClick={() => setAddOpen(false)}
      >
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-semibold mb-6">
            Add Allocation
          </h2>

          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-1">Project</label>
            <select
              value={newJobCode}
              onChange={(e) => setNewJobCode(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {availableProjects.map(j => (
                <option key={j.jobCode} value={j.jobCode}>
                  {j.description} ({j.jobCode})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="text-sm text-slate-400 block mb-1">
              Days Allocated
            </label>
            <input
              type="number"
              min={0}
              max={workingDays}
              value={newDays}
              onChange={(e) => setNewDays(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-slate-400 mt-1">
              Maximum {workingDays} days
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddOpen(false)}
              className="border rounded px-3 py-1 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={() => {
                const selectedJob = jobCodes.find(j => j.jobCode === newJobCode);
                if (!selectedJob) return;

                const newEntry = {
                  employeeName: employeeName!,
                  customer: selectedJob.customerName, 
                  jobCode: selectedJob.jobCode,
                  description: selectedJob.description,
                  days: newDays,
                  cost: null,
                  month: monthKey,
                };

                setForecastEntries(prev => [...prev, newEntry]);
                setAddOpen(false);
                setNewDays(0);
              }}
              className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Filter modal */}
      {filtersOpen && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-96 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">Filters</h2>

            {/* Client filter */}
            <input
              placeholder="Client name"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="border rounded w-full px-3 py-2"
            />

            {/* Business units */}
            <div className="space-y-2">
              <div className="font-medium text-sm">Business units</div>
              {businessUnits.map((unit) => (
                <label key={unit} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={teamFilter.includes(unit)}
                    onChange={(e) =>
                      setTeamFilter((t) =>
                        e.target.checked
                          ? [...t, unit]
                          : t.filter((x) => x !== unit)
                      )
                    }
                  />
                  {unit}
                </label>
              ))}
            </div>

            {/* Close button */}
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