import Excel from 'exceljs';
import parsedExcelInfo from './db/parsedExcelInfo';


const NAME_INDEX = 1;
const RESOURCE_BU_INDEX = 2;
const CUSTOMER_INDEX = 3;
const UNKNOWN_FIELD_INDEX = 7;
const JOB_CODE_INDEX = 8;
const DESCRIPTION_INDEX = 9;
const RESOURCE_ALLOCATION_RANGE = [10,16];



export default async function excelToJSON(excelFileBase64: string) {
    const excelFileBuffer = Buffer.from(excelFileBase64, 'base64');

    const workbook = new Excel.Workbook();
    //@ts-expect-error
    await workbook.xlsx.load(excelFileBuffer); //For some reason there is a type incompatibility here 
    const worksheet = workbook.worksheets[0];

    let currentRow = 20;
    let row = worksheet.getRow(20);

    //TODO: get proper stop condition
    let parsedExcelInfo: parsedExcelInfo[] = [];
    while (row.getCell(1).value != '') {

        parsedExcelInfo.push({
            name                : row.getCell(NAME_INDEX).value?.toString(),
            resource_bu         : row.getCell(RESOURCE_BU_INDEX).value?.toString(),
            customer            : row.getCell(CUSTOMER_INDEX).value?.toString(),
            unknown             : row.getCell(UNKNOWN_FIELD_INDEX).value?.toString,
            job_code            : row.getCell(JOB_CODE_INDEX).value?.toString(),
            description         : row.getCell(DESCRIPTION_INDEX).value?.toString(),
            resource_allocation : getResourceAllocationArray(row)
        });

        //TODO: get proper increment amount
        row = worksheet.getRow(++currentRow);
    } 

    return parsedExcelInfo;
}

function getResourceAllocationArray(row: Excel.Row) : (string | undefined)[] {
    const [start, end] = RESOURCE_ALLOCATION_RANGE;
    const allocation = [];
    for (let col = start; col <= end; col++) {
        allocation.push(row.getCell(col).value?.toString());
    }
    return allocation;
}