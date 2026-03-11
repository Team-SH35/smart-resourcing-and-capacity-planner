import parseExcelInfo from "../src/excel-utils/parse_excel";
import fs from "node:fs";
import { test } from "@jest/globals"


test("Program reads in practice test", function() {
  const readStream = fs.createReadStream("../src/Forecast Anoymised.xlsx")

  parseExcelInfo(readStream);
})
