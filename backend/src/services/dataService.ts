import { db } from "../db/db";
import type {
    Employee,
    JobCode,
    ForecastEntry,
    CalendarRow,
    CalendarProject,
} from "../types";

type EmployeeRow = {
    name: string;
    excludeFromAI: number | boolean | null;
    specialism: string | null;
};

type JobRow = {
  jobCode: string;
  description: string | null;
  businessUnit: string | null;
  budgetTime: number | null;
  budgetCostCurrency: string | null;
  budgetCost: number | null;
  startDate: string | null;
  finishDate: string | null;
};

type ForecastRow = {
  employeeName: string | null;
  jobCode: string;
  description: string | null;
  businessUnit: string | null;
  cost: number | null;
  days: number | null;
  month?: string | null;
};

type ForecastWriteInput = {
  employeeName: string;
  jobCode: string;
  days?: number;
  month?: string; // accepted for future compatibility, ignored for now
};

type EmployeeLookupRow = {
  employeeId: number;
  workspaceId: number;
};

type JobLookupRow = {
  jobCode: string;
  workspaceId: number;
};

type ForecastExistingRow = {
  employeeId: number;
  jobCode: string;
};

function safeString(value: string | null | undefined, fallback = ""): string {
    return value ?? fallback;
}

function businessUnitToRowId(businessUnit: string): string {
    return `team-${businessUnit.toLowerCase().replace(/\s+/g, "-")}`;
}

function businessUnitToColor(businessUnit: string): string {
    const key = businessUnit.toLowerCase();

    if (key.includes("analytic")) return "#8B5CF6";
    if (key.includes("develop")) return "#F59E0B";
    if (key.includes("frontend")) return "#3B82F6";
    if (key.includes("backend")) return "#10B981";

    return "#6B7280";
}

function formatMonth(month: string | null | undefined): string {
    if (!month) return "Unscheduled";

    const date = new Date(month);
    if (Number.isNaN(date.getTime())) return month;

    return date.toLocaleString("en-GB", {
        month: "long",
        year: "numeric",
    });
}

function hasColumn(tableName: string, columnName: string): boolean {
    const columns = db
        .prepare(`PRAGMA table_info(${tableName})`)
        .all() as Array<{ name: string }>;

    return columns.some((column) => column.name === columnName);
}

export function getEmployees(): Employee[] {
    const hasSpecialismColumn = hasColumn("Employee", "Specialism");
    const hasExcludeFromAIUnderscore = hasColumn("Employee", "Exclude_from_AI");
    const hasExcludeFromAIFlat = hasColumn("Employee", "ExcludeFromAI");

    let rows: EmployeeRow[] = [];

    if (hasSpecialismColumn) {
        rows = db
            .prepare(`
                SELECT
                    e.Name AS name,
                    ${
                        hasExcludeFromAIUnderscore
                            ? "e.Exclude_from_AI"
                            : hasExcludeFromAIFlat
                            ? "e.ExcludeFromAI"
                            : "0"
                    } AS excludeFromAI,
                    s.Specialism AS specialism
                FROM Employee e
                LEFT JOIN EmployeeSpecialisms s ON s.Id = e.Specialism
                ORDER BY e.Name ASC
            `)
            .all() as EmployeeRow[];
    } else {
        rows = db
            .prepare(`
                SELECT
                    e.Name AS name,
                    ${
                        hasExcludeFromAIUnderscore
                            ? "e.Exclude_from_AI"
                            : hasExcludeFromAIFlat
                            ? "e.ExcludeFromAI"
                            : "0"
                    } AS excludeFromAI,
                    NULL AS specialism
                FROM Employee e
                ORDER BY e.Name ASC
            `)
            .all() as EmployeeRow[];
    }

    return rows.map((row) => ({
        name: safeString(row.name),
        specialisms: row.specialism ? [row.specialism] : [],
        excludedFromAI: Boolean(row.excludeFromAI),
    }));
}

export function getJobCodes(): JobCode[] {
    const rows = db
        .prepare(`
            SELECT
                JobCode AS jobCode,
                Description AS description,
                BusinessUnit AS businessUnit,
                TimeBudget AS budgetTime,
                CurrencySymbol AS budgetCostCurrency,
                MonetaryBudget AS budgetCost,
                StartDate AS startDate,
                FinishDate AS finishDate
            FROM Job
            ORDER BY COALESCE(StartDate, '9999-12-31') ASC, JobCode ASC
        `)
        .all() as JobRow[];
    
    return rows.map((row) => ({
        jobCode: row.jobCode,
        description: safeString(row.description),
        customerName: "Unknown",
        businessUnit: safeString(row.businessUnit, "Unknown"),
        budgetTime: row.budgetTime,
        budgetCost: row.budgetCost,
        budgetCostCurrency: row.budgetCostCurrency,
        startDate: row.startDate ?? "",
        finishDate: row.finishDate ?? null,
    }));
}

export function getForecastEntries(): ForecastEntry[] {
  const monthExists = hasColumn("ForecastEntry", "Month");

  const rows = db
    .prepare(`
      SELECT
        e.Name AS employeeName,
        f.JobCode AS jobCode,
        j.Description AS description,
        j.BusinessUnit AS businessUnit,
        f.Cost AS cost,
        f.Days AS days
        ${monthExists ? ", f.Month AS month" : ", NULL AS month"}
      FROM ForecastEntry f
      LEFT JOIN Employee e ON e.EmployeeID = f.EmployeeID
      LEFT JOIN Job j ON j.JobCode = f.JobCode
      ORDER BY e.Name ASC, f.JobCode ASC
    `)
    .all() as ForecastRow[];

  return rows.map((row) => ({
    employeeName: safeString(row.employeeName),
    customer: "Unknown",
    jobCode: row.jobCode,
    description: safeString(row.description),
    days: row.days ?? 0,
    cost: row.cost ?? null,
    month: formatMonth(row.month),
  }));
}

export function getCalendarRows(): CalendarRow[] {
    const jobs = getJobCodes();

    const rowsByTeam = new Map<string, CalendarRow>();

    for (const job of jobs) {
        const team = job.businessUnit || "Unknown";
        const rowId = businessUnitToRowId(team);

        if (!rowsByTeam.has(rowId)) {
            rowsByTeam.set(rowId, {
                rowId,
                team,
                projects: [],
            });
        }

        const row = rowsByTeam.get(rowId)!;

        const project: CalendarProject = {
            id: job.jobCode,
            title: job.description || job.jobCode,
            client: job.customerName,
            team,
            startDate: job.startDate,
            endDate: job.finishDate ?? job.startDate,
            color: businessUnitToColor(team),
        };

        row.projects.push(project);
    }

    return Array.from(rowsByTeam.values());
}

function getEmployeeByName(employeeName: string): EmployeeLookupRow | undefined {
  return db
    .prepare(`
      SELECT
        EmployeeID AS employeeId,
        WorkspaceID AS workspaceId
      FROM Employee
      WHERE Name = ?
    `)
    .get(employeeName) as EmployeeLookupRow | undefined;
}

function getJobByCode(jobCode: string): JobLookupRow | undefined {
  return db
    .prepare(`
      SELECT
        JobCode AS jobCode,
        WorkspaceID AS workspaceId
      FROM Job
      WHERE JobCode = ?
    `)
    .get(jobCode) as JobLookupRow | undefined;
}

function getExistingForecastEntry(employeeId: number, jobCode: string): ForecastExistingRow | undefined {
  return db
    .prepare(`
      SELECT
        EmployeeID AS employeeId,
        JobCode AS jobCode
      FROM ForecastEntry
      WHERE EmployeeID = ? AND JobCode = ?
    `)
    .get(employeeId, jobCode) as ForecastExistingRow | undefined;
}

export function createForecastEntry(input: ForecastWriteInput) {
  const { employeeName, jobCode, days = 0 } = input;

  const employee = getEmployeeByName(employeeName);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeName}`);
  }

  const job = getJobByCode(jobCode);
  if (!job) {
    throw new Error(`Job not found: ${jobCode}`);
  }

  const existing = getExistingForecastEntry(employee.employeeId, job.jobCode);
  if (existing) {
    throw new Error(
      `Forecast entry already exists for employee "${employeeName}" and job "${jobCode}"`
    );
  }

  // Temporary: month is ignored until schema supports it.
  // Workspace choice: prefer the employee workspace for now.
  db.prepare(`
    INSERT INTO ForecastEntry (
      EmployeeID,
      JobCode,
      Cost,
      Days,
      WorkspaceID
    )
    VALUES (?, ?, ?, ?, ?)
  `).run(
    employee.employeeId,
    job.jobCode,
    null,
    days,
    employee.workspaceId
  );

  return {
    message: "Forecast entry created",
    employeeName,
    jobCode,
    days,
    month: input.month ?? null,
    monthIgnored: true,
  };
}

export function updateForecastEntryDays(input: ForecastWriteInput) {
  const { employeeName, jobCode, days = 0 } = input;

  const employee = getEmployeeByName(employeeName);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeName}`);
  }

  const job = getJobByCode(jobCode);
  if (!job) {
    throw new Error(`Job not found: ${jobCode}`);
  }

  const existing = getExistingForecastEntry(employee.employeeId, job.jobCode);
  if (!existing) {
    throw new Error(
      `Forecast entry not found for employee "${employeeName}" and job "${jobCode}"`
    );
  }

  db.prepare(`
    UPDATE ForecastEntry
    SET Days = ?
    WHERE EmployeeID = ? AND JobCode = ?
  `).run(days, employee.employeeId, job.jobCode);

  return {
    message: "Forecast entry updated",
    employeeName,
    jobCode,
    days,
    month: input.month ?? null,
    monthIgnored: true,
  };
}

export function deleteForecastEntry(input: ForecastWriteInput) {
  const { employeeName, jobCode } = input;

  const employee = getEmployeeByName(employeeName);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeName}`);
  }

  const job = getJobByCode(jobCode);
  if (!job) {
    throw new Error(`Job not found: ${jobCode}`);
  }

  const existing = getExistingForecastEntry(employee.employeeId, job.jobCode);
  if (!existing) {
    throw new Error(
      `Forecast entry not found for employee "${employeeName}" and job "${jobCode}"`
    );
  }

  db.prepare(`
    DELETE FROM ForecastEntry
    WHERE EmployeeID = ? AND JobCode = ?
  `).run(employee.employeeId, job.jobCode);

  return {
    message: "Forecast entry deleted",
    employeeName,
    jobCode,
    month: input.month ?? null,
    monthIgnored: true,
  };
}