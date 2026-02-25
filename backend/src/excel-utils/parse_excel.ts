import Excel from 'exceljs';
import fs from 'node:fs'


interface MonthAllocations {
    jan : MonthAllocation,
    feb : MonthAllocation,
    mar : MonthAllocation,
    apr : MonthAllocation,
    may : MonthAllocation,
    jun : MonthAllocation,
    jul : MonthAllocation,
    aug : MonthAllocation,
    sep : MonthAllocation,
    oct : MonthAllocation,
    nov : MonthAllocation,
    dec : MonthAllocation,
}

interface MonthAllocation {
    HYPO: number | null,
    work: number | null,
}
 
interface ForecastEntry {
    name                    : string, 
    job_code                : string, 
    resource_allocation     : (string)[]
}

interface Job {
    job_code      : string,
    description   : string,
    business_unit : string,
    resource_bu   : string,
    job_origin    : string,
    reply_entity  : string,
    customer      : string,
    t_code        : string,
}

interface Employee {
    name : string,
}

export interface ParsedExcelInfo {
    allocation_days     : MonthAllocations,
    employees           : Employee[],
    jobs                : Job[],
    forecast_entries    : ForecastEntry[]
}


const NAME_INDEX                = 1;
const RESOURCE_BU_INDEX         = 2;
const CUSTOMER_INDEX            = 3;
const REPLY_ENTITY_INDEX        = 4;
const BUSSINESS_UNIT_INDEX      = 5;
const JOB_ORIGIN_INDEX          = 6;
const T_CODE_INDEX              = 8;
const JOB_CODE_INDEX            = 9;
const DESCRIPTION_INDEX         = 10;
const RESOURCE_ALLOCATION_RANGE = [11,17];


export default async function parseExcelInfo(excelFileStream: fs.ReadStream) : Promise<ParsedExcelInfo> {
    
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(excelFileStream);
    const worksheet = workbook.worksheets[0];

    const parsed_excel_data: ParsedExcelInfo = {
        allocation_days     : getMonthAllocationDays(worksheet),
        employees           : [],
        forecast_entries    : [],
        jobs                : []
    };

    parsed_excel_data.allocation_days = getMonthAllocationDays(worksheet);

    
    // Row 20 is where the first row of forecast data is
    let currentRow = 20;
    let row = worksheet.getRow(currentRow);

    const registered_jobs = new Set<string>();
    const registered_employees = new Set<string>();

    while (getCellString(row.getCell(2)) != "") {

        // If at total then at end of current employee. Go to next line
        if (getCellString(row.getCell(2)).startsWith("TOTAL")) {
            row = worksheet.getRow(++currentRow);
            continue;
        }

        if (!registered_employees.has(getCellString(row.getCell(NAME_INDEX)))) {
            parsed_excel_data.employees.push({
                name: getCellString(row.getCell(NAME_INDEX))
            })
        }

        // If job has not appeared yet add it to jobs array
        if (!registered_jobs.has(getCellString(row.getCell(JOB_CODE_INDEX)))) {
            parsed_excel_data.jobs.push({
                job_code        : getCellString(row.getCell(JOB_CODE_INDEX)),
                description     : getCellString(row.getCell(DESCRIPTION_INDEX)),
                resource_bu     : getCellString(row.getCell(RESOURCE_BU_INDEX)),
                business_unit   : getCellString(row.getCell(BUSSINESS_UNIT_INDEX)),
                job_origin      : getCellString(row.getCell(JOB_ORIGIN_INDEX)),
                reply_entity    : getCellString(row.getCell(REPLY_ENTITY_INDEX)),
                customer        : getCellString(row.getCell(CUSTOMER_INDEX)),
                t_code          : getCellString(row.getCell(T_CODE_INDEX))
            });
        }

        parsed_excel_data.forecast_entries.push({
            name                : getCellString(row.getCell(NAME_INDEX)),
            job_code            : getCellString(row.getCell(JOB_CODE_INDEX)),
            resource_allocation : getResourceAllocationArray(row)
        });

        row = worksheet.getRow(++currentRow);
    } 

    return parsed_excel_data;
}

// Returns an empty string if the cell value would be undefined
function getCellString(cell: Excel.Cell) : string {
    const cell_string: string|undefined = cell.value?.toString();
    return cell_string === undefined ? "" : cell_string;
}

function getResourceAllocationArray(row: Excel.Row) : (string)[] {
    const [start, end] = RESOURCE_ALLOCATION_RANGE;
    const allocation = [];
    for (let col = start; col <= end; col++) {
        allocation.push(getCellString(row.getCell(col)));
    }
    return allocation;
}

// Reads HYPO and normal work days from heading of excel sheet
function getMonthAllocationDays(worksheet: Excel.Worksheet) {
    const [start, end] = RESOURCE_ALLOCATION_RANGE;

    const row = worksheet.getRow(19);
    const workDays: MonthAllocation[] = [];

    for (let col = start; col <= end; col++) {
        const month = getCellString(row.getCell(col));
        const match = month.match(/(\d+)\/(\d+)/);

        if (!match) {
            workDays.push({HYPO : null, work: null});
        } else {
            workDays.push({HYPO: Number(match[1]), work: Number(match[2])});
        }
    }
    return {
        jan : workDays[0],
        feb : workDays[1],
        mar : workDays[2],
        apr : workDays[3],
        may : workDays[4],
        jun : workDays[5],
        jul : workDays[6],
        aug : workDays[7],
        sep : workDays[8],
        oct : workDays[9],
        nov : workDays[10],
        dec : workDays[11],
    }
}
