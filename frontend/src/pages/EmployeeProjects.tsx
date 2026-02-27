// EmployeeProject.tsx
import { useParams } from "react-router-dom";
import { useState } from "react";
import { forecastEntries as initialForecastEntries } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import type { ForecastEntry } from "../components/data/types";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

export default function EmployeeProjects() {
  const { employeeName } = useParams();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecastEntries, setForecastEntries] =
    useState<ForecastEntry[]>(initialForecastEntries);

  if (!employeeName) return null;

  const monthKey = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

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

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold">
        {employeeName} – Project Allocations
      </h1>

      {/* Month Nav */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="font-semibold">{monthKey}</div>

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
          <EmployeeProjectSchedule
            employeeName={employeeName}
            forecastEntries={forecastEntries}
            jobCodes={jobCodes}
            currentDate={currentDate}
            onUpdateAllocation={updateAllocation}
            onDeleteAllocation={deleteAllocation}
          />
        </div>
      </div>
    </div>
  );
}