import { useEffect, useState } from "react";

interface Props {
  jobCode: string;
  jobDescription: string;
  daysAllocated: number;
  daysInMonth: number;
  maxAllocatedDays: number; // NEW: the largest allocation among all cards
  onUpdateAllocation: (jobCode: string, newDays: number) => void;
  onDeleteAllocation: (jobCode: string) => void;
}

export default function EmployeeProjectCard({
  jobCode,
  jobDescription,
  daysAllocated,
  daysInMonth,
  maxAllocatedDays,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [editedDays, setEditedDays] = useState(daysAllocated);

  useEffect(() => {
    setEditedDays(daysAllocated);
  }, [daysAllocated]);

  // Calculate width relative to largest allocation
  const widthPercent = maxAllocatedDays > 0
    ? Math.max((daysAllocated / maxAllocatedDays) * 100, 20) // min 20% width
    : 100; // if nothing allocated yet

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
          min-w-[260px]    /* ensures min width */
          hover:shadow-lg
          z-10
        "
        style={{ width: `${widthPercent}%` }}
      >
        {/* Job info */}
        <div className="flex flex-col overflow-hidden min-w-0">
          <div className="font-medium text-sm truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {jobDescription}
          </div>
          <div className="text-xs text-slate-500 truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {jobCode}
          </div>
        </div>

        {/* Right-side badge + edit */}
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

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-6">
              Edit Allocation
            </h2>

            <div className="mb-4">
              <p className="text-sm text-slate-400">Project</p>
              <p className="font-medium">{jobDescription}</p>
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-400 block mb-1">
                Days Allocated
              </label>
              <input
                type="number"
                min={0}
                max={daysInMonth}
                value={editedDays}
                onChange={(e) =>
                  setEditedDays(Number(e.target.value))
                }
                className="w-full border rounded px-3 py-2"
              />
              <label className="text-xs text-slate-300 block mb-1">
                Maximum {daysInMonth} days
              </label>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  const confirmed = window.confirm(
                    `Are you sure you want to delete ${jobDescription}'s allocation for this month?`
                  );
                  if (confirmed) {
                    onDeleteAllocation(jobCode);
                    setEditOpen(false);
                  }
                }}
                className="text-red-600 text-sm hover:underline"
              >
                Delete Allocation
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="border rounded px-3 py-1 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUpdateAllocation(jobCode, editedDays);
                    setEditOpen(false);
                  }}
                  className="bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}