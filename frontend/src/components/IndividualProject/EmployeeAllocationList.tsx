import type{ Employee } from "../data/types";
import EmployeeAllocationRow from "./EmployeeAllocationRow";

interface Props {
  employees: Employee[];
  forecastEntries: any[];
  monthKey: string;
  jobCode: string;
  isTimeBudget: boolean;
  updateAllocation: (name: string, value: number) => void;
}

export default function EmployeeAllocationList({
  employees,
  forecastEntries,
  monthKey,
  jobCode,
  isTimeBudget,
  updateAllocation,
}: Props) {
  if (employees.length === 0) {
    return (
      <div className="text-slate-400">
        No allocations this month
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {employees.map(employee => {
        const entry = forecastEntries.find(
          e =>
            e.employeeName === employee.name &&
            e.jobCode === jobCode &&
            e.month === monthKey
        );

        const value = entry?.days || 0;

        return (
          <EmployeeAllocationRow
            key={employee.name}
            employee={employee}
            value={value}
            isTimeBudget={isTimeBudget}
            updateAllocation={updateAllocation}
          />
        );
      })}
    </div>
  );
}