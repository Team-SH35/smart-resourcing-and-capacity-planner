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

  const [addOpen, setAddOpen] = useState(false);
  const [newJobCode, setNewJobCode] = useState(jobCodes[0]?.jobCode || "");
  const [newDays, setNewDays] = useState(0);

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

        {/* Right: + New button */}
        <div>
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
    </div>
  );
}