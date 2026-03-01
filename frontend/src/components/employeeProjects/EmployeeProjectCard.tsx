import { useState } from "react";

interface Props {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  daysInMonth: number;
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
}

export default function EmployeeProjectCard({
  jobCode,
  jobDescription,
  daysAllocated,
  daysInMonth,
}: Props) {
  const widthPercent = (daysAllocated / daysInMonth) * 100;
    const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="relative h-16 bg-slate-100 rounded-lg overflow-hidden">
            <div
        className="
          relative
          h-16
          rounded-xl
          bg-white
          border
          border-slate-300
          flex
          items-center
          justify-between
          px-3
          cursor-pointer
          transition-all
          duration-300
          ease-in-out
          group
          hover:min-w-[260px]
          hover:shadow-lg
          z-10
        "
        style={{ width: `${widthPercent}%` }}
      >
        <div className="flex flex-col overflow-hidden">
          <div className="font-medium text-sm truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {jobDescription}
          </div>

          <div className="text-xs text-slate-500 truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {jobCode}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium whitespace-nowrap">
            <span className="material-icons-outlined text-[14px]">
              schedule
            </span>
            {daysAllocated} days
          </span>

          <button
            onClick={() => setEditOpen(true)}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-icons-outlined">
              more_horiz
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}