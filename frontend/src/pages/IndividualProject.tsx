import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import EmployeeSchedule from "../components/IndividualProject/EmployeeSchedule";
import type { ForecastEntry } from "../components/data/types";
import {
  getEmployees,
  getJobs,
  getForecastEntries,
} from "../api/client";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

export default function IndividualProject() {
  const { jobCode } = useParams();

  const [employees, setEmployees] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [emp, jobsData, forecast] = await Promise.all([
          getEmployees(),
          getJobs(),
          getForecastEntries(),
        ]);

        const mappedEmployees = emp.map((e: any) => ({
          name: e.name,
          specialisms: e.specialisms,
        }));

        setEmployees(mappedEmployees);
        setJobs(jobsData);
        setForecastEntries(forecast);

      } catch (err) {
        console.error("Failed to load data", err);
      }
    }

    loadData();
  }, []);

  if (!jobCode) return null;

  const job = jobs.find((j: any) => String(j.jobCode) === String(jobCode));

  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
  });

  const displayMonth = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const updateAllocation = (employeeName: string, newDays: number) => {
    setForecastEntries(prev =>
      prev.map(entry =>
        entry.employeeName === employeeName &&
        String(entry.jobCode) === String(jobCode) &&
        entry.month === monthKey
          ? { ...entry, days: newDays }
          : entry
      )
    );
  };

  const deleteAllocation = (employeeName: string) => {
    setForecastEntries(prev =>
      prev.filter(
        entry =>
          !(
            entry.employeeName === employeeName &&
            String(entry.jobCode) === String(jobCode) &&
            entry.month === monthKey
          )
      )
    );
  };

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
            onClick={() => setFiltersOpen(true)}
            className="border rounded px-3 py-1 text-sm"
          >
            Filters
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="days-asc">Days Low–High</option>
            <option value="days-desc">Days High–Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-white border rounded-xl p-4">
          <div className="font-semibold">{displayMonth}</div>

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

        <div className="bg-white border rounded-xl p-4">
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
      </div>
    </div>
  );
}