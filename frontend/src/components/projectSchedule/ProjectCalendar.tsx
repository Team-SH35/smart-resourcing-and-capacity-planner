import { useMemo, useState, useEffect } from "react";
import CalendarHeader from "./CalendarHeader";
import CalendarRows from "./CalendarRows";
import {
  mapJobCodesToCalendar,
  startOfDay,
  startOfWeekMonday,
  parseDateUTC,
} from "./utils";
import { getJobs } from "../../api/client";
import type { JobCode } from "../data/types";

type CalendarView = "week" | "fortnight" | "month";

interface Props {
  view: CalendarView;
  activeOnly: boolean;
  teamFilter: string[];
  clientFilter: string;
}

export default function ProjectCalendar({
  view,
  activeOnly,
  teamFilter,
  clientFilter
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<JobCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await getJobs();
        setJobs(data);
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        setLoading(false);
      }
    }

    loadJobs();
  }, []);

  const calendarStart =
    view === "month"
      ? startOfDay(
          new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1))
        )
      : startOfWeekMonday(currentDate);

  const daysVisible =
    view === "week"
      ? 7
      : view === "fortnight"
      ? 14
      : new Date(
          Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        ).getUTCDate();

  const days = Array.from({ length: daysVisible }, (_, i) => {
    const d = new Date(calendarStart);
    d.setUTCDate(calendarStart.getUTCDate() + i);
    return d;
  });

  function goPrev() {
    setCurrentDate((d) => {
      const next = new Date(d);

      if (view === "week") next.setUTCDate(d.getUTCDate() - 7);
      else if (view === "fortnight") next.setUTCDate(d.getUTCDate() - 14);
      else next.setUTCMonth(d.getUTCMonth() - 1);

      return next;
    });
  }

  function goNext() {
    setCurrentDate((d) => {
      const next = new Date(d);

      if (view === "week") next.setUTCDate(d.getUTCDate() + 7);
      else if (view === "fortnight") next.setUTCDate(d.getUTCDate() + 14);
      else next.setUTCMonth(d.getUTCMonth() + 1);

      return next;
    });
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  const rows = useMemo(() => {
    let mapped = mapJobCodesToCalendar(jobs);

    const today = startOfDay(new Date());

    if (teamFilter.length) {
      mapped = mapped.filter((r) => teamFilter.includes(r.team));
    }


    mapped = mapped.map((r) => ({
      ...r,
      projects: r.projects.filter((p) => {
        if (!p.title || p.title.trim() === "") {
          return false;
        }

        if (
          clientFilter &&
          !p.client?.toLowerCase().includes(clientFilter.toLowerCase())
        ) {
          return false;
        }

        if (activeOnly) {
          const start = startOfDay(parseDateUTC(p.startDate));
          const end = startOfDay(parseDateUTC(p.endDate));

          if (start > today || end < today) return false;
        }

        return true;
      }),
    }));

    return mapped;
  }, [jobs, activeOnly, teamFilter, clientFilter]);

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Calendar nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="font-semibold">
          {calendarStart.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="text-slate-400 border rounded px-3 py-1"
          >
            Today
          </button>
          <button onClick={goPrev} className="border rounded px-3 py-1">
            ←
          </button>
          <button onClick={goNext} className="border rounded px-3 py-1">
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-slate-400">Loading calendar...</div>
      ) : rows.length === 0 ? (
        <div className="p-4 text-sm text-slate-400">
          No projects available
        </div>
      ) : (
        <>
          <CalendarHeader days={days} />
          <CalendarRows
            rows={rows}
            calendarStart={calendarStart}
            daysVisible={daysVisible}
          />
        </>
      )}
    </div>
  );
}