process.env.NODE_ENV = "test";

import { describe, it, beforeAll } from "@jest/globals"
import fs from 'node:fs'
import parseExcelInfo from "../src/excel-utils/parse_excel";
import { writeExcelToDB } from "../src/db/write_to_db";
import { exportDbExcel } from '../src/excel-utils/export_db_to_excel'

describe("Test that excel sheet is returned correctly", () => {
    beforeAll( async () => {
        const readStream = fs.createReadStream("__tests__/test_excel_data.xlsx");
        const excelData = await parseExcelInfo(readStream);
        writeExcelToDB("123", excelData);
    })

    it("Create test excel sheet and check no exceptions occur", async () => {
        const workbook = await exportDbExcel("123");

        await workbook.xlsx.writeFile('./out.xlsx');
    })
})