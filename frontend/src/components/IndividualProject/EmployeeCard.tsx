import type { Employee } from "../data/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  employee: Employee;
  daysAllocated: number;
  daysInMonth: number;
  maxDays: number;
  onUpdateAllocation: (employeeName: string, newDays: number) => void;
  onDeleteAllocation: (employeeName: string) => void;
}

export default function EmployeeCard({
  employee,
  daysAllocated,
  daysInMonth,
  maxDays,
  onUpdateAllocation,
  onDeleteAllocation,
}: Props) {
  const navigate = useNavigate();

  const min_width = 20;
  const widthPercent =
    maxDays > 0
      ? min_width + (daysAllocated / maxDays) * (100 - min_width)
      : 100;

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
      <div
        onClick={() =>
          navigate(`/Employee/${encodeURIComponent(employee.name)}`)
        }
        className="relative h-16 rounded-xl bg-white border border-slate-300 flex items-center justify-between px-3 cursor-pointer transition-all duration-300 ease-in-out group hover:min-w-[260px] hover:shadow-lg z-10"
        style={{ width: `${widthPercent}%` }}
      >
        <div
          className={`absolute top-0 left-0 h-full w-1 ${leftBorderColor} rounded-l-xl`}
        />

        <div className="flex flex-col overflow-hidden ml-2">
          <div className="font-medium text-sm">
            {employee.name}
          </div>
          <div className="text-xs text-slate-500">
            {employee.specialisms.join(", ")}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span className="px-2 py-1 bg-gray-200 text-xs rounded-full">
            {daysAllocated} days
          </span>

          {/* prevent navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditOpen(true);
            }}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-icons-outlined">
              more_horiz
            </span>
          </button>
        </div>
      </div>

      {/* MODAL */}
      {editOpen && (
        <div
          className="fixed p-6 inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white p-6 rounded-xl w-[200px]  p-6 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-lg">Edit Allocation</h2>
            <div className="flex items-center gap-2">
              Days: 
              <input
                type="number"
                min={0}
                max={daysInMonth}
                value={editedDays}
                onChange={(e) => setEditedDays(Number(e.target.value)) }
                className="border p-2 w-full"
              />
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => {
                  onDeleteAllocation(employee.name);
                  setEditOpen(false);
                }}
                className="border border-2 border-red-600 rounded text-red-600 px-3 py-1"
              >
                Delete
              </button>

              <button
                onClick={() => {
                  onUpdateAllocation(employee.name, editedDays);
                  setEditOpen(false);
                }}
                className="bg-emerald-500 text-white rounded px-3 py-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}