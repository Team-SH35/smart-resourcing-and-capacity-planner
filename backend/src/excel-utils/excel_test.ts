import parseExcelInfo from "./parse_excel"
import { writeExcelToDB } from '../db/write_to_db'
import fs from 'node:fs'

console.log("Reading excel")
const stream: fs.ReadStream = fs.createReadStream('src/excel-utils/Forecast Anonymised.xlsx');

export async function test() {
    console.log("Parsing Excel");
    const data = await parseExcelInfo(stream);
    console.log("Writing to database")
    writeExcelToDB("113", data);
}