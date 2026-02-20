import type { Employee } from "../data/types";

const MONTH_CAPACITY = 20;

interface Props {
  employee: Employee;
  value: number;
  isTimeBudget: boolean;
  updateAllocation: (name: string, value: number) => void;
}

export default function EmployeeAllocationRow({
  employee,
  value,
  isTimeBudget,
  updateAllocation,
}: Props) {
  const percent =
    (value / MONTH_CAPACITY) * 100;

  return (
    <div className="space-y-3 border-b pb-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">
            {employee.name}
          </div>
          <div className="text-sm text-slate-400">
            {employee.specialisms.join(", ")}
          </div>
        </div>

        <input
          type="number"
          step="0.5"
          min="0"
          value={value}
          onChange={e =>
            updateAllocation(
              employee.name,
              Number(e.target.value)
            )
          }
          className="w-20 border rounded px-2 py-1 text-sm"
        />
      </div>

      {isTimeBudget && (
        <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden relative">
          <div
            className={`h-4 rounded-full ${
              percent > 100
                ? "bg-red-500"
                : "bg-[#0062FF]"
            }`}
            style={{ width: `${percent}%` }}
          />

          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {value} days
          </div>
        </div>
      )}
    </div>
  );
}