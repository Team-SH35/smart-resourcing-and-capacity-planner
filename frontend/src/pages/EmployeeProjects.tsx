import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import type { ForecastEntry, JobCode, Employee } from "../components/data/types";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

import {
  getEmployees,
  getJobs,
  getForecastEntries,
  updateForecast,
  deleteForecast,
  createForecastEntry,
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

  const [addOpen, setAddOpen] = useState(false);
  const [newJobCode, setNewJobCode] = useState("");
  const [newDays, setNewDays] = useState(0);

  const [clientFilter, setClientFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const businessUnits = ["Developers", "Analytics"];

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
        setNewJobCode(jobData[0]?.jobCode || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (!decodedName) return null;
  if (loading) return <p className="p-6">Loading...</p>;

  const employee = employees.find(
    e => e.name.toLowerCase().trim() === decodedName.toLowerCase().trim()
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
    if (
      entry.employeeName.toLowerCase().trim() !==
      employee.name.toLowerCase().trim()
    )
      return false;

    if (entry.month !== currentMonthName) return false;
    if (entry.days === 0) return false;

    if (
      clientFilter &&
      !entry.customer.toLowerCase().includes(clientFilter.toLowerCase())
    )
      return false;

    if (teamFilter.length > 0) {
      const job = jobCodes.find(j => j.jobCode === entry.jobCode);
      if (!job || !teamFilter.includes(job.businessUnit)) return false;
    }

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
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let workingDays = 0;
    const current = new Date(firstDay);

    while (current <= lastDay) {
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

  const allocatedJobCodes = monthAllocations.map(e => e.jobCode);
  const availableProjects = jobCodes.filter(
    j => !allocatedJobCodes.includes(j.jobCode)
  );

  // API functions
  const updateAllocation = async (jobCode: string, newDays: number) => {
    setForecastEntries(prev =>
      prev.map(entry =>
        entry.employeeName === employee.name &&
        entry.jobCode === jobCode &&
        entry.month === currentMonthName
          ? { ...entry, days: newDays }
          : entry
      )
    );

    await updateForecast({
      employeeName: employee.name,
      jobCode,
      month: currentMonthName,
      days: newDays,
    });
  };

  const deleteAllocation = async (jobCode: string) => {
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

    await deleteForecast({
      employeeName: employee.name,
      jobCode,
      month: currentMonthName,
    });
  };

  const addAllocation = async () => {
    const job = jobCodes.find(j => j.jobCode === newJobCode);
    if (!job) return;

    const newEntry: ForecastEntry = {
      employeeName: employee.name,
      customer: job.customerName,
      jobCode: job.jobCode,
      description: job.description,
      days: newDays,
      cost: null,
      month: currentMonthName,
    };

    setForecastEntries(prev => [...prev, newEntry]);

    await createForecastEntry({
      employeeName: employee.name,
      jobCode: newJobCode,
      month: currentMonthName,
      days: newDays,
    });

    setAddOpen(false);
    setNewDays(0);
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-end gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {employee.name}
            </h1>
            <p className="text-slate-400">{employee.specialisms[0]}</p>
          </div>

          {/* STATUS CARD */}
          <div
            className={`w-60 rounded-lg border px-3 py-2 text-sm font-medium ${
              totalAllocated < workingDays
                ? "bg-red-100 text-red-500"
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

            <hr className="my-2 border-current border-[2px] opacity-80" />

            <div className="text-xs">
              {totalAllocated < workingDays
                ? `${workingDays - totalAllocated} days left`
                : totalAllocated > workingDays
                ? `${totalAllocated - workingDays} days over`
                : "All days allocated"}
            </div>
          </div>
        </div>

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
            onClick={() => setAddOpen(true)}
            className="bg-blue-600 text-white rounded px-3 py-1"
          >
            + New
          </button>
        </div>
      </div>

      {/* MONTH */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <div className="font-semibold">{monthKey}</div>
            <div className="text-sm text-slate-400">
              Working Days: {workingDays}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="border px-3 py-1 rounded"
            >
              Today
            </button>
            <button
              onClick={() =>
                setCurrentDate(
                  prev =>
                    new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
              className="border px-3 py-1 rounded"
            >
              ←
            </button>
            <button
              onClick={() =>
                setCurrentDate(
                  prev =>
                    new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
              className="border px-3 py-1 rounded"
            >
              →
            </button>
          </div>
        </div>

        <div className="p-4">
          {monthAllocations.length === 0 ? (
            <p className="text-slate-400">No allocations this month</p>
          ) : (
            <EmployeeProjectSchedule
              employeeName={employee.name}
              forecastEntries={monthAllocations}
              jobCodes={jobCodes}
              currentDate={currentDate}
              onUpdateAllocation={updateAllocation}
              onDeleteAllocation={deleteAllocation}
            />
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {addOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-96"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="font-semibold mb-4">Add Allocation</h2>

            <select
              value={newJobCode}
              onChange={e => setNewJobCode(e.target.value)}
              className="w-full border mb-4 px-3 py-2"
            >
              {availableProjects.map(j => (
                <option key={j.jobCode} value={j.jobCode}>
                  {j.description}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={newDays}
              onChange={e => setNewDays(Number(e.target.value))}
              className="w-full border px-3 py-2 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setAddOpen(false)}>Cancel</button>
              <button
                onClick={addAllocation}
                className="bg-blue-600 text-white px-3 py-1"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
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