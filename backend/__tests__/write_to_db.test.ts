process.env.NODE_ENV = "test";


import { expect, describe, it, beforeAll } from "@jest/globals";
import fs from "node:fs";
import db from "../src/db/db";
import parseExcelInfo from "../src/excel-utils/parse_excel";
import { writeExcelToDB } from "../src/db/write_to_db";

interface ForecastEntryRow {
    EmployeeID: number;
    JobCode: string;
    Cost: number | null;
    Days: number | null;
    WorkspaceID: number;
    Days_allocated_jan: number;
    Days_allocated_feb: number;
    Days_allocated_mar: number;
    Days_allocated_apr: number;
    Days_allocated_may: number;
    Days_allocated_jun: number;
    Days_allocated_jul: number;
    Days_allocated_aug: number;
    Days_allocated_sep: number;
    Days_allocated_oct: number;
    Days_allocated_nov: number;
    Days_allocated_dec: number;
}

interface EmployeeRow {
    EmployeeID: number;
    Name: string;
    ExcludeFromAI: number;
    WorkspaceID: number;
}

interface JobRow {
    JobCode: string;
    Description: string;
    BusinessUnit: string;
}

interface EmployeeWorkspaceRow {
    EmployeeID: number;
    WorkspaceID: number;
    WID: number;
}

interface MonthWorkDaysRow {
    WorkspaceID: number;
    jan_work: number;
    feb_work: number;
}

/* =========================
   Jest Tests
========================= */

describe("Database write from Excel", () => {

    beforeAll(async () => {
        const readStream = fs.createReadStream("__tests__/test_excel_data.xlsx");
        const excelData = await parseExcelInfo(readStream);
        await writeExcelToDB("123", excelData);

        try {
            const row = db
                .prepare(`
                    SELECT * FROM ForecastEntry
                    WHERE EmployeeID = 3
                `)
                .get();

            if (!row) {
                console.log("No row found!");
            } else {
                //console.log("Row data:");
                Object.entries(row).forEach(([key, value]) => {
                    console.log(`${key}:`, value);
                });
                // Or, for a nicer table view:
                console.table([row]);
            }
        } catch (err) {
            console.error("Error fetching row:", err);
        }        
    });

    it("should insert a forecast entry correctly", () => {
        const entry = db.prepare(`
            SELECT * FROM ForecastEntry
            WHERE EmployeeID = 3 AND JobCode = 'C364-CWPUK-23-4-5'
        `).get() as ForecastEntryRow | undefined;

        expect(entry).toBeDefined();
        expect(entry!.EmployeeID).toBe(3);
        expect(entry!.JobCode).toBe('C364-CWPUK-23-4-5');
        expect(entry!.Days_allocated_jan).toBeGreaterThanOrEqual(0);
        expect(entry!.Days_allocated_feb).toBeGreaterThanOrEqual(0);
    });

    it("should insert employee correctly", () => {
        const employee = db.prepare(`
            SELECT * FROM Employee WHERE EmployeeID = 2
        `).get() as EmployeeRow | undefined;

        expect(employee).toBeDefined();
        expect(employee!.EmployeeID).toBe(2);
        expect(employee!.Name).toBeTruthy();
        expect(typeof employee!.ExcludeFromAI).toBe("number");
    });

    it("should insert job correctly", () => {
        const job = db.prepare(`
            SELECT * FROM Job WHERE JobCode = 'C364-CWPUK-23-4-5'
        `).get() as JobRow | undefined;

        expect(job).toBeDefined();
        expect(job!.JobCode).toBe('C364-CWPUK-23-4-5');
        expect(job!.Description).toBeTruthy();
        expect(job!.BusinessUnit).toBeTruthy();
    });

    it("should maintain relationship between Employee and Workspace", () => {
        const result = db.prepare(`
            SELECT e.EmployeeID, e.WorkspaceID, w.WorkspaceID AS WID
            FROM Employee e
            JOIN Workspace w ON e.WorkspaceID = w.WorkspaceID
            WHERE e.EmployeeID = 2
        `).get() as EmployeeWorkspaceRow | undefined;

        expect(result).toBeDefined();
        expect(result!.WorkspaceID).toBe(result!.WID);
    });

    it("should insert month work days for workspace", () => {
        const row = db.prepare(`
            SELECT * FROM Month_Work_Days WHERE WorkspaceID = 123
        `).get() as MonthWorkDaysRow | undefined;

        expect(row).toBeDefined();
        expect(row!.jan_work).toBeGreaterThanOrEqual(0);
        expect(row!.feb_work).toBeGreaterThanOrEqual(0);
    });

    it("should not allow duplicate forecast entries", () => {
        expect(() => {
            db.prepare(`
                INSERT INTO ForecastEntry (EmployeeID, JobCode, WorkspaceID)
                VALUES (3, 'C364-CWPUK-23-4-5', 123)
            `).run();
        }).toThrow();
    });

    it("should not have negative allocated days", () => {
        const rows = db.prepare(`SELECT * FROM ForecastEntry`).all() as ForecastEntryRow[];
        rows.forEach((r) => {
            expect(r.Days_allocated_jan).toBeGreaterThanOrEqual(0);
        });
    });

});