import { startOfDay } from "./utils";

export default function CalendarHeader({ days }: { days: Date[] }) {
  const today = startOfDay(new Date());

  return (
    <div
      className="border-b bg-white sticky top-0 z-10"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${days.length}, 1fr)`,
      }}
    >
      {days.map(d => {
        const isToday = d.getTime() === today.getTime();

        return (
          <div
            key={d.toISOString()}
            className="text-center py-2 text-xs"
          >
            <div className="text-slate-400">
              {d.toLocaleDateString("en-GB", {
                weekday: "short",
                timeZone: "UTC",
              })}
            </div>
            <div
              className={`inline-block px-2 rounded-full font-semibold ${
                isToday ? "bg-[#0062FF] text-white" : "text-slate-700"
              }`}
            >
              {d.getUTCDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
