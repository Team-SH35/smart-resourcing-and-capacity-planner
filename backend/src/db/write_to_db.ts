import { db } from "./db"
import { ParsedExcelInfo } from "../excel-utils/parse_excel";

export function writeExcelToDB(workspaceID: string, excelData: ParsedExcelInfo) {
    const transaction = db.transaction( () => {
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
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
            workspaceID,
            excelData.allocation_days.jan.work, excelData.allocation_days.jan.HYPO,
            excelData.allocation_days.feb.work, excelData.allocation_days.feb.HYPO,
            excelData.allocation_days.mar.work, excelData.allocation_days.mar.HYPO,
            excelData.allocation_days.apr.work, excelData.allocation_days.apr.HYPO,
            excelData.allocation_days.may.work, excelData.allocation_days.may.HYPO,
            excelData.allocation_days.jun.work, excelData.allocation_days.jun.HYPO,
            excelData.allocation_days.jul.work, excelData.allocation_days.jul.HYPO,
            excelData.allocation_days.aug.work, excelData.allocation_days.aug.HYPO,
            excelData.allocation_days.sep.work, excelData.allocation_days.sep.HYPO,
            excelData.allocation_days.oct.work, excelData.allocation_days.oct.HYPO,
            excelData.allocation_days.nov.work, excelData.allocation_days.nov.HYPO,
            excelData.allocation_days.dec.work, excelData.allocation_days.dec.HYPO,
        );
        

        const insertJob = db.prepare(`
            INSERT INTO Job (
                JobCode, Description, BusinessUnit,
                TimeBudget, CurrencySymbol, MonetaryBudget,
                StartDate, FinishDate, WorkspaceID
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const job of excelData.jobs) {
            insertJob.run(
                job.job_code,
                job.description,
                job.business_unit,
                null,
                null,
                null,
                null,
                null,
                workspaceID
            )
        }

        const insertEmployee = db.prepare(`
            INSERT INTO Employee (Name, ExcludeFromAI, WorkspaceID)
            VALUES (?, FALSE, ?)
        `);

        const insertForecast = db.prepare(`
            INSERT INTO ForecastEntry (
                EmployeeID, JobCode, Cost, Days, Days_allocated_jan float, Days_allocated_feb float, Days_allocated_mar float, Days_allocated_apr float, Days_allocated_may float, Days_allocated_jun float, Days_allocated_jul float, Days_allocated_sep float, Days_allocated_aug float, Days_allocated_oct float, Days_allocated_nov float,Days_allocated_dec float, WorkspaceID
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (let i = 0; i < excelData.employees.length; i++) {
            const employee = excelData.employees[i];

            const result = insertEmployee.run(employee.name, workspaceID);

            excelData.forecast_entries.forEach(forecast_entry => {
                if (forecast_entry.employeeID == employee.employeeID) {
                    insertForecast.run(
                        result.lastInsertRowid,
                        forecast_entry.job_code,
                        null,
                        null,
                        forecast_entry.resource_allocation[0],
                        forecast_entry.resource_allocation[1],
                        forecast_entry.resource_allocation[2],
                        forecast_entry.resource_allocation[3],
                        forecast_entry.resource_allocation[4],
                        forecast_entry.resource_allocation[5],
                        forecast_entry.resource_allocation[6],
                        forecast_entry.resource_allocation[7],
                        forecast_entry.resource_allocation[8],
                        forecast_entry.resource_allocation[9],
                        forecast_entry.resource_allocation[10],
                        forecast_entry.resource_allocation[11],
                        workspaceID
                    );
                }
            });
            
        }
    });

    transaction();
}