import db  from "../db/db";
import type {
  Employee,
  JobCode,
  ForecastEntry,
  CalendarRow,
  CalendarProject,
} from "../types";

type EmployeeRow = {
  name: string;
  specialism: string,
  excludeFromAI: number | boolean | null;
};

type CostUpdate = {
    cost : number,
    jobCode : string,
    workspaceID: string
}

type BudgetUpdate = {
    newBudget: number,
    jobCode : string,
    workspaceID : string
}

type TimeUpdate = {
    timeBudget: number,
    jobCode   : string,
    workspaceID :string
}

type CurrencySymbolUpdate = {
    currencySymbol : string,
    jobCode        : string
    workspaceID    : string
}

type JobRow = {
  jobCode: string;
  description: string | null;
  customerName: string | null;
  businessUnit: string | null;
  budgetTime: number | null;
  budgetCostCurrency: string | null;
  budgetCost: number | null;
  startDate: string | null;
  finishDate: string | null;
};

type ForecastDbRow = {
  employeeName: string | null;
  jobCode: string;
  description: string | null;
  customer: string | null;
  cost: number | null;
  jan: number | null;
  feb: number | null;
  mar: number | null;
  apr: number | null;
  may: number | null;
  jun: number | null;
  jul: number | null;
  aug: number | null;
  sep: number | null;
  oct: number | null;
  nov: number | null;
  dec: number | null;
};

type ForecastWriteInput = {
  employeeName: string;
  jobCode: string;
  days?: number;
  month?: string;
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

type ForecastMonthValueRow = {
  value: number | null;
};

function safeString(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

function tableExists(tableName: string): boolean {
  const row = db
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
    `
    )
    .get(tableName) as { name: string } | undefined;

  return Boolean(row);
}

function tableHasColumn(tableName: string, columnName: string): boolean {
  if (!tableExists(tableName)) return false;

  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  return columns.some((column) => column.name === columnName);
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

function normalizeMonthKey(month?: string): string | null {
  if (!month) return null;

  const value = month.trim().toLowerCase();

  const monthMap: Record<string, string> = {
    jan: "jan",
    january: "jan",
    feb: "feb",
    february: "feb",
    mar: "mar",
    march: "mar",
    apr: "apr",
    april: "apr",
    may: "may",
    jun: "jun",
    june: "jun",
    jul: "jul",
    july: "jul",
    aug: "aug",
    august: "aug",
    sep: "sep",
    sept: "sep",
    september: "sep",
    oct: "oct",
    october: "oct",
    nov: "nov",
    november: "nov",
    dec: "dec",
    december: "dec",
  };

  return monthMap[value] ?? null;
}

function monthColumnFromInput(month?: string): string | null {
  const key = normalizeMonthKey(month);
  return key ? `Days_allocated_${key}` : null;
}

function monthDisplayNameFromKey(key: string): string {
  const displayMap: Record<string, string> = {
    jan: "January",
    feb: "February",
    mar: "March",
    apr: "April",
    may: "May",
    jun: "June",
    jul: "July",
    aug: "August",
    sep: "September",
    oct: "October",
    nov: "November",
    dec: "December",
  };

  return displayMap[key] ?? key;
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

function getExistingForecastEntry(
  employeeId: number,
  jobCode: string
): ForecastExistingRow | undefined {
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

function getExistingForecastMonthValue(
  employeeId: number,
  jobCode: string,
  monthColumn: string
): number | null {
  const row = db
    .prepare(`
      SELECT ${monthColumn} AS value
      FROM ForecastEntry
      WHERE EmployeeID = ? AND JobCode = ?
    `)
    .get(employeeId, jobCode) as ForecastMonthValueRow | undefined;

  return row?.value ?? null;
}

export function getEmployees(): Employee[] {
  if (!tableExists("Employee")) return [];

  const excludeExpr = tableHasColumn("Employee", "ExcludeFromAI")
    ? "ExcludeFromAI"
    : tableHasColumn("Employee", "Exclude_from_AI")
    ? "Exclude_from_AI"
    : "0";

  // Fetch all employee-specialism pairs
  const rows = db
    .prepare(`
      SELECT
        Name AS name,
        Specialism AS specialism,
        ${excludeExpr} AS excludeFromAI
      FROM Employee
      LEFT JOIN EmployeeSpecialisms ON Employee.EmployeeID = EmployeeSpecialisms.EmployeeID
      ORDER BY Name ASC
    `)
    .all() as EmployeeRow[];

  // Group by employee
  const employeesMap = new Map<string, Employee>();

  for (const row of rows) {
    const key = row.name;
    if (!employeesMap.has(key)) {
      employeesMap.set(key, {
        name: safeString(row.name),
        specialisms: [],
        excludedFromAI: Boolean(row.excludeFromAI),
      });
    }
    if (row.specialism != null) {
      employeesMap.get(key)!.specialisms.push(row.specialism);
    }
  }

  // Convert map to array
  return Array.from(employeesMap.values());
}

export function getJobCodes(): JobCode[] {
  if (!tableExists("Job")) return [];

  const hasCustomer = tableHasColumn("Job", "customer");
  const hasCustomerCapitalized = tableHasColumn("Job", "Customer");

  const customerExpr = hasCustomer
    ? "customer"
    : hasCustomerCapitalized
    ? "Customer"
    : "'Unknown'";

  const rows = db
    .prepare(`
      SELECT
        JobCode AS jobCode,
        Description AS description,
        ${customerExpr} AS customerName,
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
    customerName: safeString(row.customerName, "Unknown"),
    businessUnit: safeString(row.businessUnit, "Unknown"),
    budgetTime: row.budgetTime,
    budgetCost: row.budgetCost,
    budgetCostCurrency: row.budgetCostCurrency,
    startDate: row.startDate ?? "",
    finishDate: row.finishDate ?? null,
  }));
}

export function getForecastEntries(): ForecastEntry[] {
  if (!tableExists("ForecastEntry") || !tableExists("Employee") || !tableExists("Job")) {
    return [];
  }

  const hasCustomer = tableHasColumn("Job", "customer");
  const hasCustomerCapitalized = tableHasColumn("Job", "Customer");

  const customerExpr = hasCustomer
    ? "j.customer"
    : hasCustomerCapitalized
    ? "j.Customer"
    : "'Unknown'";

  const rows = db
    .prepare(`
      SELECT
        e.Name AS employeeName,
        f.JobCode AS jobCode,
        j.Description AS description,
        ${customerExpr} AS customer,
        f.Cost AS cost,
        f.Days_allocated_jan AS jan,
        f.Days_allocated_feb AS feb,
        f.Days_allocated_mar AS mar,
        f.Days_allocated_apr AS apr,
        f.Days_allocated_may AS may,
        f.Days_allocated_jun AS jun,
        f.Days_allocated_jul AS jul,
        f.Days_allocated_aug AS aug,
        f.Days_allocated_sep AS sep,
        f.Days_allocated_oct AS oct,
        f.Days_allocated_nov AS nov,
        f.Days_allocated_dec AS dec
      FROM ForecastEntry f
      LEFT JOIN Employee e ON e.EmployeeID = f.EmployeeID
      LEFT JOIN Job j ON j.JobCode = f.JobCode
      ORDER BY e.Name ASC, f.JobCode ASC
    `)
    .all() as ForecastDbRow[];

  const entries: ForecastEntry[] = [];

  for (const row of rows) {
    const monthValues: Array<[string, number | null]> = [
      ["jan", row.jan],
      ["feb", row.feb],
      ["mar", row.mar],
      ["apr", row.apr],
      ["may", row.may],
      ["jun", row.jun],
      ["jul", row.jul],
      ["aug", row.aug],
      ["sep", row.sep],
      ["oct", row.oct],
      ["nov", row.nov],
      ["dec", row.dec],
    ];

    for (const [monthKey, days] of monthValues) {
      if (days === null || days === undefined) continue;

      entries.push({
        employeeName: safeString(row.employeeName),
        customer: safeString(row.customer, "Unknown"),
        jobCode: row.jobCode,
        description: safeString(row.description),
        days,
        cost: row.cost ?? null,
        month: monthDisplayNameFromKey(monthKey),
      });
    }
  }

  return entries;
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

export function createForecastEntry(input: ForecastWriteInput) {
  const { employeeName, jobCode, days = 0, month } = input;

  const employee = getEmployeeByName(employeeName);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeName}`);
  }

  const job = getJobByCode(jobCode);
  if (!job) {
    throw new Error(`Job not found: ${jobCode}`);
  }

  const existing = getExistingForecastEntry(employee.employeeId, job.jobCode);
  const monthColumn = monthColumnFromInput(month);

  if (month && !monthColumn) {
    throw new Error(`Invalid month: ${month}`);
  }

  if (existing) {
    if (!monthColumn) {
      throw new Error(
        `Forecast entry already exists for employee "${employeeName}" and job "${jobCode}"`
      );
    }

    const existingMonthValue = getExistingForecastMonthValue(
      employee.employeeId,
      job.jobCode,
      monthColumn
    );

    if (existingMonthValue !== null && existingMonthValue !== undefined) {
      throw new Error(
        `Forecast allocation already exists for employee "${employeeName}", job "${jobCode}", month "${month}"`
      );
    }

    db.prepare(`
      UPDATE ForecastEntry
      SET ${monthColumn} = ?
      WHERE EmployeeID = ? AND JobCode = ?
    `).run(days, employee.employeeId, job.jobCode);

    return {
      message: "Forecast entry month allocation created",
      employeeName,
      jobCode,
      days,
      month: month ?? null,
    };
  }

  db.prepare(`
    INSERT INTO ForecastEntry (
      EmployeeID,
      JobCode,
      Cost,
      Days,
      WorkspaceID,
      Days_allocated_jan,
      Days_allocated_feb,
      Days_allocated_mar,
      Days_allocated_apr,
      Days_allocated_may,
      Days_allocated_jun,
      Days_allocated_jul,
      Days_allocated_sep,
      Days_allocated_aug,
      Days_allocated_oct,
      Days_allocated_nov,
      Days_allocated_dec
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    employee.employeeId,
    job.jobCode,
    null,
    null,
    employee.workspaceId,
    monthColumn === "Days_allocated_jan" ? days : null,
    monthColumn === "Days_allocated_feb" ? days : null,
    monthColumn === "Days_allocated_mar" ? days : null,
    monthColumn === "Days_allocated_apr" ? days : null,
    monthColumn === "Days_allocated_may" ? days : null,
    monthColumn === "Days_allocated_jun" ? days : null,
    monthColumn === "Days_allocated_jul" ? days : null,
    monthColumn === "Days_allocated_sep" ? days : null,
    monthColumn === "Days_allocated_aug" ? days : null,
    monthColumn === "Days_allocated_oct" ? days : null,
    monthColumn === "Days_allocated_nov" ? days : null,
    monthColumn === "Days_allocated_dec" ? days : null
  );

  return {
    message: "Forecast entry created",
    employeeName,
    jobCode,
    days,
    month: month ?? null,
  };
}

export function updateForecastEntryDays(input: ForecastWriteInput) {
  const { employeeName, jobCode, days = 0, month } = input;

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

  const monthColumn = monthColumnFromInput(month);
  if (!monthColumn) {
    throw new Error("A valid month is required to update a forecast allocation");
  }

  db.prepare(`
    UPDATE ForecastEntry
    SET ${monthColumn} = ?
    WHERE EmployeeID = ? AND JobCode = ?
  `).run(days, employee.employeeId, job.jobCode);

  return {
    message: "Forecast entry updated",
    employeeName,
    jobCode,
    days,
    month,
  };
}

export function updateCost(input :CostUpdate) {
    const { cost, jobCode, workspaceID} = input
    db.prepare(
        `UPDATE Job
        SET Cost = ?
        WHERE Job.JobCode = ? AND workspaceID = ?`
    ).run({ cost, jobCode, workspaceID});

    return {
      message: "Job cost updated",
      cost,
      jobCode,
      workspaceID
    };
}

export function updateBudget(input :BudgetUpdate) {
const { newBudget, jobCode, workspaceID} = input
    db.prepare(
        `UPDATE Job
        SET MonetaryBudget = ?
        WHERE Job.JobCode = ? AND workspaceID = ?`
    ).run({ newBudget, jobCode, workspaceID});

    return {
      message: "Job budget updated",
      newBudget,
      jobCode,
      workspaceID
    };
}

export function updateTimeBudget(input :TimeUpdate) {
    const { timeBudget, jobCode, workspaceID} = input
    db.prepare(
        `UPDATE Job
        SET TimeBudget = ?
        WHERE Job.JobCode = ? AND workspaceID = ?`
    ).run({ timeBudget, jobCode, workspaceID});

    return {
      message: "Job budget updated",
      timeBudget,
      jobCode,
      workspaceID
    };
}

export function updateCurrencySymbol(input :CurrencySymbolUpdate) {
    const { currencySymbol, jobCode, workspaceID } = input
    db.prepare(
        `UPDATE Job
        SET CurrencySymbol = ?
        WHERE Job.JobCode = ? AND workspaceID = ?`
    ).run({ currencySymbol, jobCode, workspaceID});

    return {
      message: "Job budget updated",
      currencySymbol,
      jobCode,
      workspaceID
    };
}

export function deleteForecastEntry(input: ForecastWriteInput) {
  const { employeeName, jobCode, month } = input;

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

  const monthColumn = monthColumnFromInput(month);

  if (monthColumn) {
    db.prepare(`
      UPDATE ForecastEntry
      SET ${monthColumn} = NULL
      WHERE EmployeeID = ? AND JobCode = ?
    `).run(employee.employeeId, job.jobCode);

    return {
      message: "Forecast entry month allocation cleared",
      employeeName,
      jobCode,
      month,
    };
  }

  db.prepare(`
    DELETE FROM ForecastEntry
    WHERE EmployeeID = ? AND JobCode = ?
  `).run(employee.employeeId, job.jobCode);

  return {
    message: "Forecast entry deleted",
    employeeName,
    jobCode,
    month: null,
  };
}