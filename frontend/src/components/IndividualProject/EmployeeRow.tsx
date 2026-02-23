import type { Employee } from "../data/types";
import EmployeeCard from "./EmployeeCard";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
}

export default function EmployeeRow({
  employee,
  daysAllocated,
  daysInMonth,
}: Props) {
  return (
    <div className="relative h-20">
      <EmployeeCard
        employee={employee}
        daysAllocated={daysAllocated}
        daysInMonth={daysInMonth}
      />
    </div>
  );
}