import { addMonths, formatMonthLabel } from "./utils";

interface Props {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
}

export default function MonthNavigator({
  currentMonth,
  setCurrentMonth,
}: Props) {
  return (
    <div className="flex justify-between items-center">
      <button
        onClick={() =>
          setCurrentMonth(addMonths(currentMonth, -1))
        }
        className="px-3 py-1 border rounded"
      >
        ←
      </button>

      <h1 className="text-xl font-semibold">
        {formatMonthLabel(currentMonth)}
      </h1>

      <button
        onClick={() =>
          setCurrentMonth(addMonths(currentMonth, 1))
        }
        className="px-3 py-1 border rounded"
      >
        →
      </button>
    </div>
  );
}
