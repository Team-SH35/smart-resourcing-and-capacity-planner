import { useMemo } from "react";
import type { Employee, ForecastEntry } from "../data/types";
import EmployeeRow from "./EmployeeRow";

interface Props {
  employees: Employee[];
  forecastEntries: ForecastEntry[];
  currentDate: Date;
  jobCode: string;
}

export default function EmployeeSchedule({
  employees,
  forecastEntries,
  currentDate,
  jobCode,
}: Props) {
  const monthKey = useMemo(() => {
    return currentDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [currentDate]);

  const daysInMonth = useMemo(() => {
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();
  }, [currentDate]);

  const employeesForMonth = useMemo(() => {
    return employees
      .map(employee => {
        const entry = forecastEntries.find(
          f =>
            f.employeeName === employee.name &&
            f.jobCode === jobCode &&
            f.month === monthKey
        );

        if (!entry) return null;

        return {
          employee,
          daysAllocated: entry.days,
        };
      })
      .filter(Boolean) as {
      employee: Employee;
      daysAllocated: number;
    }[];
  }, [employees, forecastEntries, jobCode, monthKey]);

  if (employeesForMonth.length === 0) {
    return (
      <div className="p-4 text-slate-400">
        No allocations this month
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {employeesForMonth.map(row => (
        <EmployeeRow
          key={row.employee.name}
          employee={row.employee}
          daysAllocated={row.daysAllocated}
          daysInMonth={daysInMonth}
        />
      ))}
    </div>
  );
}
