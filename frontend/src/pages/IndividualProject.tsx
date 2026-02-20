import { useMemo, useState } from "react";
import { employees } from "../components/data/employees";
import { forecastEntries as initialForecast } from "../components/data/forecastEntries";
import { jobCodes } from "../components/data/jobCodes";
import EmployeeAllocationList from "../components/IndividualProject/EmployeeAllocationList";
import { useParams } from "react-router-dom";

const MONTH_CAPACITY = 20;

export default function ProjectDetail() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [forecastEntries, setForecastEntries] =
    useState(initialForecast);

  const params = useParams();
  const JOB_CODE = params.jobCode ?? "";

  const monthKey = useMemo(() => {
    return currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  const job = jobCodes.find(j => j.jobCode === JOB_CODE); // Find job based on dynamic JOB_CODE

  const isTimeBudget =
    job?.budgetTime !== null &&
    job?.budgetTime !== undefined;

  const employeesForMonth = useMemo(() => {
    const names = new Set(
      forecastEntries
        .filter(
          e =>
            e.jobCode === JOB_CODE &&
            e.month === monthKey
        )
        .map(e => e.employeeName)
    );

    return employees.filter(emp =>
      names.has(emp.name)
    );
  }, [forecastEntries, monthKey]);

  const totalAllocated = forecastEntries
    .filter(e => e.jobCode === JOB_CODE && e.month === monthKey)
    .reduce((sum, e) => sum + e.days, 0);

  const updateAllocation = (
    employeeName: string,
    value: number
  ) => {
    setForecastEntries(prev => {
      // Remove if 0
      if (value === 0) {
        return prev.filter(
          e =>
            !(
              e.jobCode === JOB_CODE &&
              e.employeeName === employeeName &&
              e.month === monthKey
            )
        );
      }

      const existing = prev.find(
        e =>
          e.jobCode === JOB_CODE &&
          e.employeeName === employeeName &&
          e.month === monthKey
      );

      if (existing) {
        return prev.map(e =>
          e === existing
            ? {
                ...e,
                days: value,
              }
            : e
        );
      }

      return [
        ...prev,
        {
          jobCode: JOB_CODE,
          employeeName,
          month: monthKey,
          days: value,
          cost: 0,
          description: job?.description || "",
          customer: job?.customerName || "",
        },
      ];
    });
  };

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

  if (!job) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">
        {job.description}
      </h1>

      {/* Month Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={prevMonth}
          className="px-3 py-1 bg-slate-200 rounded"
        >
          ◀
        </button>

        <div className="font-medium">
          {monthKey}
        </div>

        <button
          onClick={nextMonth}
          className="px-3 py-1 bg-slate-200 rounded"
        >
          ▶
        </button>
      </div>

      <EmployeeAllocationList
        employees={employeesForMonth}
        forecastEntries={forecastEntries}
        monthKey={monthKey}
        jobCode={JOB_CODE}
        isTimeBudget={isTimeBudget}
        updateAllocation={updateAllocation}
      />

      {/* Totals */}
      <div className="border-t pt-4 text-sm space-y-1">
        <div>
          Allocated this month:{" "}
          <strong>{totalAllocated} days</strong>
        </div>
      </div>
    </div>
  );
}