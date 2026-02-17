import sqlite3 from "sqlite3"
import { ParsedExcelInfo } from '../excel-utils/parseExcel';

const DATABASE_PATH = "/database/hr.db"


export function writeExcelToDB(workspaceID: string, excelData: ParsedExcelInfo) {
    const db = new sqlite3.Database(DATABASE_PATH);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        db.run(
            `INSERT INTO Month_Work_Days (
               WorkSpaceID,
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
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
             [
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
             ]
        )

        db.run(
            `INSERT INTO Workspace (WorkSpaceID)
             VALUES (?)`,
             [workspaceID]
        );

        //Insert jobs 
        for (let i = 0; excelData.jobs.length; i++) {
            let job = excelData.jobs[i];
            db.run(
                `INSERT INTO Job (JobCode, Description, BusinessUnit, Resource_bu, JobOrigin, reply_entity, customer, t_code, WorkSpaceID)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                 [job.job_code, job.description, job.business_unit, job.resource_bu, job.job_origin, job.reply_entity, job.customer, job.t_code, workspaceID]
            );
        }

        // Insert employees and fore cast entries
        for (let i = 0; excelData.employees.length; i++) {
            let employee = excelData.employees[i];
            db.run(
                `INSERT INTO Employee (Name, ExcludeFromAI, WorkspaceID)
                 VALUES (?, FALSE, ?)`,
                 [employee.name, workspaceID], 
                 function (err) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    let lastID = this.lastID;

                    let forecastEntry = excelData.forecast_entries[i];
                    db.run(
                        `INSERT INTO ForecastEntry(EmployeeID, JobCode, WorkspaceID)
                        VALUES (?,?,?,?,?,?,?,?)`,
                        [lastID, forecastEntry.job_code, workspaceID]
                    )
                 }
            );

            
        }


        db.run("COMMIT");
    })

    db.close();
}   
