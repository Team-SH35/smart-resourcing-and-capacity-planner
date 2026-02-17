import type { CalendarRow } from "../data/types";
import ProjectBlock from "./ProjectBlock";
import { startOfDay, parseDateUTC } from "./utils";

const MIN_ROWS = 5;

export default function CalendarRows({
  rows,
  calendarStart,
  daysVisible,
}: {
  rows: CalendarRow[];
  calendarStart: Date;
  daysVisible: number;
}) {
  const allProjects = rows.flatMap(row => row.projects);

  const calendarEnd = new Date(calendarStart);
  calendarEnd.setUTCDate(calendarEnd.getUTCDate() + daysVisible - 1);

  const visibleProjects = allProjects.filter(project => {
    const start = startOfDay(parseDateUTC(project.startDate));
    const end = startOfDay(parseDateUTC(project.endDate));
    return !(end < calendarStart || start > calendarEnd);
  });

  const projectRows: CalendarRow[] = visibleProjects.map(project => ({
    rowId: project.id,
    team: project.team,
    projects: [project],
  }));

  const paddedRows =
    projectRows.length >= MIN_ROWS
      ? projectRows
      : [
          ...projectRows,
          ...Array.from(
            { length: MIN_ROWS - projectRows.length },
            (_, i) => ({
              rowId: `empty-${i}`,
              team: "",
              projects: [],
            })
          ),
        ];

  return (
    <div className="relative w-full">
      {paddedRows.map(row => (
        <div
          key={row.rowId}
          className="relative h-20 border-b last:border-b-0"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${daysVisible}, 1fr)`,
          }}
        >
          {row.projects.map(project => (
            <ProjectBlock
              key={project.id}
              project={project}
              calendarStart={calendarStart}
              daysVisible={daysVisible}
            />
          ))}
        </div>
      ))}
    </div>
  );
}




