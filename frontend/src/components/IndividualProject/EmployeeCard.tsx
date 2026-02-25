import type { Employee } from "../data/types";
import { useState } from "react";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

export default function EmployeeCard({
  employee,
  daysAllocated,
  daysInMonth,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const widthPercent = (daysAllocated / daysInMonth) * 100;
  const [editOpen, setEditOpen] = useState(false);
  const [editedDays, setEditedDays] = useState(daysAllocated);

  const leftBorderColor =
    employee.specialisms[0] === "Frontend Developer"
      ? "bg-pink-500"
      : employee.specialisms[0] === "Analytics Integrator"
      ? "bg-green-500"
      : employee.specialisms[0] === "Backend Developer"
      ? "bg-red-500"
      : "bg-slate-500";

  return (
    <>
      {/* CARD */}
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
        {/* Coloured left border */}
        <div
          className={`absolute top-0 left-0 h-full w-1 ${leftBorderColor} rounded-l-xl`}
        />

        {/* Name + Specialism */}
        <div className="flex flex-col overflow-hidden ml-2">
          <div className="font-medium text-sm truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {employee.name}
          </div>
          <div className="text-xs text-slate-500 truncate group-hover:whitespace-normal group-hover:overflow-visible">
            {employee.specialisms[0]}
          </div>
        </div>

        {/* Days + More */}
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

      {/* MODAL OVERLAY */}
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
              <p className="text-sm text-slate-400">Employee</p>
              <p className="font-medium">{employee.name}</p>
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
                  onDeleteAllocation(employee.name);
                  setEditOpen(false);
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
                    onUpdateAllocation(employee.name, editedDays);
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
    </>
  );
}