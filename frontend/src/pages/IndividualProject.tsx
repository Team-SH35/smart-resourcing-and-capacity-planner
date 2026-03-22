import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import EmployeeSchedule from "../components/IndividualProject/EmployeeSchedule";
import type { ForecastEntry, Employee, JobCode } from "../components/data/types";
import { createForecastEntry } from "../api/client";

import {
  getEmployees,
  getJobs,
  getForecastEntries,
  updateForecast,
  deleteForecast,
} from "../api/client";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

export default function IndividualProject() {
  const { jobCode } = useParams();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [newDays, setNewDays] = useState(0);
  

  useEffect(() => {
    async function loadData() {
      const [emp, jobsData, forecast] = await Promise.all([
        getEmployees(),
        getJobs(),
        getForecastEntries(),
      ]);

      setEmployees(emp);
      setJobs(jobsData);
      setForecastEntries(forecast);
    }

    loadData();
  }, []);

  if (!jobCode) return null;

  const job = jobs.find((j: JobCode) => String(j.jobCode) === String(jobCode));

  const monthKey = currentDate.toLocaleString("default", { month: "long" });

  const updateAllocation = async (employeeName: string, newDays: number) => {
    await updateForecast({ employeeName, jobCode, month: monthKey, days: newDays });
    setForecastEntries(await getForecastEntries());
  };

  const deleteAllocation = async (employeeName: string) => {
    await deleteForecast({ employeeName, jobCode, month: monthKey });
    setForecastEntries(await getForecastEntries());
  };


  const createAllocation = async () => {
    if (!selectedEmployee) return;

    await createForecastEntry({
      employeeName: selectedEmployee,
      jobCode,
      month: monthKey,
      days: newDays,
    });

    setForecastEntries(await getForecastEntries());

    setAddOpen(false);
    setSelectedEmployee("");
    setNewDays(0);
  };

  const filteredForecasts = forecastEntries.filter(
    (f) =>
      f.jobCode === jobCode &&
      f.month === monthKey &&
      f.days > 0
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{job?.description}</h1>
          <p className="text-slate-400">
            {job?.customerName} • {job?.jobCode}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddOpen(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            + Add Allocation
          </button>

          <button onClick={() => setFiltersOpen(true)} className="bg-white border rounded px-3 py-1 hover:bg-gray-100">
            Filters
          </button>

          <select value={sortBy} 
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="border rounded px-3 py-1 hover:bg-gray-100">
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="days-asc">Days Low–High</option>
            <option value="days-desc">Days High–Low</option>
          </select>
        </div>
      </div>
      <div className="bg-white border rounded-xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="font-semibold">
          {currentDate.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-slate-400 border rounded px-3 py-1"
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

      {/* Schedule */}
      {filteredForecasts.length === 0 ? (
        <div className="text-center text-slate-400 py-10">
          No forecasts for this month
        </div>
      ) : (
        <div className="p-4">
              <EmployeeSchedule
                employees={employees}
                forecastEntries={forecastEntries}
                currentDate={currentDate}
                jobCode={jobCode}
                sortBy={sortBy}
                filtersOpen={filtersOpen}
                setFiltersOpen={setFiltersOpen}
                onUpdateAllocation={updateAllocation}
                onDeleteAllocation={deleteAllocation}
              />
            </div>
      )}
      
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

            {/* Employee select */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-1">
                Employee
              </label>

              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select employee</option>
                {employees.map((e) => (
                  <option key={e.name} value={e.name}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Days */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 block mb-1">
                Days
              </label>

              <input
                type="number"
                min={1}
                value={newDays}
                onChange={(e) => setNewDays(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="border rounded px-3 py-1"
              >
                Cancel
              </button>

              <button
                onClick={createAllocation}
                className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}