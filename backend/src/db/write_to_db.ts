import db from "./db";
import { ParsedExcelInfo } from "../excel-utils/parse_excel";

export function writeExcelToDB(workspaceID: string, excelData: ParsedExcelInfo) {
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT OR IGNORE INTO Workspace (WorkspaceID)
      VALUES (?)
    `).run(workspaceID);

    const monthWorkStmt = db.prepare(`
      INSERT OR REPLACE INTO Month_Work_Days (
        WorkspaceID,
        jan_work, jan_hypo,
        feb_work, feb_hypo,
        mar_work, mar_hypo,
        apr_work, apr_hypo,
        may_work, may_hypo,
        jun_work, jun_hypo,
        jul_work, jul_hypo,
        aug_work, aug_hypo,
        sep_work, sep_hypo,
        oct_work, oct_hypo,
        nov_work, nov_hypo,
        dec_work, dec_hypo
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const ad = excelData.allocation_days;
    monthWorkStmt.run(
      workspaceID,
      ad.jan.work ?? 0, ad.jan.HYPO ?? 0,
      ad.feb.work ?? 0, ad.feb.HYPO ?? 0,
      ad.mar.work ?? 0, ad.mar.HYPO ?? 0,
      ad.apr.work ?? 0, ad.apr.HYPO ?? 0,
      ad.may.work ?? 0, ad.may.HYPO ?? 0,
      ad.jun.work ?? 0, ad.jun.HYPO ?? 0,
      ad.jul.work ?? 0, ad.jul.HYPO ?? 0,
      ad.aug.work ?? 0, ad.aug.HYPO ?? 0,
      ad.sep.work ?? 0, ad.sep.HYPO ?? 0,
      ad.oct.work ?? 0, ad.oct.HYPO ?? 0,
      ad.nov.work ?? 0, ad.nov.HYPO ?? 0,
      ad.dec.work ?? 0, ad.dec.HYPO ?? 0
    );

    // Insert job rows. All fields from the parsed Excel are written.
    // IGNORE prevents duplicate JobCode inserts from crashing the import.
    const insertJob = db.prepare(`
      INSERT OR IGNORE INTO Job (
        JobCode, Description, BusinessUnit,
        ResourceBu, JobOrigin, ReplyEntity,
        customer, t_code,
        TimeBudget, CurrencySymbol, MonetaryBudget,
        StartDate, FinishDate, WorkspaceID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const job of excelData.jobs) {
      if (!job.job_code) {
        continue;
      }
      insertJob.run(
        job.job_code,
        job.description ?? "",
        job.business_unit ?? "",
        job.resource_bu ?? "",
        job.job_origin ?? "",
        job.reply_entity ?? "",
        job.customer ?? "",
        job.t_code ?? "",
        null,
        null,
        null,
        null,
        null,
        workspaceID
      );
    }

    const insertEmployee = db.prepare(`
      INSERT OR IGNORE INTO Employee (EmployeeID, Name, ExcludeFromAI, WorkspaceID)
      VALUES (?, ?, FALSE, ?)
    `);

    // Insert forecast rows. Column order is chronological: jan → dec.
    const insertForecast = db.prepare(`
      INSERT OR REPLACE INTO ForecastEntry (
        EmployeeID, JobCode, Cost, Days,
        Days_allocated_jan, Days_allocated_feb, Days_allocated_mar, Days_allocated_apr,
        Days_allocated_may, Days_allocated_jun, Days_allocated_jul, Days_allocated_aug,
        Days_allocated_sep, Days_allocated_oct, Days_allocated_nov, Days_allocated_dec,
        WorkspaceID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const employee of excelData.employees) {
      insertEmployee.run(employee.employeeID, employee.name, workspaceID);

      const employeeForecasts = excelData.forecast_entries.filter(
        (f) => f.employeeID === employee.employeeID
      );

      for (const forecast_entry of employeeForecasts) {
        if (!forecast_entry.job_code) {
          continue;
        }

        const alloc = forecast_entry.resource_allocation.map((v) => Number(v) || 0);

        insertForecast.run(
          employee.employeeID,
          forecast_entry.job_code,
          null,
          null,
          alloc[0],  // jan
          alloc[1],  // feb
          alloc[2],  // mar
          alloc[3],  // apr
          alloc[4],  // may
          alloc[5],  // jun
          alloc[6],  // jul
          alloc[7],  // aug
          alloc[8],  // sep
          alloc[9],  // oct
          alloc[10], // nov
          alloc[11], // dec
          workspaceID
        );
      }
    }
  });

  transaction();
}
