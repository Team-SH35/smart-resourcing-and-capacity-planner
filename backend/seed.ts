import fs from "fs";
import parseExcelInfo from "./src/excel-utils/parse_excel";
import { writeExcelToDB } from "./src/db/write_to_db";

async function seed() {
  console.log("Seeding database...");
  const readStream = fs.createReadStream("__tests__/test_excel_data.xlsx");
  const excelData = await parseExcelInfo(readStream);
  writeExcelToDB("1", excelData);
  console.log("Done seeding!");
}

seed().catch(console.error);
