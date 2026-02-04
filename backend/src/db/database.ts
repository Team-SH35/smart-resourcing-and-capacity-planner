import sqlite3 from "sqlite3"
import parsedExcelInfo from "../excel-utils/parsedExcelInfo"

const DATABASE_PATH = "/database/hr.db"


export function writeExcelToDB(workspaceID: string, excelData: parsedExcelInfo[]) {
    const db = new sqlite3.Database(DATABASE_PATH);

    let specialismInsert = `${excelData[0].resource_allocation.map(ele => ele = "(Specialism)")}`
    let specialismValues = `(${excelData[0].resource_allocation.map(ele => ele = `(${ele})`)}`;

    let employeeInsert = "";
    let employeeValues = "";

    let jobInsert = "";
    let jobValues = "";

    let forecastInsert = "";
    let forecastValues = "";

    for (let i = 1; i < excelData.length; i++) {
        //Employee specialisms
        specialismInsert += ", (Specialism)"
        specialismValues += `,(${excelData[i].resource_allocation.map(ele => ele = `(${ele})`)})`
        

        //TODO: Insert Employees
        employeeInsert += ", (name, Exclude_from_AI, workspaceID)" ;
        employeeValues += `(${excelData[i].name}, FALSE, ${workspaceID})`;

        //TODO: Insert Job
        jobInsert += ", (JobCode, Description, BussinessUnit, TimeBudget, CurrencySymbol, MonetaryBudget, StartDate, FinishDate, workspaceID)"
        jobValues += "VALUES PLACEHOLDER"

        //TODO: Insert Forecast Entries
        forecastInsert += ", (EmployeeID, JobCode, Cost, Days, Month, workspaceID)"
        forecastValues += "VALUES PLACEHOLDER"
    }


    db.exec(
        `BEGIN TRANSACTION
        
        INSERT INTO Workspace(workspaceID) 
        VALUES (${workspaceID})

        INSERT INTO Specialism(${specialismInsert})
        VALUES ${specialismValues}

        INSERT INTO Employee ${employeeInsert}
        VALUES ${employeeValues}

        INSERT INTO Job ${jobInsert}
        VALUES ${jobValues}

        INSERT INTO ForecastEntry ${forecastInsert}
        VALUES ${forecastValues}
        COMMIT;`
    )

    db.close();
}   
