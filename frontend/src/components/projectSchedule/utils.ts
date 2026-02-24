import type { JobCode, CalendarRow } from "../data/types";

export function parseDateUTC(dateString: string) {
  return new Date(dateString + "T00:00:00Z");
}

export function startOfDay(date: Date) {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
}

export function daysBetween(a: Date, b: Date) {
  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((utcB - utcA) / 86400000);
}

export function startOfWeekMonday(date: Date) {
  const d = startOfDay(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}


function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function stableColor(jobCode: string) {
  const hash = hashString(jobCode);
  const r = Math.abs(hash) % 200;
  const g = Math.abs(hash * 7) % 200;
  const b = Math.abs(hash * 13) % 200;
  return `rgb(${r}, ${g}, ${b})`;
}

export function mapJobCodesToCalendar(
  jobCodes: JobCode[]
): CalendarRow[] {
  const rows: Record<string, CalendarRow> = {};

  jobCodes.forEach(job => {
    if (!rows[job.businessUnit]) {
      rows[job.businessUnit] = {
        rowId: job.businessUnit,
        team: job.businessUnit,
        projects: [],
      };
    }

    rows[job.businessUnit].projects.push({
      id: job.jobCode,
      title: job.description,
      client: job.customerName,
      team: job.businessUnit,
      startDate: job.startDate,
      endDate: job.finishDate ?? "2099-12-31",
      color: stableColor(job.jobCode),
    });
  });

  return Object.values(rows);
}


