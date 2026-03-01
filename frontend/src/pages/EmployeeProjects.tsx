// EmployeeProject.tsx
import { useParams } from "react-router-dom";
import { useState } from "react";
import { forecastEntries as initialForecastEntries } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import type { ForecastEntry } from "../components/data/types";
import { employees } from "../components/data/employees";
import EmployeeProjectSchedule from "../components/employeeProjects/EmployeeProjectSchedule";

export default function EmployeeProjects() {
  const { employeeName } = useParams();
  const employee = employees.find(e => e.name === employeeName);

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


  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">
          {employee?.name}
        </h1>

        <p className="text-slate-400">
          {employee?.specialisms[0]}
        </p>
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