import type { Employee } from "../data/types";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
}

export default function EmployeeCard({
  employee,
  daysAllocated,
  daysInMonth,
}: Props) {
  const widthPercent =
    (daysAllocated / daysInMonth) * 100;
  const leftBorderColor =
    employee.specialisms[0] === "Frontend Developer"
      ? "bg-pink-500"
      : employee.specialisms[0] === "Analytics Integrator"
      ? "bg-green-500"
      : employee.specialisms[0] === "Backend Developer"
      ? "bg-red-500"
      : "bg-slate-500";

  return (
    <div
      key={employee.name}
      className={`relative h-16 rounded-xl bg-white border border-slate-300 px-3 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow`}
          style={{ width: `${widthPercent}%` }}
    >
      {/* Left colored border */}
      <div
        className={`absolute top-0 left-0 h-full w-1 ${leftBorderColor} rounded-l-xl`}
      ></div>

      {/* Name + Specialism */}
      <div className="flex flex-col ml-2">
        <div className="font-medium text-sm">{employee.name}</div>
        <div className="text-xs opacity-90">{employee.specialisms[0]}</div>
      </div>

      {/* Days allocated */}
      <div className="text-xs">{daysAllocated} days</div>
    </div>
  );
}
