import { db } from "../db/db";
import Excel, { Worksheet } from "exceljs";

// Header constants
const HEADER_ROW = 19;
const JAN_ALLOCATION_INDEX = 11;
const FEB_ALLOCATION_INDEX = 12;
const MAR_ALLOCATION_INDEX = 13;
const APR_ALLOCATION_INDEX = 14;
const MAY_ALLOCATION_INDEX = 15;
const JUN_ALLOCATION_INDEX = 16;
const JUL_ALLOCATION_INDEX = 17;
const AUG_ALLOCATION_INDEX = 18;
const SEP_ALLOCATION_INDEX = 19;
const OCT_ALLOCATION_INDEX = 20;
const NOV_ALLOCATION_INDEX = 21;
const DEC_ALLOCATION_INDEX = 22;

// Individual row constants
const NAME_INDEX                = 1;
const RESOURCE_BU_INDEX         = 2;
const CUSTOMER_INDEX            = 3;
const REPLY_ENTITY_INDEX        = 4;
const BUSSINESS_UNIT_INDEX      = 5;
const JOB_ORIGIN_INDEX          = 6;
const T_CODE_INDEX              = 8;
const JOB_CODE_INDEX            = 9;
const DESCRIPTION_INDEX         = 10;

// Month allocations
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

// Employee structure
export interface Employee {
  employeeID: string;
  Name      : string;
}

export interface ForecastEntry {
  Name: string;
  ResourceBu: string;
  Customer: string;
  ReplyEntity: string;
  BusinessUnit: string;
  JobOrigin: string;
  t_code: string;
  JobCode: string;
  Description: string;

  // Monthly allocations
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

// Partial row type for MonthAllocations (unknown → number)
type MonthAllocationsRow = {
  [K in keyof MonthAllocations]: unknown;
};

// Normalize MonthAllocations row
function normalizeRow(row: MonthAllocationsRow): MonthAllocations {
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"] as const;
  const allocations: Partial<MonthAllocations> = {};
  for (const month of months) {
    allocations[`${month}_work` as keyof MonthAllocations] = Number(row[`${month}_work`]);
    allocations[`${month}_hypo` as keyof MonthAllocations] = Number(row[`${month}_hypo`]);
  }
  return allocations as MonthAllocations;
}

// Get month allocations
function getMonthAllocations(workspaceID: string): MonthAllocations {
  const row = db.prepare(`
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
  `).get(workspaceID) as MonthAllocationsRow | undefined;

  if (!row) throw new Error("No month rows defined");
  return normalizeRow(row);
}

// Write allocations to Excel
function writeMonthAllocationDaysToExcel(allocations: MonthAllocations, worksheet: Worksheet) {
  const row = worksheet.getRow(HEADER_ROW);
  const year = new Date().getFullYear() - 2000;

  const months: { index: number, work: number, hypo: number }[] = [
    { index: JAN_ALLOCATION_INDEX, work: allocations.jan_work, hypo: allocations.jan_hypo },
    { index: FEB_ALLOCATION_INDEX, work: allocations.feb_work, hypo: allocations.feb_hypo },
    { index: MAR_ALLOCATION_INDEX, work: allocations.mar_work, hypo: allocations.mar_hypo },
    { index: APR_ALLOCATION_INDEX, work: allocations.apr_work, hypo: allocations.apr_hypo },
    { index: MAY_ALLOCATION_INDEX, work: allocations.may_work, hypo: allocations.may_hypo },
    { index: JUN_ALLOCATION_INDEX, work: allocations.jun_work, hypo: allocations.jun_hypo },
    { index: JUL_ALLOCATION_INDEX, work: allocations.jul_work, hypo: allocations.jul_hypo },
    { index: AUG_ALLOCATION_INDEX, work: allocations.aug_work, hypo: allocations.aug_hypo },
    { index: SEP_ALLOCATION_INDEX, work: allocations.sep_work, hypo: allocations.sep_hypo },
    { index: OCT_ALLOCATION_INDEX, work: allocations.oct_work, hypo: allocations.oct_hypo },
    { index: NOV_ALLOCATION_INDEX, work: allocations.nov_work, hypo: allocations.nov_hypo },
    { index: DEC_ALLOCATION_INDEX, work: allocations.dec_work, hypo: allocations.dec_hypo },
  ];

  months.forEach(({ index, work, hypo }, i) => {
    const monthName = months[i].index === index ? Object.keys(allocations)[i*2].split("_")[0] : "Unknown";
    row.getCell(index).value = `'${monthName.charAt(0).toUpperCase() + monthName.slice(1)}-${year} ${hypo}/${work}`;
  });
}

// Get employees
function getEmployees(workspaceID: string): Employee[] {
  return db.prepare(`
    SELECT employeeID, Name
    FROM Employee
    WHERE workspaceID = ?
  `).all(workspaceID) as Employee[];
}

// Get forecast entries for an employee
function getForecastEntries(workspaceID: string, employeeID: string): ForecastEntry[] {
  return db.prepare(`
    SELECT 
      ForecastEntry.Name,
      ForecastEntry.ResourceBu,
      ForecastEntry.Customer,
      ForecastEntry.ReplyEntity,
      ForecastEntry.BusinessUnit,
      ForecastEntry.JobOrigin,
      ForecastEntry.t_code,
      ForecastEntry.JobCode,
      ForecastEntry.Description,
      ForecastEntry.Days_allocated_jan,
      ForecastEntry.Days_allocated_feb,
      ForecastEntry.Days_allocated_mar,
      ForecastEntry.Days_allocated_apr,
      ForecastEntry.Days_allocated_may,
      ForecastEntry.Days_allocated_jun,
      ForecastEntry.Days_allocated_jul,
      ForecastEntry.Days_allocated_aug,
      ForecastEntry.Days_allocated_sep,
      ForecastEntry.Days_allocated_oct,
      ForecastEntry.Days_allocated_nov,
      ForecastEntry.Days_allocated_dec
    FROM ForecastEntry
    INNER JOIN Job ON Job.JobCode = ForecastEntry.JobCode
    INNER JOIN Employee ON Employee.EmployeeID = ForecastEntry.EmployeeID
    WHERE ForecastEntry.workspaceID = ? AND ForecastEntry.employeeID = ?
  `).all(workspaceID, employeeID) as ForecastEntry[];
}

function totalDaysForEmployee(
  cell: Excel.Cell,
  sum_total: number,
  work_days: number,
  hypo_days: number,
  employee_start_index: number,
  current_row: number,
  column_letter: string
) {
  // Set the formula with the pre-calculated sum_total as result
  cell.value = {
    formula: `SUM(${column_letter}${employee_start_index}:${column_letter}${current_row - 1})`,
    result: sum_total
  };

  // Color the cell based on allocation
  if (sum_total === work_days) {
    // Correctly allocated
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF92d050" } };
  } else if (sum_total < hypo_days) {
    // Under allocated work days
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFC000" } };
  } else if (sum_total < work_days) {
    // Under allocated hypo days
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFF0000" } };
  }
}

// Write forecast entries to Excel
function writeForecastEntries(
  workspaceID: string,
  worksheet: Worksheet,
  monthAllocations: MonthAllocations
) {
  let current_row = 20;
  const employees = getEmployees(workspaceID);

  // Map column index to month allocation field
  const monthColumns: { index: number; field: keyof MonthAllocations; letter: string }[] = [
    { index: JAN_ALLOCATION_INDEX, field: "jan_work", letter: "K" },
    { index: FEB_ALLOCATION_INDEX, field: "feb_work", letter: "L" },
    { index: MAR_ALLOCATION_INDEX, field: "mar_work", letter: "M" },
    { index: APR_ALLOCATION_INDEX, field: "apr_work", letter: "N" },
    { index: MAY_ALLOCATION_INDEX, field: "may_work", letter: "O" },
    { index: JUN_ALLOCATION_INDEX, field: "jun_work", letter: "P" },
    { index: JUL_ALLOCATION_INDEX, field: "jul_work", letter: "Q" },
    { index: AUG_ALLOCATION_INDEX, field: "aug_work", letter: "R" },
    { index: SEP_ALLOCATION_INDEX, field: "sep_work", letter: "S" },
    { index: OCT_ALLOCATION_INDEX, field: "oct_work", letter: "T" },
    { index: NOV_ALLOCATION_INDEX, field: "nov_work", letter: "U" },
    { index: DEC_ALLOCATION_INDEX, field: "dec_work", letter: "V" },
  ];

  employees.forEach(employee => {
    const forecasts = getForecastEntries(workspaceID, employee.employeeID);
    const employee_start_index = current_row;

    forecasts.forEach(forecast => {
      const row = worksheet.getRow(current_row);

      // Set employee forecast fields
      row.getCell(NAME_INDEX).value = forecast.Name;
      row.getCell(RESOURCE_BU_INDEX).value = forecast.ResourceBu;
      row.getCell(CUSTOMER_INDEX).value = forecast.Customer;
      row.getCell(REPLY_ENTITY_INDEX).value = forecast.ReplyEntity;
      row.getCell(BUSSINESS_UNIT_INDEX).value = forecast.BusinessUnit;
      row.getCell(JOB_ORIGIN_INDEX).value = forecast.JobOrigin;
      row.getCell(T_CODE_INDEX).value = forecast.t_code;
      row.getCell(JOB_CODE_INDEX).value = forecast.JobCode;
      row.getCell(DESCRIPTION_INDEX).value = forecast.Description;

      // Set monthly allocation
      row.getCell(JAN_ALLOCATION_INDEX).value = forecast.Days_allocated_jan;
      row.getCell(FEB_ALLOCATION_INDEX).value = forecast.Days_allocated_feb;
      row.getCell(MAR_ALLOCATION_INDEX).value = forecast.Days_allocated_mar;
      row.getCell(APR_ALLOCATION_INDEX).value = forecast.Days_allocated_apr;
      row.getCell(MAY_ALLOCATION_INDEX).value = forecast.Days_allocated_may;
      row.getCell(JUN_ALLOCATION_INDEX).value = forecast.Days_allocated_jun;
      row.getCell(JUL_ALLOCATION_INDEX).value = forecast.Days_allocated_jul;
      row.getCell(AUG_ALLOCATION_INDEX).value = forecast.Days_allocated_aug;
      row.getCell(SEP_ALLOCATION_INDEX).value = forecast.Days_allocated_sep;
      row.getCell(OCT_ALLOCATION_INDEX).value = forecast.Days_allocated_oct;
      row.getCell(NOV_ALLOCATION_INDEX).value = forecast.Days_allocated_nov;
      row.getCell(DEC_ALLOCATION_INDEX).value = forecast.Days_allocated_dec;

      current_row++;
    });

    // Insert TOTAL row for the employee
    const totalRow = worksheet.getRow(current_row);
    worksheet.mergeCells(`B${current_row}:J${current_row}`);
    totalRow.getCell(2).value = `TOTAL - ${employee.employeeID}`;
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF508cd4" } };

    // Calculate sum for each month and color
    monthColumns.forEach(({ index, field, letter }) => {
      let sum_total = 0;
      for (let r = employee_start_index; r < current_row; r++) {
        const val = worksheet.getRow(r).getCell(index).value;
        sum_total += typeof val === "number" ? val : 0;
      }

      totalDaysForEmployee(
        totalRow.getCell(index),
        sum_total,
        monthAllocations[field], // work_days
        monthAllocations[field.replace("_work", "_hypo") as keyof MonthAllocations], // hypo_days
        employee_start_index,
        current_row,
        letter
      );
    });

    current_row++;
  });
}

// Export workbook
export async function exportDbExcel(workspaceID: string): Promise<Excel.Workbook> {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.readFile('./out_excel_sheet_template.xlsx');
  const worksheet = workbook.worksheets[0];

  const monthAllocations = getMonthAllocations(workspaceID);
  writeMonthAllocationDaysToExcel(monthAllocations, worksheet);
  writeForecastEntries(workspaceID, worksheet, monthAllocations);

  return workbook;
}