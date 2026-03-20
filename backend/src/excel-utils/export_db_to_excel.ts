import { db } from "../db/db";
import Excel, { Workbook } from "exceljs"

export interface MonthAllocations {
  jan_work: number;
  jan_hypo: number;
  feb_work: number;
  feb_hypo: number;
  mar_work: number;
  mar_hypo: number;
  apr_work: number;
  apr_hypo: number;
  may_work: number;
  may_hypo: number;
  jun_work: number;
  jun_hypo: number;
  jul_work: number;
  jul_hypo: number;
  aug_work: number;
  aug_hypo: number;
  sep_work: number;
  sep_hypo: number;
  oct_work: number;
  oct_hypo: number;
  nov_work: number;
  nov_hypo: number;
  dec_work: number;
  dec_hypo: number;
}

// Partial type for rows returned by SQLite
type MonthAllocationsRow = {
  [K in keyof MonthAllocations]: unknown;
};

function normalizeRow(row: MonthAllocationsRow): MonthAllocations {
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
  const allocations: Partial<MonthAllocations> = {};

  for (const month of months) {
    allocations[`${month}_work` as keyof MonthAllocations] = Number(row[`${month}_work`]);
    allocations[`${month}_hypo` as keyof MonthAllocations] = Number(row[`${month}_hypo`]);
  }

  return allocations as MonthAllocations;
}

function getMonthAllocations(workspaceID: string) {
    const row = db
        .prepare(`
        SELECT
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
        FROM Month_Work_Days
        WHERE WorkspaceID = ?
        `)
        .get(workspaceID) as MonthAllocationsRow | undefined;

        if (!row) return null;
    
        return normalizeRow(row);
}

export async function export_db_excel(workspaceID: string) {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile('./out_excel_sheet_template.xlsx');

    const monthAllocations = getMonthAllocations(workspaceID);

    


}