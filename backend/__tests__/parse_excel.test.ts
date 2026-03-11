import { expect, describe, it, beforeAll } from "@jest/globals"
import fs from "node:fs"
import parseExcelInfo from "../src/excel-utils/parse_excel"
import { ParsedExcelInfo } from "../src/excel-utils/parse_excel";

describe("Checks that all employee names are read correctly", () => {

  let excelData : ParsedExcelInfo;
  beforeAll(async () => {
    const readStream = fs.createReadStream("__tests__/test_excel_data.xlsx");
    excelData = await parseExcelInfo(readStream);
  });

  it("should read employee names correctly", () => {
    const employees = excelData.employees;
    expect(employees[0].name).toBe("BARKER, Reece");
    expect(employees[4].name).toBe("SLOAN, Elaine");
    expect(employees[34].name).toBe("BARNES, Alex");
  });

  it("should read forecast entries correctly", () => {
    const forecast_entries = excelData.forecast_entries;

    //Row 0 
    expect(forecast_entries[0].name).toBe("BARKER, Reece");
    expect(forecast_entries[0].job_code).toBe("C364-CWPUK-24-2-21");
    expect(forecast_entries[0].resource_allocation[0]).toBe("0");
    expect(forecast_entries[0].resource_allocation[1]).toBe("0");
    expect(forecast_entries[0].resource_allocation[2]).toBe("4");
    expect(forecast_entries[0].resource_allocation[3]).toBe("1");
    expect(forecast_entries[0].resource_allocation[4]).toBe("0");
    expect(forecast_entries[0].resource_allocation[5]).toBe("0");
    expect(forecast_entries[0].resource_allocation[6]).toBe("0");
    expect(forecast_entries[0].resource_allocation[7]).toBe("0");
    expect(forecast_entries[0].resource_allocation[8]).toBe("0");
    expect(forecast_entries[0].resource_allocation[9]).toBe("0");
    expect(forecast_entries[0].resource_allocation[10]).toBe("0");
    expect(forecast_entries[0].resource_allocation[11]).toBe("0");


    // Row 72
    expect(forecast_entries[38].name).toBe("PATTERSON, Darren");
    expect(forecast_entries[38].job_code).toBe("C364-CWPUK-23-4-9");
    expect(forecast_entries[38].resource_allocation[0]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[1]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[2]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[3]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[4]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[5]).toBe("0.5");
    expect(forecast_entries[38].resource_allocation[6]).toBe("0");
    expect(forecast_entries[38].resource_allocation[7]).toBe("0");
    expect(forecast_entries[38].resource_allocation[8]).toBe("0");
    expect(forecast_entries[38].resource_allocation[9]).toBe("0");
    expect(forecast_entries[38].resource_allocation[10]).toBe("0");
    expect(forecast_entries[38].resource_allocation[11]).toBe("1");
  });
});