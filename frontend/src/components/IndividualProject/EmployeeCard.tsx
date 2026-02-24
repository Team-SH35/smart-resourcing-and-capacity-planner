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
  const widthPercent = (daysAllocated / daysInMonth) * 100;

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
      className="relative h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-between cursor-pointer transition-all duration-300 ease-in-out group hover:min-w-[250px] hover:shadow-lg z-10"
      style={{ width: `${widthPercent}%` }}
    >
      {/*colored border */}
      <div
        className={`absolute top-0 left-0 h-full w-1 ${leftBorderColor} rounded-l-xl`}
      />

      {/*Name + Specialism */}
      <div className="flex flex-col overflow-hidden px-2">
        <div className="font-medium text-sm truncate group-hover:overflow-visible group-hover:whitespace-normal">
          {employee.name}
        </div>
        <div className="text-xs opacity-90 truncate group-hover:overflow-visible group-hover:whitespace-normal">
          {employee.specialisms[0]}
        </div>
      </div>

      {/* Days allocated + More button */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap">
          <span className="material-icons-outlined text-[14px]">schedule</span>
          {daysAllocated} days
        </span>

        <button className="text-slate-400 hover:text-slate-600">
          <span className="material-icons-outlined">more_horiz</span>
        </button>
      </div>
    </div>
  );
}