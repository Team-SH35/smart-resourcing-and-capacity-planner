import Excel from "exceljs";
import { Readable } from "stream";

// Stores work/HYPO values for all months.
interface MonthAllocations {
  jan: MonthAllocation;
  feb: MonthAllocation;
  mar: MonthAllocation;
  apr: MonthAllocation;
  may: MonthAllocation;
  jun: MonthAllocation;
  jul: MonthAllocation;
  aug: MonthAllocation;
  sep: MonthAllocation;
  oct: MonthAllocation;
  nov: MonthAllocation;
  dec: MonthAllocation;
}

// Stores the HYPO/work pair for a single month.
interface MonthAllocation {
  HYPO: number | null;
  work: number | null;
}

// Parsed forecast row from the spreadsheet.
interface ForecastEntry {
  employeeID: number;
  name: string;
  job_code: string;
  resource_allocation: string[];
}

// Parsed job row from the spreadsheet.
interface Job {
  job_code: string;
  description: string;
  business_unit: string;
  resource_bu: string;
  job_origin: string;
  reply_entity: string;
  customer: string;
  t_code: string;
}

// Minimal employee structure extracted from the spreadsheet.
export interface Employee {
  employeeID: number;
  name: string;
}

// Final parsed output used by the import pipeline.
export interface ParsedExcelInfo {
  allocation_days: MonthAllocations;
  employees: Employee[];
  jobs: Job[];
  forecast_entries: ForecastEntry[];
}

// Spreadsheet column indexes.
const NAME_INDEX = 1;
const RESOURCE_BU_INDEX = 2;
const CUSTOMER_INDEX = 3;
const REPLY_ENTITY_INDEX = 4;
const BUSSINESS_UNIT_INDEX = 5;
const JOB_ORIGIN_INDEX = 6;
const T_CODE_INDEX = 8;
const JOB_CODE_INDEX = 9;
const DESCRIPTION_INDEX = 10;

// Inclusive column range containing month allocations.
const RESOURCE_ALLOCATION_RANGE = [11, 23];

/**
 * Reads the uploaded Excel workbook and extracts:
 * - month header values
 * - employees
 * - jobs
 * - forecast entries
 */
export default async function parseExcelInfo(
  excelFileStream: Readable
): Promise<ParsedExcelInfo> {
  const workbook = new Excel.Workbook();
  await workbook.xlsx.read(excelFileStream);
  const worksheet = workbook.worksheets[0];

  const parsed_excel_data: ParsedExcelInfo = {
    allocation_days: getMonthAllocationDays(worksheet),
    employees: [],
    forecast_entries: [],
    jobs: [],
  };

  // Forecast data starts from row 20 in this spreadsheet format.
  let currentRow = 20;
  let row = worksheet.getRow(currentRow);

  // Used to avoid pushing duplicate jobs.
  const registered_jobs = new Set<string>();

  // Employee IDs are generated as we move through employee blocks.
  let employeeID = 0;
  let insideEmployeeBlock = false;

  // Stop when column 2 becomes NULL.
  while (getCellString(row.getCell(2)) !== "NULL") {
    const name = getCellString(row.getCell(NAME_INDEX));

    // "TOTAL..." marks the end of the current employee block.
    if (getCellString(row.getCell(2)).startsWith("TOTAL")) {
      row = worksheet.getRow(++currentRow);
      insideEmployeeBlock = false;
      continue;
    }

    // When entering a new employee block, increment the generated employee ID.
    if (!insideEmployeeBlock) {
      insideEmployeeBlock = true;
      employeeID++;
    }

    // Add employee only once.
    if (!parsed_excel_data.employees.some((e) => e.employeeID === employeeID)) {
      parsed_excel_data.employees.push({
        employeeID,
        name,
      });
    }

    // Add job only once.
    const jobCode = getCellString(row.getCell(JOB_CODE_INDEX));
    if (!registered_jobs.has(jobCode)) {
      parsed_excel_data.jobs.push({
        job_code: jobCode,
        description: getCellString(row.getCell(DESCRIPTION_INDEX)),
        resource_bu: getCellString(row.getCell(RESOURCE_BU_INDEX)),
        business_unit: getCellString(row.getCell(BUSSINESS_UNIT_INDEX)),
        job_origin: getCellString(row.getCell(JOB_ORIGIN_INDEX)),
        reply_entity: getCellString(row.getCell(REPLY_ENTITY_INDEX)),
        customer: getCellString(row.getCell(CUSTOMER_INDEX)),
        t_code: getCellString(row.getCell(T_CODE_INDEX)),
      });

      registered_jobs.add(jobCode);
    }

    // Always add the current forecast row.
    parsed_excel_data.forecast_entries.push({
      name,
      job_code: jobCode,
      resource_allocation: getResourceAllocationArray(row),
      employeeID,
    });

    row = worksheet.getRow(++currentRow);
  }

  console.log(parsed_excel_data.forecast_entries[0].name);

  return parsed_excel_data;
}

/**
 * Safely converts a cell to string.
 * Returns "NULL" instead of undefined to simplify spreadsheet parsing logic.
 */
function getCellString(cell: Excel.Cell): string {
  const cell_string: string | undefined = cell.value?.toString();
  return cell_string === undefined ? "NULL" : cell_string;
}

/**
 * Reads the monthly allocation cells from a forecast row.
 */
function getResourceAllocationArray(row: Excel.Row): string[] {
  const [start, end] = RESOURCE_ALLOCATION_RANGE;
  const allocation = [];

  for (let col = start; col <= end; col++) {
    allocation.push(getCellString(row.getCell(col)));
  }

  return allocation;
}

/**
 * Reads HYPO/work day values from the spreadsheet heading row.
 * These are expected to be in row 19 in a format like "5/20".
 */
function getMonthAllocationDays(worksheet: Excel.Worksheet) {
  const start = RESOURCE_ALLOCATION_RANGE[0];
  const row = worksheet.getRow(19);
  const workDays: MonthAllocation[] = [];

  for (let col = start; col <= start + 12; col++) {
    const month = getCellString(row.getCell(col));
    const match = month.match(/(\d+)\/(\d+)/);

    if (!match) {
      workDays.push({ HYPO: null, work: null });
    } else {
      workDays.push({
        HYPO: Number(match[1]),
        work: Number(match[2]),
      });
    }
  }

  return {
    jan: workDays[0],
    feb: workDays[1],
    mar: workDays[2],
    apr: workDays[3],
    may: workDays[4],
    jun: workDays[5],
    jul: workDays[6],
    aug: workDays[7],
    sep: workDays[8],
    oct: workDays[9],
    nov: workDays[10],
    dec: workDays[11],
  };
}