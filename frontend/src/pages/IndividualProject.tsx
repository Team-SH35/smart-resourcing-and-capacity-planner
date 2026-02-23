import { useParams } from "react-router-dom";
import { useState } from "react";
import { employees } from "../components/data/employees";
import { forecastEntries } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import EmployeeSchedule from "../components/IndividualProject/EmployeeSchedule";

export default function IndividualProject() {
  const { jobCode } = useParams();
  const job = jobCodes.find(j => j.jobCode === jobCode);
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!jobCode) return null;

  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const monthLabel = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 p-6">
      {/* Job Header */}
      <div>
        <h1 className="text-xl font-semibold">
          {job?.description}
        </h1>
        <p className="text-slate-400">
          {job?.customerName} • {job?.jobCode}
        </p>
      </div>

      {/* Month Navigation */}
      
      <div className="bg-white border rounded-xl overflow-hidden">
        {/* Header with Month and Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-800">{monthLabel}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())} // Today button resets date
              className="border rounded px-3 py-1 hover:bg-gray-100"
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="border rounded px-3 py-1 hover:bg-gray-100"
            >
              ←
            </button>
            <button
              onClick={nextMonth}
              className="border rounded px-3 py-1 hover:bg-gray-100"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar / Employee Schedule */}
        <div className="p-4">
          <EmployeeSchedule
            employees={employees}
            forecastEntries={forecastEntries}
            currentDate={currentDate}
            jobCode={jobCode!}
          />
        </div>
      </div>

    </div>
  );
}