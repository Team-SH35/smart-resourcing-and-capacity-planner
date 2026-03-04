import { employees } from "../data/employees";
import { forecastEntries } from "../data/forecastEntries";
import { jobCodes } from "../data/jobCodes";

export function getEmployeesByBusinessUnit(businessUnit: string) {
  // Get all jobCodes in this business unit
  const unitJobCodes = jobCodes
    .filter((job) => job.businessUnit === businessUnit)
    .map((job) => job.jobCode);

  // Find employees who have forecast entries in these jobCodes
  const unitEmployeeNames = new Set(
    forecastEntries
      .filter((entry) => unitJobCodes.includes(entry.jobCode))
      .map((entry) => entry.employeeName)
  );

  // Return employee objects
  return employees.filter((emp) => unitEmployeeNames.has(emp.name));
}