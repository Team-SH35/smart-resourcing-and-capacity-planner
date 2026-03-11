
import type { CalendarProject } from "../data/types";
import { daysBetween, startOfDay, parseDateUTC } from "./utils";
import { useNavigate } from "react-router-dom";

export default function ProjectBlock({
  project,
  calendarStart,
  daysVisible,
}: {
  project: CalendarProject;
  calendarStart: Date;
  daysVisible: number;
}) {
  const navigate = useNavigate();
  const projectStart = startOfDay(parseDateUTC(project.startDate));
  const projectEnd = startOfDay(parseDateUTC(project.endDate));

  const calendarEnd = new Date(calendarStart);
  calendarEnd.setUTCDate(calendarEnd.getUTCDate() + daysVisible - 1);

  if (projectEnd < calendarStart || projectStart > calendarEnd) {
    return null;
  }

  const visibleStart =
    projectStart < calendarStart ? calendarStart : projectStart;
  const visibleEnd =
    projectEnd > calendarEnd ? calendarEnd : projectEnd;

  const offset = daysBetween(calendarStart, visibleStart);
  const duration = daysBetween(visibleStart, visibleEnd) + 1;

  return (
    <div
      className="absolute top-2 h-16 rounded-xl bg-slate-100 border-l-4 px-3 flex items-center cursor-pointer hover:shadow-md transition-shadow"
      style={{
        left: `calc(${offset} * (100% / ${daysVisible}))`,
        width: `calc(${duration} * (100% / ${daysVisible}))`,
        borderColor: project.color,
      }}
      onClick={() => navigate(`/project/${project.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="text-sm truncate">
        <div className="font-medium truncate">{project.title}</div>
        <div className="text-slate-400 truncate">
          {project.team} · {project.client}
        </div>
      </div>
    </div>
  );
}





