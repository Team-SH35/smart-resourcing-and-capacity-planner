import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import type { ForecastEntry, JobCode, Employee } from "../components/data/types";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

import {
  getEmployees,
  getJobs,
  getForecastEntries,
  getBusinessUnits,
  updateForecast,
  deleteForecast,
  createForecastEntry,
  getMonthWorkDays,
  upsertMonthWorkDays,
} from "../api/client";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";
type MonthWorkDays = {
  [key: string]: number;
};

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
  const [monthWorkDays, setMonthWorkDays] = useState<MonthWorkDays | null>(null);
  const [businessUnits, setBusinessUnits] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editMonthOpen, setEditMonthOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [newJobCode, setNewJobCode] = useState("");
  const [newDays, setNewDays] = useState(0);

  const [clientFilter, setClientFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [projectFilter, setProjectFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [monthForm, setMonthForm] = useState<MonthWorkDays>({});

  const workspaceID = 1;

  useEffect(() => {
    async function load() {
      const [empData, jobData, forecastData, monthDays, units] =
        await Promise.all([
          getEmployees(),
          getJobs(),
          getForecastEntries(),
          getMonthWorkDays(workspaceID).catch(() => null),
          getBusinessUnits(),
        ]);

      setEmployees(empData);
      setJobCodes(jobData);
      setForecastEntries(forecastData);
      setBusinessUnits(units);
      setMonthWorkDays(monthDays);
      setMonthForm(monthDays || {});
      setNewJobCode(jobData[0]?.jobCode || "");
      setLoading(false);
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

  const keys = [
    "jan","feb","mar","apr","may","jun",
    "jul","aug","sep","oct","nov","dec"
  ] as const;
  const key = keys[currentDate.getMonth()];

  const getWorkingDaysInMonth = (date: Date) => {
    let count = 0;
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    while (d.getMonth() === date.getMonth()) {
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  };

  const workingDays =
    monthWorkDays?.[`${key}_work`] ??
    getWorkingDaysInMonth(currentDate);

  const hypotheticalDays =
    monthWorkDays?.[`${key}_hypo`] ?? null;

  /* FILTER + SORT */
  const monthAllocations = forecastEntries
    .filter(entry =>
      entry.employeeName === employee.name &&
      entry.month === currentMonthName &&
      entry.days > 0 &&
      (!clientFilter ||
        entry.customer.toLowerCase().includes(clientFilter.toLowerCase())) &&
      (!projectFilter ||
        entry.description.toLowerCase().includes(projectFilter.toLowerCase())) &&
      (teamFilter.length === 0 ||
        teamFilter.includes(
          jobCodes.find(j => j.jobCode === entry.jobCode)?.businessUnit || ""
        ))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.description.localeCompare(b.description);
        case "name-desc": return b.description.localeCompare(a.description);
        case "days-asc": return a.days - b.days;
        case "days-desc": return b.days - a.days;
        default: return 0;
      }
    });

  const allocatedJobCodes = monthAllocations.map(e => e.jobCode);
  const availableProjects = jobCodes.filter(
    j => !allocatedJobCodes.includes(j.jobCode)
  );

  const totalAllocated = monthAllocations.reduce(
    (sum, entry) => sum + entry.days,
    0
  );

  const targetDays = hypotheticalDays ?? workingDays;

  const status =
    totalAllocated < targetDays
      ? "Underallocated"
      : totalAllocated > targetDays
      ? "Overallocated"
      : "Fully allocated";

  const remainingCapacity = targetDays - totalAllocated;

  const updateAllocation = async (jobCode: string, days: number) => {
    await updateForecast({ employeeName: employee.name, jobCode, month: currentMonthName, days });
    setForecastEntries(prev =>
      prev.map(e =>
        e.jobCode === jobCode && e.month === currentMonthName
          ? { ...e, days }
          : e
      )
    );
  };

  const deleteAllocation = async (jobCode: string) => {
    await deleteForecast({ employeeName: employee.name, jobCode, month: currentMonthName });
    setForecastEntries(prev =>
      prev.filter(e =>
        !(e.jobCode === jobCode && e.month === currentMonthName)
      )
    );
  };

  const addAllocation = async () => {
    await createForecastEntry({
      employeeName: employee.name,
      jobCode: newJobCode,
      month: currentMonthName,
      days: newDays,
    });

    setForecastEntries(prev => [
      ...prev,
      {
        employeeName: employee.name,
        jobCode: newJobCode,
        description: jobCodes.find(j => j.jobCode === newJobCode)?.description || "",
        customer: jobCodes.find(j => j.jobCode === newJobCode)?.customerName || "",
        days: newDays,
        cost: null,
        month: currentMonthName,
      },
    ]);

    setAddOpen(false);
    setNewDays(0);
  };

  const saveMonthDays = async () => {
    const payload = {} as Parameters<typeof upsertMonthWorkDays>[0];

    payload.workspaceID = workspaceID;

    keys.forEach((k) => {
      payload[`${k}_work`] = monthForm[`${k}_work`] ?? 0;
      payload[`${k}_hypo`] = monthForm[`${k}_hypo`] ?? 0;
    });

    await upsertMonthWorkDays(payload);

    setMonthWorkDays(monthForm);
    setEditMonthOpen(false);
  };
  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div className="flex items-end justify-between mb-4">
        <div className="flex items-end gap-10">

          {/* NAME */}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {employee.name}
            </h1>
            <p className="text-slate-400">
              {employee.specialisms?.join(", ") || ""}
            </p>
          </div>

          {/* ✅ ALLOCATION CARD */}
          <div
            className={`w-60 rounded-lg border px-3 py-2 text-sm font-medium ${
              status === "Underallocated"
                ? "bg-red-100 text-red-500"
                : status === "Overallocated"
                ? "bg-yellow-100 text-yellow-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            <div className="font-semibold">
              Status: {status}
            </div>

            <hr className=" my-2 border-current border-[2px] opacity-80" />

            <div className="text-xs">
              {status === "Underallocated" &&
                `${targetDays - totalAllocated} days left to allocate`}
              {status === "Overallocated" &&
                `${totalAllocated - targetDays} days overallocated`}
              {status === "Fully allocated" && "All days allocated"}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddOpen(true)}
            className="bg-blue-600 text-white rounded px-3 py-1"
          >
            + Add Allocation
          </button>

          <button
            onClick={() => setFiltersOpen(true)}
            className="border rounded px-3 py-1"
          >
            <div className="flex justify-end gap-2">
              <span className="material-icons-outlined text">
                filter_alt
              </span>
              Filters
            </div>
          </button>

          {/* SORT BACK IN UI */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border rounded px-3 py-1"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="days-asc">Days Low–High</option>
            <option value="days-desc">Days High–Low</option>
          </select>

        </div>
      </div>

      {/* MONTH HEADER + NAV */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <div className="font-semibold">{monthKey}</div>
            <div className="text-sm text-slate-400">
              Working: {workingDays}
              {hypotheticalDays !== null && ` | Hypo: ${hypotheticalDays}`}
              
              <button
                onClick={() => setEditMonthOpen(true)}
              >
                <span className="material-icons-outlined text-lg">
                  more_horiz
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date())} className="border px-3 py-1 rounded">Today</button>
            <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() - 1, 1))} className="border px-3 py-1 rounded">←</button>
            <button onClick={() => setCurrentDate(p => new Date(p.getFullYear(), p.getMonth() + 1, 1))} className="border px-3 py-1 rounded">→</button>
          </div>
        </div>

        <div className="p-4">
          <EmployeeProjectSchedule
            employeeName={employee.name}
            forecastEntries={monthAllocations}
            jobCodes={jobCodes}
            currentDate={currentDate}
            onUpdateAllocation={updateAllocation}
            onDeleteAllocation={deleteAllocation}
          />
        </div>
      </div>

      {/* ADD MODAL */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999]">
          <div className="bg-white p-6 w-96 space-y-4">
            <h2 className="font-semibold text-lg">Add Allocation</h2>

            {/* Remaining capacity */}
            <div className="text-sm text-slate-500">
              Remaining capacity:{" "}
              <span
                className={`font-semibold ${
                  remainingCapacity < 0
                    ? "text-red-500"
                    : remainingCapacity === 0
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {remainingCapacity} days
              </span>
            </div>

            {/* Project select */}
            <select
              value={newJobCode}
              onChange={(e) => setNewJobCode(e.target.value)}
              className="w-full border px-3 py-2"
            >
              {availableProjects.map((j) => (
                <option key={j.jobCode} value={j.jobCode}>
                  {j.description}
                </option>
              ))}
            </select>

            {/* Days input */}
            <input
              type="number"
              value={newDays}
              onChange={(e) => setNewDays(Number(e.target.value))}
              className="w-full border px-3 py-2"
              placeholder="Days"
            />

            {/* Quick fill buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setNewDays(Math.max(remainingCapacity, 0))}
                className="border px-2 py-1 text-xs rounded"
              >
                Fill Remaining
              </button>
            </div>

            {/* Warning */}
            {newDays > remainingCapacity && (
              <p className="text-xs text-red-500">
                This will overallocate the employee
              </p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddOpen(false)}>Cancel</button>

              <button
                onClick={addAllocation}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILTER MODAL */}
      {filtersOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-[9999]">
          <div className="bg-white rounded-xl p-6 w-96 space-y-3">
            <div className="flex gap-2">
              <span className="material-icons-outlined text">
                filter_alt
              </span>
              <h2 className="font-semibold text-lg">Filters</h2>
            </div>
            <input placeholder="Client" value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="border rounded-xl w-full px-2 py-1"/>
            <input
              placeholder="Project name"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="border rounded-xl w-full px-2 py-1"
            />
            {businessUnits.map((unit) => (
              <label key={unit} className="flex gap-2">
                <input
                  type="checkbox"
                  checked={teamFilter.includes(unit)}
                  onChange={(e) =>
                    setTeamFilter((prev) =>
                      e.target.checked
                        ? [...prev, unit]
                        : prev.filter((u) => u !== unit)
                    )
                  }
                />
                {unit}
              </label>
            ))}

            <button onClick={() => setFiltersOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* EDIT MONTH MODAL */}
      {editMonthOpen && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-[9999]">
          <div className="bg-white p-6 w-[600px] space-y-3">
            <h2 className="font-semibold">Edit Month Days</h2>

            {/* HEADINGS */}
            <div className="flex gap-2 mb-2 font-semibold text-sm text-slate-500">
              <span className="w-16"></span>
              <span className="flex-1 text-center">Working</span>
              <span className="flex-1 text-center">Hypothetical</span>
            </div>

            {/* MONTH ROWS */}
            {keys.map((k) => (
              <div key={k} className="flex gap-2 items-center">
                <span className="w-16 font-medium">{k.toUpperCase()}</span>

                <input
                  type="number"
                  className="flex-1 border rounded px-2 py-1"
                  value={monthForm[`${k}_work`] || 0}
                  onChange={(e) =>
                    setMonthForm({
                      ...monthForm,
                      [`${k}_work`]: Number(e.target.value),
                    })
                  }
                />

                <input
                  type="number"
                  className="flex-1 border rounded px-2 py-1"
                  value={monthForm[`${k}_hypo`] || 0}
                  onChange={(e) =>
                    setMonthForm({
                      ...monthForm,
                      [`${k}_hypo`]: Number(e.target.value),
                    })
                  }
                />
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditMonthOpen(false)}>Cancel</button>
              <button onClick={saveMonthDays} className="bg-blue-600 border rounded text-white px-3 py-1">Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
