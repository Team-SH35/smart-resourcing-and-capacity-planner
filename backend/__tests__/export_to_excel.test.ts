import { describe, it, beforeAll } from "@jest/globals"
import fs from "node:fs"
import parseExcelInfo from "../src/excel-utils/parse_excel"
import { writeExcelToDB } from "../src/db/write_to_db";
import { exportDbExcel } from '../src/excel-utils/export_db_to_excel'

describe("test that excelsheet works correctly", () => {
    beforeAll(async () => {
        const readStream = fs.createReadStream("__tests__/test_excel_data.xlsx");
        const excelData = await parseExcelInfo(readStream);
        await writeExcelToDB("123", excelData);
    });

  
    it("Tests if code successfully ", async () => {
        (await exportDbExcel("123"));  
    })
})
