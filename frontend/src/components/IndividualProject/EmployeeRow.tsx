import type { Employee } from "../data/types";
import EmployeeCard from "./EmployeeCard";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
  maxDays: number;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

export default function EmployeeRow({
  employee,
  daysAllocated,
  daysInMonth,
  maxDays,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  return (
    <div className="relative h-20">
      <EmployeeCard
        employee={employee}
        daysAllocated={daysAllocated}
        daysInMonth={daysInMonth}
        maxDays={maxDays}
        onUpdateAllocation={onUpdateAllocation}
        onDeleteAllocation={onDeleteAllocation}
      />
    </div>
  );
}