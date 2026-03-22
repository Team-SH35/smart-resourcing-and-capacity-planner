import db from "../db/db";
import type {
  Employee,
  JobCode,
  ForecastEntry,
  CalendarRow,
  CalendarProject,
} from "../types";

// Raw row shape used when reading employees + specialisms from SQL.
type EmployeeRow = {
  employeeId: number;
  name: string;
  specialism: string | null;
  excludeFromAI: number | boolean | null;
};

// Input for updating forecast cost.
type CostUpdate = {
  cost: number;
  employeeID: number | string;
  jobCode: string;
  workspaceID: number | string;
};

// Input for updating job monetary budget.
type BudgetUpdate = {
  newBudget: number;
  jobCode: string;
  workspaceID: number | string;
};

// Input for updating job time budget.
type TimeUpdate = {
  timeBudget: number;
  jobCode: string;
  workspaceID: number | string;
};

// Input for updating job currency symbol.
type CurrencySymbolUpdate = {
  currencySymbol: string;
  jobCode: string;
  workspaceID: number | string;
};

// Input for updating job dates.
type StartDateUpdate = {
  startDateISO: string;
  jobCode: string;
  workspaceID: number | string;
};

// Input for adding employee specialisms.
type SpecialismsInput = {
  specialisms: string[];
  employeeName: string;
};

// SQL result shape for jobs.
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

// SQL result shape for forecast-entry read queries.
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

// Input used for creating/updating/deleting forecast entries.
type ForecastWriteInput = {
  employeeName: string;
  jobCode: string;
  days?: number;
  month?: string;
};

// Helper lookup shapes.
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

/**
 * Returns a fallback string when a DB field is null or undefined.
 */
function safeString(value: string | null | undefined, fallback = ""): string {
  return value ?? fallback;
}

/**
 * Checks whether a given table exists in the database.
 */
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

/**
 * Checks whether a table contains a specific column.
 * Useful because some schemas differ slightly between environments.
 */
function tableHasColumn(tableName: string, columnName: string): boolean {
  if (!tableExists(tableName)) return false;

  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  return columns.some((column) => column.name === columnName);
}

/**
 * Converts a business-unit label into a stable frontend row ID.
 */
function businessUnitToRowId(businessUnit: string): string {
  return `team-${businessUnit.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Picks a display color for a given business unit.
 */
function businessUnitToColor(businessUnit: string): string {
  const key = businessUnit.toLowerCase();

  if (key.includes("analytic")) return "#8B5CF6";
  if (key.includes("develop")) return "#F59E0B";
  if (key.includes("frontend")) return "#3B82F6";
  if (key.includes("backend")) return "#10B981";

  return "#6B7280";
}

/**
 * Normalises many possible month strings into a short key.
 * Example: "September" -> "sep"
 */
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

/**
 * Converts a month name into the corresponding forecast-entry column name.
 */
function monthColumnFromInput(month?: string): string | null {
  const key = normalizeMonthKey(month);
  return key ? `Days_allocated_${key}` : null;
}

/**
 * Converts a short month key into a human-readable display name.
 */
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

/**
 * Looks up an employee by name and returns their ID + workspace.
 */
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

/**
 * Looks up a job by code and returns its code + workspace.
 */
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

/**
 * Checks whether a forecast entry already exists for an employee/job pair.
 */
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

/**
 * Reads the current value of a single month column on an existing forecast entry.
 */
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

/**
 * Returns employees grouped with all their specialisms.
 */
export function getEmployees(): Employee[] {
  if (!tableExists("Employee")) return [];

  // Different schemas may use different casing/naming for the AI exclusion column.
  const excludeExpr = tableHasColumn("Employee", "ExcludeFromAI")
    ? "e.ExcludeFromAI"
    : tableHasColumn("Employee", "Exclude_from_AI")
    ? "e.Exclude_from_AI"
    : "0";

  const rows = db
    .prepare(`
      SELECT
        e.EmployeeID AS employeeId,
        e.Name AS name,
        es.Specialism AS specialism,
        ${excludeExpr} AS excludeFromAI
      FROM Employee e
      LEFT JOIN EmployeeSpecialisms es ON e.EmployeeID = es.EmployeeID
      ORDER BY e.Name ASC, es.Specialism ASC
    `)
    .all() as EmployeeRow[];

  // Group rows by employee ID so each employee appears once with an array of specialisms.
  const employeesMap = new Map<number, Employee>();

  for (const row of rows) {
    const key = row.employeeId;

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

  return Array.from(employeesMap.values());
}

/**
 * Returns all jobs formatted for the frontend.
 */
export function getJobCodes(): JobCode[] {
  if (!tableExists("Job")) return [];

  // Support both "customer" and "Customer" column names.
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

/**
 * Returns forecast entries flattened by month so the frontend can render each month allocation as its own row.
 */
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

/**
 * Returns job rows transformed for a calendar-style UI.
 */
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

/**
 * Creates a new forecast entry, or fills in a single month on an existing entry.
 */
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

  // Create a brand new entry with only the requested month populated.
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
      Days_allocated_aug,
      Days_allocated_sep,
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
    monthColumn === "Days_allocated_aug" ? days : null,
    monthColumn === "Days_allocated_sep" ? days : null,
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

/**
 * Updates the value for one month on an existing forecast entry.
 */
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

export function updateCost(input: CostUpdate) {
  const { cost, employeeID, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE ForecastEntry
      SET Cost = ?
      WHERE JobCode = ? AND EmployeeID = ? AND WorkspaceID = ?
    `)
    .run(cost, jobCode, employeeID, workspaceID);

  if (result.changes === 0) {
    throw new Error(
      `Forecast entry not found for employeeID "${employeeID}", job "${jobCode}", workspace "${workspaceID}"`
    );
  }

  return {
    message: "Forecast cost updated",
    cost,
    employeeID,
    jobCode,
    workspaceID,
  };
}

/**
 * Updates the monetary budget on a job.
 */
export function updateBudget(input: BudgetUpdate) {
  const { newBudget, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE Job
      SET MonetaryBudget = ?
      WHERE JobCode = ? AND WorkspaceID = ?
    `)
    .run(newBudget, jobCode, workspaceID);

  if (result.changes === 0) {
    throw new Error(`Job not found for jobCode "${jobCode}" and workspace "${workspaceID}"`);
  }

  return {
    message: "Job budget updated",
    newBudget,
    jobCode,
    workspaceID,
  };
}

/**
 * Updates the time budget on a job.
 */
export function updateTimeBudget(input: TimeUpdate) {
  const { timeBudget, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE Job
      SET TimeBudget = ?
      WHERE JobCode = ? AND WorkspaceID = ?
    `)
    .run(timeBudget, jobCode, workspaceID);

  if (result.changes === 0) {
    throw new Error(`Job not found for jobCode "${jobCode}" and workspace "${workspaceID}"`);
  }

  return {
    message: "Job time budget updated",
    timeBudget,
    jobCode,
    workspaceID,
  };
}

/**
 * Updates the currency symbol on a job.
 */
export function updateCurrencySymbol(input: CurrencySymbolUpdate) {
  const { currencySymbol, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE Job
      SET CurrencySymbol = ?
      WHERE JobCode = ? AND WorkspaceID = ?
    `)
    .run(currencySymbol, jobCode, workspaceID);

  if (result.changes === 0) {
    throw new Error(`Job not found for jobCode "${jobCode}" and workspace "${workspaceID}"`);
  }

  return {
    message: "Job currency symbol updated",
    currencySymbol,
    jobCode,
    workspaceID,
  };
}

export function updateStartTime(input: StartDateUpdate) {
  const { startDateISO, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE Job
      SET StartDate = ?
      WHERE JobCode = ? AND WorkspaceID = ?
    `)
    .run(startDateISO, jobCode, workspaceID);

  if (result.changes === 0) {
    throw new Error(`Job not found for jobCode "${jobCode}" and workspace "${workspaceID}"`);
  }

  return {
    message: "Job start date updated",
    startDateISO,
    jobCode,
    workspaceID,
  };
}

/**
 * Updates the end date on a job.
 */
export function updateEndTime(input: StartDateUpdate) {
  const { startDateISO, jobCode, workspaceID } = input;

  const result = db
    .prepare(`
      UPDATE Job
      SET FinishDate = ?
      WHERE JobCode = ? AND WorkspaceID = ?
    `)
    .run(startDateISO, jobCode, workspaceID);

  if (result.changes === 0) {
    throw new Error(`Job not found for jobCode "${jobCode}" and workspace "${workspaceID}"`);
  }

  return {
    message: "Job end date updated",
    startDateISO,
    jobCode,
    workspaceID,
  };
}

// Input for creating a new job.
type CreateJobInput = {
  jobCode: string;
  description?: string;
  businessUnit?: string;
  resourceBu?: string;
  jobOrigin?: string;
  replyEntity?: string;
  customer?: string;
  tCode?: string;
  timeBudget?: number | null;
  monetaryBudget?: number | null;
  currencySymbol?: string | null;
  startDate?: string | null;
  finishDate?: string | null;
  workspaceID: number | string;
};

// Input for upserting month work/HYPO days.
type MonthWorkDaysInput = {
  workspaceID: number | string;
  jan_work: number; jan_hypo: number;
  feb_work: number; feb_hypo: number;
  mar_work: number; mar_hypo: number;
  apr_work: number; apr_hypo: number;
  may_work: number; may_hypo: number;
  jun_work: number; jun_hypo: number;
  jul_work: number; jul_hypo: number;
  aug_work: number; aug_hypo: number;
  sep_work: number; sep_hypo: number;
  oct_work: number; oct_hypo: number;
  nov_work: number; nov_hypo: number;
  dec_work: number; dec_hypo: number;
};

// SQL result shape for month work days.
type MonthWorkDaysRow = {
  workspaceId: number;
  jan_work: number; jan_hypo: number;
  feb_work: number; feb_hypo: number;
  mar_work: number; mar_hypo: number;
  apr_work: number; apr_hypo: number;
  may_work: number; may_hypo: number;
  jun_work: number; jun_hypo: number;
  jul_work: number; jul_hypo: number;
  aug_work: number; aug_hypo: number;
  sep_work: number; sep_hypo: number;
  oct_work: number; oct_hypo: number;
  nov_work: number; nov_hypo: number;
  dec_work: number; dec_hypo: number;
};

/**
 * Returns all distinct business units that exist on jobs.
 */
export function getBusinessUnits(): string[] {
  if (!tableExists("Job")) return [];

  const rows = db
    .prepare(`
      SELECT DISTINCT BusinessUnit
      FROM Job
      WHERE BusinessUnit IS NOT NULL AND BusinessUnit != ''
      ORDER BY BusinessUnit ASC
    `)
    .all() as { BusinessUnit: string }[];

  return rows.map((r) => r.BusinessUnit);
}

/**
 * Creates a new job. Throws if the job code already exists.
 */
export function createJob(input: CreateJobInput) {
  const {
    jobCode,
    description,
    businessUnit,
    resourceBu,
    jobOrigin,
    replyEntity,
    customer,
    tCode,
    timeBudget,
    monetaryBudget,
    currencySymbol,
    startDate,
    finishDate,
    workspaceID,
  } = input;

  const existing = getJobByCode(jobCode);
  if (existing) {
    throw new Error(`Job already exists: ${jobCode}`);
  }

  db.prepare(`
    INSERT INTO Job (
      JobCode, Description, BusinessUnit,
      ResourceBu, JobOrigin, ReplyEntity,
      customer, t_code,
      TimeBudget, MonetaryBudget, CurrencySymbol,
      StartDate, FinishDate, WorkspaceID
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    jobCode,
    description ?? null,
    businessUnit ?? null,
    resourceBu ?? null,
    jobOrigin ?? null,
    replyEntity ?? null,
    customer ?? null,
    tCode ?? null,
    timeBudget ?? null,
    monetaryBudget ?? null,
    currencySymbol ?? null,
    startDate ?? null,
    finishDate ?? null,
    workspaceID,
  );

  return { message: "Job created", jobCode };
}

/**
 * Deletes a job and all its associated forecast entries.
 * Uses a transaction so either both deletions succeed or neither does.
 */
export function deleteJob(jobCode: string, workspaceID: number | string) {
  const existing = getJobByCode(jobCode);
  if (!existing) {
    throw new Error(`Job not found: ${jobCode}`);
  }

  const transaction = db.transaction(() => {
    db.prepare(`DELETE FROM ForecastEntry WHERE JobCode = ?`).run(jobCode);
    db.prepare(`DELETE FROM Job WHERE JobCode = ? AND WorkspaceID = ?`).run(jobCode, workspaceID);
  });

  transaction();

  return { message: "Job deleted", jobCode };
}

/**
 * Returns the month work/HYPO day counts for a workspace.
 */
export function getMonthWorkDays(workspaceID: number | string): MonthWorkDaysRow | null {
  if (!tableExists("Month_Work_Days")) return null;

  const row = db
    .prepare(`
      SELECT
        WorkspaceID AS workspaceId,
        jan_work, jan_hypo, feb_work, feb_hypo,
        mar_work, mar_hypo, apr_work, apr_hypo,
        may_work, may_hypo, jun_work, jun_hypo,
        jul_work, jul_hypo, aug_work, aug_hypo,
        sep_work, sep_hypo, oct_work, oct_hypo,
        nov_work, nov_hypo, dec_work, dec_hypo
      FROM Month_Work_Days
      WHERE WorkspaceID = ?
    `)
    .get(workspaceID) as MonthWorkDaysRow | undefined;

  return row ?? null;
}

/**
 * Creates or replaces the month work/HYPO day counts for a workspace.
 * Ensures the workspace row exists first.
 */
export function upsertMonthWorkDays(input: MonthWorkDaysInput) {
  const { workspaceID } = input;

  db.prepare(`INSERT OR IGNORE INTO Workspace (WorkspaceID) VALUES (?)`).run(workspaceID);

  db.prepare(`
    INSERT OR REPLACE INTO Month_Work_Days (
      WorkspaceID,
      jan_work, jan_hypo, feb_work, feb_hypo,
      mar_work, mar_hypo, apr_work, apr_hypo,
      may_work, may_hypo, jun_work, jun_hypo,
      jul_work, jul_hypo, aug_work, aug_hypo,
      sep_work, sep_hypo, oct_work, oct_hypo,
      nov_work, nov_hypo, dec_work, dec_hypo
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    workspaceID,
    input.jan_work, input.jan_hypo,
    input.feb_work, input.feb_hypo,
    input.mar_work, input.mar_hypo,
    input.apr_work, input.apr_hypo,
    input.may_work, input.may_hypo,
    input.jun_work, input.jun_hypo,
    input.jul_work, input.jul_hypo,
    input.aug_work, input.aug_hypo,
    input.sep_work, input.sep_hypo,
    input.oct_work, input.oct_hypo,
    input.nov_work, input.nov_hypo,
    input.dec_work, input.dec_hypo,
  );

  return { message: "Month work days updated", workspaceID };
}

/**
 * Adds one or more specialisms to an employee in a transaction.
 */
export function addSpecialism(input: SpecialismsInput) {
  const { employeeName, specialisms } = input;

  const employee = getEmployeeByName(employeeName);
  if (!employee) {
    throw new Error(`Employee not found: ${employeeName}`);
  }

  const transaction = db.transaction(() => {
    for (const specialism of specialisms) {
      db.prepare(`
        INSERT INTO EmployeeSpecialisms (EmployeeID, Specialism)
        VALUES (?, ?)
      `).run(employee.employeeId, specialism);
    }
  });

  transaction();

  return {
    message: "Specialisms added",
    employeeName,
    added: specialisms.length,
  };
}

/**
 * Deletes either:
 * - a single month allocation from a forecast entry, or
 * - the whole forecast entry if no month is provided.
 */
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