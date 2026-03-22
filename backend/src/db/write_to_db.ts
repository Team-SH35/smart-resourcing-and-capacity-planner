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

        const insertJob = db.prepare(`
            INSERT OR IGNORE INTO Job (
                JobCode, ResourceBu, Customer, ReplyEntity, 
                JobOrigin, t_code, Description, BusinessUnit,
                TimeBudget, CurrencySymbol, MonetaryBudget,
                StartDate, FinishDate, WorkspaceID
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const job of excelData.jobs) {
            if (!job.job_code) {
                //console.warn("Skipping job with empty JobCode", job);
                continue;
            }
            insertJob.run(
                job.job_code,
                job.resource_bu,
                job.customer,
                job.reply_entity,
                job.job_origin,
                job.t_code,
                job.description,
                job.business_unit,
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

        const insertForecast = db.prepare(`
            INSERT INTO ForecastEntry (
                EmployeeID, JobCode, Cost, Days,
                Days_allocated_jan , Days_allocated_feb , Days_allocated_mar , Days_allocated_apr ,
                Days_allocated_may , Days_allocated_jun , Days_allocated_jul , Days_allocated_sep ,
                Days_allocated_aug , Days_allocated_oct , Days_allocated_nov , Days_allocated_dec ,
                WorkspaceID
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const employee of excelData.employees) {
            //console.log("Inserting Employee:", employee.employeeID, employee.name);
            insertEmployee.run(employee.employeeID, employee.name, workspaceID);

            const employeeForecasts = excelData.forecast_entries.filter(f => f.employeeID === employee.employeeID);

            for (const forecast_entry of employeeForecasts) {
                if (!forecast_entry.job_code) {
                    //console.warn("Skipping ForecastEntry with missing JobCode for employee", employee.employeeID);
                    continue;
                }

                // Convert allocations to numbers and handle missing values
                const alloc = forecast_entry.resource_allocation.map(v => Number(v) || 0);

                insertForecast.run(
                    employee.employeeID,
                    forecast_entry.job_code,
                    null,
                    null,
                    alloc[0], alloc[1], alloc[2], alloc[3], alloc[4], alloc[5],
                    alloc[6], alloc[7], alloc[8], alloc[9], alloc[10], alloc[11],
                    workspaceID
                );
                //console.log(`Inserted ForecastEntry: EmployeeID=${employee.employeeID}, JobCode=${forecast_entry.job_code}`);
            }

        }
    });

    transaction();

}