import Excel from 'exceljs'
import { db } from '../db/db'

const NAME_INDEX                = 1;
const RESOURCE_BU_INDEX         = 2;
const CUSTOMER_INDEX            = 3;
const REPLY_ENTITY_INDEX        = 4;
const BUSSINESS_UNIT_INDEX      = 5;
const JOB_ORIGIN_INDEX          = 6;
const T_CODE_INDEX              = 8;
const JOB_CODE_INDEX            = 9;
const DESCRIPTION_INDEX         = 10;

// Month Indicies
const JAN_MONTH_INDEX = 11
const FEB_MONTH_INDEX = 12
const MAR_MONTH_INDEX = 13
const APR_MONTH_INDEX = 14
const MAY_MONTH_INDEX = 15
const JUN_MONTH_INDEX = 16
const JUL_MONTH_INDEX = 17
const AUG_MONTH_INDEX = 18
const SEP_MONTH_INDEX = 19
const OCT_MONTH_INDEX = 20
const NOV_MONTH_INDEX = 21
const DEC_MONTH_INDEX = 22

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

interface MonthAllocation {
  HYPO: number | null;
  work: number | null;
}

export default async function exportToExcel(workspaceID : number) {
    const workbook = new Excel.Workbook();
    await workbook.xlsx.readFile("src/db/out_excel_sheet_template.xlsx");
    const worksheet = workbook.worksheets[0];
    
    let employee_start_row : number;
    let current_row = 20;
    
    const employeeRows = db.prepare("SELECT EmployeeID FROM Employee").all();
    const employeeIDs = (employeeRows as { EmployeeID: number }[]).map(row => row.EmployeeID);


    interface MonthAllocationRow {
    jan_work: number | null;
    jan_hypo: number | null;
    feb_work: number | null;
    feb_hypo: number | null;
    mar_work: number | null;
    mar_hypo: number | null;
    apr_work: number | null;
    apr_hypo: number | null;
    may_work: number | null;
    may_hypo: number | null;
    jun_work: number | null;
    jun_hypo: number | null;
    jul_work: number | null;
    jul_hypo: number | null;
    aug_work: number | null;
    aug_hypo: number | null;
    sep_work: number | null;
    sep_hypo: number | null;
    oct_work: number | null;
    oct_hypo: number | null;
    nov_work: number | null;
    nov_hypo: number | null;
    dec_work: number | null;
    dec_hypo: number | null;
    }

    const month_allocation_row = db
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
        WHERE workspaceID = ?
    `)
    .get(workspaceID) as MonthAllocationRow | undefined;

    if (!month_allocation_row) {
        throw new Error(`No month allocation found for workspace ${workspaceID}`);
    }

    const month_allocation: MonthAllocations = {
        jan: { work: month_allocation_row.jan_work, HYPO: month_allocation_row.jan_hypo },
        feb: { work: month_allocation_row.feb_work, HYPO: month_allocation_row.feb_hypo },
        mar: { work: month_allocation_row.mar_work, HYPO: month_allocation_row.mar_hypo },
        apr: { work: month_allocation_row.apr_work, HYPO: month_allocation_row.apr_hypo },
        may: { work: month_allocation_row.may_work, HYPO: month_allocation_row.may_hypo },
        jun: { work: month_allocation_row.jun_work, HYPO: month_allocation_row.jun_hypo },
        jul: { work: month_allocation_row.jul_work, HYPO: month_allocation_row.jul_hypo },
        aug: { work: month_allocation_row.aug_work, HYPO: month_allocation_row.aug_hypo },
        sep: { work: month_allocation_row.sep_work, HYPO: month_allocation_row.sep_hypo },
        oct: { work: month_allocation_row.oct_work, HYPO: month_allocation_row.oct_hypo },
        nov: { work: month_allocation_row.nov_work, HYPO: month_allocation_row.nov_hypo },
        dec: { work: month_allocation_row.dec_work, HYPO: month_allocation_row.dec_hypo },
    };
    

    const title_row  = worksheet.getRow(19);
    const year = new Date().getFullYear() - 2000;

    // Write hypo/ work days
    title_row.getCell(JAN_MONTH_INDEX).value = `'Jan-${year} ${month_allocation.jan.work}/${month_allocation.jan.HYPO}`;
    title_row.getCell(FEB_MONTH_INDEX).value = `'Feb-${year} ${month_allocation.feb.work}/${month_allocation.feb.HYPO}`;
    title_row.getCell(MAR_MONTH_INDEX).value = `'Mar-${year} ${month_allocation.mar.work}/${month_allocation.mar.HYPO}`;
    title_row.getCell(APR_MONTH_INDEX).value = `'Apr-${year} ${month_allocation.apr.work}/${month_allocation.apr.HYPO}`;
    title_row.getCell(MAY_MONTH_INDEX).value = `'May-${year} ${month_allocation.may.work}/${month_allocation.may.HYPO}`;
    title_row.getCell(JUN_MONTH_INDEX).value = `'Jun-${year} ${month_allocation.jun.work}/${month_allocation.jun.HYPO}`;
    title_row.getCell(JUL_MONTH_INDEX).value = `'Jul-${year} ${month_allocation.jul.work}/${month_allocation.jul.HYPO}`;
    title_row.getCell(AUG_MONTH_INDEX).value = `'Aug-${year} ${month_allocation.aug.work}/${month_allocation.aug.HYPO}`;
    title_row.getCell(SEP_MONTH_INDEX).value = `'Sep-${year} ${month_allocation.sep.work}/${month_allocation.sep.HYPO}`;
    title_row.getCell(OCT_MONTH_INDEX).value = `'Oct-${year} ${month_allocation.oct.work}/${month_allocation.oct.HYPO}`;
    title_row.getCell(NOV_MONTH_INDEX).value = `'Nov-${year} ${month_allocation.nov.work}/${month_allocation.nov.HYPO}`;
    title_row.getCell(DEC_MONTH_INDEX).value = `'Dec-${year} ${month_allocation.dec.work}/${month_allocation.dec.HYPO}`;

    for (let i = 0; i < employeeIDs.length; i++) {
        const row = worksheet.getRow(current_row);
        employee_start_row = current_row;
        const stmt = db.prepare(`
            SELECT 
            ForecastEntry.EmployeeID As EmployeeID,
            Employee.Name As Name,
            Job.ResourceBu As ResourceBu,
            Job.Description As Description,
            Job.t_code As t_code,
            Job.ReplyEntity As ReplyEntity,
            Job.Customer As Customer,
            Job.BusinessUnit As BusinessUnit,
            Job.JobOrigin As JobOrigin,
            ForecastEntry.JobCode As JobCode, 
            ForecastEntry.days_allocated_jan,
            ForecastEntry.days_allocated_feb, 
            ForecastEntry.days_allocated_mar, 
            ForecastEntry.days_allocated_apr, 
            ForecastEntry.days_allocated_may, 
            ForecastEntry.days_allocated_jun, 
            ForecastEntry.days_allocated_jul, 
            ForecastEntry.days_allocated_aug, 
            ForecastEntry.days_allocated_sep, 
            ForecastEntry.days_allocated_oct, 
            ForecastEntry.days_allocated_nov, 
            ForecastEntry.days_allocated_dec
            FROM ForecastEntry
            INNER JOIN Job ON Job.JobCode = ForecastEntry.JobCode
            INNER JOIN Employee ON Employee.EmployeeID = ForecastEntry.EmployeeID
            WHERE ForecastEntry.EmployeeID = ? AND ForecastEntry.WorkspaceID = ?
        `);

            const forecast_entries = stmt.all(employeeIDs[i], workspaceID) as {
                EmployeeID         : number,
                Name               : string,
                ResourceBu         : string,
                Description        : string,
                t_code             : string,
                ReplyEntity        : string,
                Customer           : string,
                BusinessUnit       : string,
                JobOrigin          : string,
                JobCode            : string,
                days_allocated_jan : number,
                days_allocated_feb : number,
                days_allocated_mar : number,
                days_allocated_apr : number,
                days_allocated_may : number,
                days_allocated_jun : number,
                days_allocated_jul : number,
                days_allocated_aug : number,
                days_allocated_sep : number,
                days_allocated_oct : number,
                days_allocated_nov : number,
                days_allocated_dec : number,
            }[];

        for (let forecast_index = 0; forecast_index < forecast_entries.length; forecast_index++) {
            row.getCell(NAME_INDEX).value = forecast_entries[forecast_index].Name;
            row.getCell(RESOURCE_BU_INDEX).value = forecast_entries[forecast_index].ResourceBu;
            row.getCell(CUSTOMER_INDEX).value = forecast_entries[forecast_index].Customer;
            row.getCell(REPLY_ENTITY_INDEX).value = forecast_entries[forecast_index].ReplyEntity;
            row.getCell(BUSSINESS_UNIT_INDEX).value = forecast_entries[forecast_index].BusinessUnit;
            row.getCell(JOB_CODE_INDEX).value = forecast_entries[forecast_index].JobCode;
            row.getCell(JOB_ORIGIN_INDEX).value = forecast_entries[forecast_index].JobOrigin;
            row.getCell(T_CODE_INDEX).value = forecast_entries[forecast_index].t_code;
            row.getCell(DESCRIPTION_INDEX).value = forecast_entries[forecast_index].Description;

            row.getCell(JAN_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_jan;
            row.getCell(FEB_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_feb;
            row.getCell(MAR_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_mar;
            row.getCell(APR_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_apr;
            row.getCell(MAY_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_may;
            row.getCell(JUN_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_jun;
            row.getCell(JUL_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_jul;
            row.getCell(AUG_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_aug;
            row.getCell(SEP_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_sep;
            row.getCell(OCT_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_oct;
            row.getCell(NOV_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_nov;
            row.getCell(DEC_MONTH_INDEX).value = forecast_entries[forecast_index].days_allocated_dec;

            current_row++;
        }

        worksheet.mergeCells(`B${current_row}:J${current_row}`)
        row.getCell(2).value = `TOTAL - ${forecast_entries[0].Name}`
        row.getCell(2).fill = {type:'pattern', pattern:'solid', fgColor:{argb: '#508cd4'}}

        // Total allocation days for each month
        row.getCell(JAN_MONTH_INDEX).value = { formula : `SUM(K${employee_start_row}:K${current_row-1})`}
        row.getCell(FEB_MONTH_INDEX).value = { formula : `SUM(L${employee_start_row}:L${current_row-1})`}
        row.getCell(MAR_MONTH_INDEX).value = { formula : `SUM(M${employee_start_row}:M${current_row-1})`}
        row.getCell(APR_MONTH_INDEX).value = { formula : `SUM(N${employee_start_row}:N${current_row-1})`}
        row.getCell(MAY_MONTH_INDEX).value = { formula : `SUM(O${employee_start_row}:O${current_row-1})`}
        row.getCell(JUN_MONTH_INDEX).value = { formula : `SUM(P${employee_start_row}:P${current_row-1})`}
        row.getCell(JUL_MONTH_INDEX).value = { formula : `SUM(Q${employee_start_row}:Q${current_row-1})`}
        row.getCell(AUG_MONTH_INDEX).value = { formula : `SUM(R${employee_start_row}:R${current_row-1})`}
        row.getCell(SEP_MONTH_INDEX).value = { formula : `SUM(S${employee_start_row}:S${current_row-1})`}
        row.getCell(OCT_MONTH_INDEX).value = { formula : `SUM(T${employee_start_row}:T${current_row-1})`}
        row.getCell(NOV_MONTH_INDEX).value = { formula : `SUM(U${employee_start_row}:U${current_row-1})`}
        row.getCell(DEC_MONTH_INDEX).value = { formula : `SUM(V${employee_start_row}:V${current_row-1})`}

        current_row++;
    }
}