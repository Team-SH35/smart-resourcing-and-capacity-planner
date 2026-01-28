import Excel from 'exceljs';
import fs from 'node:fs'

export interface parsedExcelInfo {
    name                    : string, 
    resource_bu             : string, 
    customer                : string, 
    reply_entity            : string, 
    bussiness_unit          : string,
    job_origin              : string,
    t_code                  : string,
    job_code                : string, 
    description             : string, 
    resource_allocation     : (string)[]
}


const NAME_INDEX                = 1;
const RESOURCE_BU_INDEX         = 2;
const CUSTOMER_INDEX            = 3;
const REPLY_ENTITY_INDEX        = 4;
const BUSSINESS_UNIT_INDEX      = 5;
const JOB_ORIGIN_INDEX          = 6;
const T_CODE                    = 8;
const JOB_CODE_INDEX            = 9;
const DESCRIPTION_INDEX         = 10;
const RESOURCE_ALLOCATION_RANGE = [11,17];


export default async function parseExcelInfo(excelFileStream: fs.ReadStream) : Promise<parsedExcelInfo[]> {
    
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(excelFileStream);
    const worksheet = workbook.worksheets[0];

    let currentRow = 20;
    let row = worksheet.getRow(20);

    let parsedExcelInfo: parsedExcelInfo[] = [];
    while (getCellString(row.getCell(2)) != "") {

        if (getCellString(row.getCell(2)).startsWith("TOTAL")) {
            row = worksheet.getRow(++currentRow);
            continue;
        }

        parsedExcelInfo.push({
            name                : getCellString(row.getCell(NAME_INDEX)),
            resource_bu         : getCellString(row.getCell(RESOURCE_BU_INDEX)),
            customer            : getCellString(row.getCell(CUSTOMER_INDEX)),
            reply_entity        : getCellString(row.getCell(REPLY_ENTITY_INDEX)),
            bussiness_unit      : getCellString(row.getCell(BUSSINESS_UNIT_INDEX)),
            job_origin          : getCellString(row.getCell(JOB_ORIGIN_INDEX)),
            t_code              : getCellString(row.getCell(T_CODE)),
            job_code            : getCellString(row.getCell(JOB_CODE_INDEX)),
            description         : getCellString(row.getCell(DESCRIPTION_INDEX)),
            resource_allocation : getResourceAllocationArray(row)
        });

        row = worksheet.getRow(++currentRow);
    } 

    return parsedExcelInfo;
}

// Returns an empty string if the value would be undefined
function getCellString(cell: Excel.Cell) : string {
    let cellString: string|undefined = cell.value?.toString();
    return cellString === undefined ? "" : cellString;
}

function getResourceAllocationArray(row: Excel.Row) : (string)[] {
    const [start, end] = RESOURCE_ALLOCATION_RANGE;
    const allocation = [];
    for (let col = start; col <= end; col++) {
        allocation.push(getCellString(row.getCell(col)));
    }
    return allocation;
}