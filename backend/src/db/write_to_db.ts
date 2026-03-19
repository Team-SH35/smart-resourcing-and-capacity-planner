import { db } from "./db";
import { ParsedExcelInfo } from "../excel-utils/parse_excel";

export function writeExcelToDB(workspaceID: string, excelData: ParsedExcelInfo) {
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO Workspace (WorkspaceID)
      VALUES (?)
    `).run(workspaceID);

    db.prepare(`
      INSERT INTO Month_Work_Days (
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      workspaceID,
      excelData.allocation_days.jan.work,
      excelData.allocation_days.jan.HYPO,
      excelData.allocation_days.feb.work,
      excelData.allocation_days.feb.HYPO,
      excelData.allocation_days.mar.work,
      excelData.allocation_days.mar.HYPO,
      excelData.allocation_days.apr.work,
      excelData.allocation_days.apr.HYPO,
      excelData.allocation_days.may.work,
      excelData.allocation_days.may.HYPO,
      excelData.allocation_days.jun.work,
      excelData.allocation_days.jun.HYPO,
      excelData.allocation_days.jul.work,
      excelData.allocation_days.jul.HYPO,
      excelData.allocation_days.aug.work,
      excelData.allocation_days.aug.HYPO,
      excelData.allocation_days.sep.work,
      excelData.allocation_days.sep.HYPO,
      excelData.allocation_days.oct.work,
      excelData.allocation_days.oct.HYPO,
      excelData.allocation_days.nov.work,
      excelData.allocation_days.nov.HYPO,
      excelData.allocation_days.dec.work,
      excelData.allocation_days.dec.HYPO
    );

    const insertJob = db.prepare(`
      INSERT INTO Job (
        JobCode,
        ResourceBu,
        Description,
        BusinessUnit,
        JobOrigin,
        ReplyEntity,
        customer,
        t_code,
        TimeBudget,
        CurrencySymbol,
        MonetaryBudget,
        StartDate,
        FinishDate,
        WorkspaceID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const job of excelData.jobs) {
      insertJob.run(
        job.job_code,
        job.resource_bu === "NULL" ? null : job.resource_bu,
        job.description === "NULL" ? null : job.description,
        job.business_unit === "NULL" ? null : job.business_unit,
        job.job_origin === "NULL" ? null : job.job_origin,
        job.reply_entity === "NULL" ? null : job.reply_entity,
        job.customer === "NULL" ? null : job.customer,
        job.t_code === "NULL" ? null : job.t_code,
        null,
        null,
        null,
        null,
        null,
        workspaceID
      );
    }

    const insertEmployee = db.prepare(`
      INSERT INTO Employee (
        EmployeeID,
        Name,
        ExcludeFromAI,
        WorkspaceID
      )
      VALUES (?, ?, FALSE, ?)
    `);

    for (const employee of excelData.employees) {
      insertEmployee.run(employee.employeeID, employee.name, workspaceID);
    }

    const insertForecast = db.prepare(`
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
    `);

    for (const forecastEntry of excelData.forecast_entries) {
      insertForecast.run(
        forecastEntry.employeeID,
        forecastEntry.job_code,
        null,
        null,
        workspaceID,
        normaliseAllocationValue(forecastEntry.resource_allocation[0]),
        normaliseAllocationValue(forecastEntry.resource_allocation[1]),
        normaliseAllocationValue(forecastEntry.resource_allocation[2]),
        normaliseAllocationValue(forecastEntry.resource_allocation[3]),
        normaliseAllocationValue(forecastEntry.resource_allocation[4]),
        normaliseAllocationValue(forecastEntry.resource_allocation[5]),
        normaliseAllocationValue(forecastEntry.resource_allocation[6]),
        normaliseAllocationValue(forecastEntry.resource_allocation[8]),
        normaliseAllocationValue(forecastEntry.resource_allocation[7]),
        normaliseAllocationValue(forecastEntry.resource_allocation[9]),
        normaliseAllocationValue(forecastEntry.resource_allocation[10]),
        normaliseAllocationValue(forecastEntry.resource_allocation[11])
      );
    }
  });

  transaction();
}

function normaliseAllocationValue(value: string | undefined): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed === "" || trimmed.toUpperCase() === "NULL") {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}