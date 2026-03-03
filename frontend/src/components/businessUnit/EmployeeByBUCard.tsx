import { useMemo } from "react";
import { forecastEntries } from "../data/forecastEntries";
import { getEmployeesByBusinessUnit } from "./getEmployeeByBusinessUnit";

interface Props {
  businessUnit: string;
}

function getWorkingDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const current = new Date(year, month, day);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
  }
  return workingDays;
}

export default function EmployeeByBUCard({ businessUnit }: Props) {
  const today = new Date();
  const monthKey = today.toLocaleString("default", { month: "long", year: "numeric" });
  const workingDays = getWorkingDaysInMonth(today);

  // dynamically get employees from forecastEntries/jobCodes
  const unitEmployees = getEmployeesByBusinessUnit(businessUnit);

  const employeesWithAllocation = useMemo(() => {
    return unitEmployees.map((employee) => {
      const totalAllocated = forecastEntries
        .filter((entry) => entry.employeeName === employee.name && entry.month === monthKey)
        .reduce((sum, entry) => sum + entry.days, 0);

      const allocation = workingDays > 0 ? Math.round((totalAllocated / workingDays) * 100) : 0;
      return { ...employee, allocation };
    });
  }, [unitEmployees, monthKey, workingDays]);

  const getAllocationColor = (value: number) => {
    if (value < 80) return "text-orange-500";
    if (value <= 100) return "text-green-500";
    return "text-red-500";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {employeesWithAllocation.length === 0 && (
        <div className="p-12 text-center text-slate-400">No employees in this business unit.</div>
      )}

      {employeesWithAllocation.map((employee, index) => (
        <div key={employee.name}>
          <div className="flex items-center justify-between px-8 py-6 hover:bg-slate-50 transition">
            {/* Left */}
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold">
                {employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>

              <div className="flex gap-16">
                <div className="font-medium text-slate-800">{employee.name}</div>
                <div className="text-slate-500">{employee.specialisms?.[0]}</div>
              </div>
            </div>

            {/* Allocation */}
            <div className={`font-semibold text-lg ${getAllocationColor(employee.allocation)}`}>
              {employee.allocation}%
            </div>
          </div>

          {index !== employeesWithAllocation.length - 1 && <div className="border-t border-slate-200 mx-8" />}
        </div>
      ))}
    </div>
  );
}