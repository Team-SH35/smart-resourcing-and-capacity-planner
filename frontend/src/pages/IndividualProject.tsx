import { useParams } from "react-router-dom";
import { useState } from "react";
import { employees } from "../components/data/employees";
import { forecastEntries as initialForecastEntries } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import EmployeeSchedule from "../components/individualProject/EmployeeSchedule";
import type { ForecastEntry } from "../components/data/types";

type SortOption = "name-asc" | "name-desc" | "days-asc" | "days-desc";

export default function IndividualProject() {
  const { jobCode } = useParams();
  const job = jobCodes.find(j => j.jobCode === jobCode);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecastEntries, setForecastEntries] = useState<ForecastEntry[]>(initialForecastEntries);
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!jobCode) return null;

  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const updateAllocation = (employeeName: string, newDays: number) => {
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

  const deleteAllocation = (employeeName: string) => {
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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

      {/* Month Nav */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-white border rounded-xl p-4">
          <div className="font-semibold">{monthKey}</div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date())} className="border rounded px-3 py-1">Today</button>
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth()-1)))} className="border rounded px-3 py-1">←</button>
            <button onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth()+1)))} className="border rounded px-3 py-1">→</button>
          </div>
        </div>
         {/* Schedule */}
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