import type { Employee } from "../data/types";
import EmployeeCard from "./EmployeeCard";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

export default function EmployeeRow({
  employee,
  daysAllocated,
  daysInMonth,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  return (
    <div className="relative h-20">
      <EmployeeCard
        employee={employee}
        daysAllocated={daysAllocated}
        daysInMonth={daysInMonth}
        onUpdateAllocation={onUpdateAllocation}
        onDeleteAllocation={onDeleteAllocation}
      />
    </div>
  );
}