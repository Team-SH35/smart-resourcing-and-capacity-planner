import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { Readable } from "stream";

import {
  getEmployees,
  getJobCodes,
  getForecastEntries,
  getCalendarRows,
  createForecastEntry,
  updateForecastEntryDays,
  deleteForecastEntry,
  updateCost,
  updateBudget,
  updateTimeBudget,
  updateCurrencySymbol,
  updateStartTime,
  updateEndTime,
  addSpecialism,
  getBusinessUnits,
  createJob,
  deleteJob,
  getMonthWorkDays,
  upsertMonthWorkDays,
} from "../services/dataService";
import parseExcelInfo from "../excel-utils/parse_excel";
import { writeExcelToDB } from "../db/write_to_db";
import { exportDbExcel } from "../excel-utils/export_db_to_excel";

const router = Router();

// Multer handles uploaded files in memory so we can parse the Excel buffer directly.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Basic health endpoint used for simple backend checks.
router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Fetch all employees with their specialisms / AI exclusion flag.
router.get("/employees", (_req, res) => {
  try {
    res.json(getEmployees());
  } catch (error) {
    console.error("GET /api/employees failed:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Fetch all jobs.
router.get("/job-codes", (_req, res) => {
  try {
    res.json(getJobCodes());
  } catch (error) {
    console.error("GET /api/job-codes failed:", error);
    res.status(500).json({ error: "Failed to fetch job codes" });
  }
});

// Fetch all forecast entries flattened into month-specific rows.
router.get("/forecast-entries", (_req, res) => {
  try {
    res.json(getForecastEntries());
  } catch (error) {
    console.error("GET /api/forecast-entries failed:", error);
    res.status(500).json({ error: "Failed to fetch forecast entries" });
  }
});

// Exports current database to excel sheet and sends it to frontend
router.get("/export-excel-sheet", async (req, res) => {
  try {
    const { workspaceID } = req.body;

    // Validate input
    if (!workspaceID) {
      return res.status(400).json({ error: "workspaceID is required" });
    }

    // Generate the Excel workbook (assuming exportDbExcel returns a Promise<Workbook>)
    const workbook = await exportDbExcel(workspaceID);

    if (!workbook) {
      return res.status(404).json({ error: "Workbook could not be generated" });
    }

    // Set headers for Excel file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="forecast.xlsx"'
    );

    // Stream workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting Excel sheet:", error);
    res.status(500).json({ error: "An error occurred while exporting Excel sheet" });
  }
});

// Create a new forecast entry or a month allocation for an existing entry.
router.post("/forecast-entries", (req, res) => {
  try {
    const { employeeName, jobCode, days, month } = req.body;

    if (!employeeName || !jobCode) {
      return res.status(400).json({
        error: "employeeName and jobCode are required",
      });
    }

    const result = createForecastEntry({
      employeeName,
      jobCode,
      days,
      month,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create forecast entry";

    if (
      message.includes("not found") ||
      message.includes("already exists") ||
      message.includes("Invalid month")
    ) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to create forecast entry" });
  }
});

// Update the day value for an existing employee/job/month allocation.
router.patch("/forecast-entries", (req, res) => {
  try {
    const { employeeName, jobCode, month, days } = req.body;

    if (!employeeName || !jobCode || days === undefined || days === null) {
      return res.status(400).json({
        error: "employeeName, jobCode, and days are required",
      });
    }

    const result = updateForecastEntryDays({
      employeeName,
      jobCode,
      month,
      days,
    });

    return res.json(result);
  } catch (error) {
    console.error("PATCH /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update forecast entry";

    if (message.includes("not found") || message.includes("valid month")) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update forecast entry" });
  }
});

// Delete either a single month allocation or the whole forecast entry.
router.delete("/forecast-entries", (req, res) => {
  try {
    const { employeeName, jobCode, month } = req.body;

    if (!employeeName || !jobCode) {
      return res.status(400).json({
        error: "employeeName and jobCode are required",
      });
    }

    const result = deleteForecastEntry({
      employeeName,
      jobCode,
      month,
    });

    return res.json(result);
  } catch (error) {
    console.error("DELETE /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete forecast entry";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to delete forecast entry" });
  }
});

// Fetch jobs transformed into calendar rows/projects for the frontend calendar view.
router.get("/calendar", (_req, res) => {
  try {
    res.json(getCalendarRows());
  } catch (error) {
    console.error("GET /api/calendar failed:", error);
    res.status(500).json({ error: "Failed to fetch calendar data" });
  }
});

// Update forecast cost for a specific employee/job/workspace record.
router.post("/update-cost", (req, res) => {
  try {
    const { cost, employeeID, jobCode, workspaceID } = req.body;

    if (
      cost === undefined ||
      cost === null ||
      employeeID === undefined ||
      employeeID === null ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "cost, employeeID, jobCode and workspaceID are required",
      });
    }

    const result = updateCost({ cost, employeeID, jobCode, workspaceID });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-cost failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update job cost";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update forecast cost" });
  }
});

// Update job monetary budget.
router.post("/update-monetary-budget", (req, res) => {
  try {
    const { newBudget, jobCode, workspaceID } = req.body;

    if (
      newBudget === undefined ||
      newBudget === null ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "newBudget, workspaceID and jobCode are required",
      });
    }

    const result = updateBudget({ newBudget, jobCode, workspaceID });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-monetary-budget failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update budget";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update job budget" });
  }
});

// Update job time budget.
router.post("/update-time-budget", (req, res) => {
  try {
    const { timeBudget, jobCode, workspaceID } = req.body;

    if (
      timeBudget === undefined ||
      timeBudget === null ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "timeBudget, workspaceID and jobCode are required",
      });
    }

    const result = updateTimeBudget({ timeBudget, jobCode, workspaceID });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-time-budget failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update time budget";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update job time budget" });
  }
});

// Update job currency symbol.
router.post("/update-currency-symbol", (req, res) => {
  try {
    const { currencySymbol, jobCode, workspaceID } = req.body;

    if (
      !currencySymbol ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "currencySymbol, workspaceID and jobCode are required",
      });
    }

    if (currencySymbol.length !== 1) {
      return res.status(400).json({
        error: "currency symbol must have length 1",
      });
    }

    const result = updateCurrencySymbol({ currencySymbol, jobCode, workspaceID });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-currency-symbol failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update currency symbol";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update job currency symbol" });
  }
});

// Update job start date.
router.post("/update-start-date", (req, res) => {
  try {
    const { startDate, jobCode, workspaceID } = req.body;

    if (
      !startDate ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "startDate, workspaceID and jobCode are required",
      });
    }

    const parsedDate = new Date(startDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "startDate must be a valid date" });
    }

    const startDateISO = parsedDate.toISOString();
    const result = updateStartTime({ startDateISO, jobCode, workspaceID });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-start-date failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update start date";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update job start date" });
  }
});

// Update job end date.
router.post("/update-end-date", (req, res) => {
  try {
    const { endDate, jobCode, workspaceID } = req.body;

    if (
      !endDate ||
      !jobCode ||
      workspaceID === undefined ||
      workspaceID === null
    ) {
      return res.status(400).json({
        error: "endDate, workspaceID and jobCode are required",
      });
    }

    const parsedDate = new Date(endDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "endDate must be a valid date" });
    }

    const endDateISO = parsedDate.toISOString();
    const result = updateEndTime({
      startDateISO: endDateISO,
      jobCode,
      workspaceID,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/update-end-date failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update end date";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to update job end date" });
  }
});

// Add one or more specialisms to an employee.
router.post("/add-specialisms", (req, res) => {
  try {
    const { specialisms, employeeID } = req.body;

    if (!Array.isArray(specialisms) || specialisms.length === 0) {
      return res.status(400).json({
        error: "specialisms must be a non-empty array",
      });
    }

    if (employeeID === undefined || employeeID === null) {
      return res.status(400).json({
        error: "employeeID is required",
      });
    }

    const result = addSpecialism({ specialisms, employeeID });
    return res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/add-specialisms failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to add specialisms";

    if (message.includes("not found") || message.includes("already exists")) {
      return res.status(400).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to add specialisms" });
  }
});

// Return all distinct business units derived from the Job table.
router.get("/business-units", (_req, res) => {
  try {
    res.json(getBusinessUnits());
  } catch (error) {
    console.error("GET /api/business-units failed:", error);
    res.status(500).json({ error: "Failed to fetch business units" });
  }
});

// Create a new job/project.
router.post("/jobs", (req, res) => {
  try {
    const {
      jobCode,
      description,
      businessUnit,
      resourceBu,
      jobOrigin,
      replyEntity,
      customer,
      tCode,
      timeBudget,
      monetaryBudget,
      currencySymbol,
      startDate,
      finishDate,
      workspaceID,
    } = req.body;

    if (!jobCode) {
      return res.status(400).json({ error: "jobCode is required" });
    }

    if (workspaceID === undefined || workspaceID === null) {
      return res.status(400).json({ error: "workspaceID is required" });
    }

    if (startDate) {
      const parsed = new Date(startDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "startDate must be a valid date" });
      }
    }

    if (finishDate) {
      const parsed = new Date(finishDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: "finishDate must be a valid date" });
      }
    }

    if (currencySymbol && currencySymbol.length !== 1) {
      return res.status(400).json({ error: "currencySymbol must be a single character" });
    }

    const result = createJob({
      jobCode,
      description,
      businessUnit,
      resourceBu,
      jobOrigin,
      replyEntity,
      customer,
      tCode,
      timeBudget,
      monetaryBudget,
      currencySymbol,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      finishDate: finishDate ? new Date(finishDate).toISOString() : null,
      workspaceID,
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/jobs failed:", error);

    const message = error instanceof Error ? error.message : "Failed to create job";

    if (message.includes("already exists")) {
      return res.status(409).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to create job" });
  }
});

// Delete a job and its forecast entries.
router.delete("/jobs/:jobCode", (req, res) => {
  try {
    const { jobCode } = req.params;
    const { workspaceID } = req.body;

    if (workspaceID === undefined || workspaceID === null) {
      return res.status(400).json({ error: "workspaceID is required" });
    }

    const result = deleteJob(jobCode, workspaceID);
    return res.json(result);
  } catch (error) {
    console.error("DELETE /api/jobs/:jobCode failed:", error);

    const message = error instanceof Error ? error.message : "Failed to delete job";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    return res.status(500).json({ error: "Failed to delete job" });
  }
});

// Get month work/HYPO day counts for a workspace.
router.get("/month-work-days", (req, res) => {
  try {
    const workspaceIdRaw = req.query.workspaceId;

    if (!workspaceIdRaw) {
      return res.status(400).json({ error: "workspaceId query param is required" });
    }

    const workspaceID = Number(workspaceIdRaw);
    if (!Number.isInteger(workspaceID)) {
      return res.status(400).json({ error: "workspaceId must be an integer" });
    }

    const result = getMonthWorkDays(workspaceID);

    if (!result) {
      return res.status(404).json({ error: "No month work days found for this workspace" });
    }

    return res.json(result);
  } catch (error) {
    console.error("GET /api/month-work-days failed:", error);
    res.status(500).json({ error: "Failed to fetch month work days" });
  }
});

// Create or update month work/HYPO day counts for a workspace.
router.post("/month-work-days", (req, res) => {
  try {
    const {
      workspaceID,
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
      dec_work, dec_hypo,
    } = req.body;

    if (workspaceID === undefined || workspaceID === null) {
      return res.status(400).json({ error: "workspaceID is required" });
    }

    const months = [
      "jan_work", "jan_hypo", "feb_work", "feb_hypo",
      "mar_work", "mar_hypo", "apr_work", "apr_hypo",
      "may_work", "may_hypo", "jun_work", "jun_hypo",
      "jul_work", "jul_hypo", "aug_work", "aug_hypo",
      "sep_work", "sep_hypo", "oct_work", "oct_hypo",
      "nov_work", "nov_hypo", "dec_work", "dec_hypo",
    ];

    for (const field of months) {
      const val = req.body[field];
      if (val === undefined || val === null || typeof val !== "number" || val < 0) {
        return res.status(400).json({ error: `${field} must be a non-negative number` });
      }
    }

    const result = upsertMonthWorkDays({
      workspaceID,
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
      dec_work, dec_hypo,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("POST /api/month-work-days failed:", error);
    res.status(500).json({ error: "Failed to update month work days" });
  }
});

// Import an uploaded Excel workbook into the database.
router.post("/import-excel", upload.single("file"), async (req, res) => {
  try {
    const uploadedFile = req.file;
    const workspaceIdRaw = req.body.workspaceId;

    if (!uploadedFile) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    if (workspaceIdRaw === undefined || workspaceIdRaw === null || workspaceIdRaw === "") {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const workspaceId = Number(workspaceIdRaw);

    if (!Number.isInteger(workspaceId)) {
      return res.status(400).json({ error: "workspaceId must be an integer" });
    }

    // Basic extension + mimetype validation.
    if (!isExcelFile(uploadedFile.originalname, uploadedFile.mimetype)) {
      return res.status(400).json({
        error: "Uploaded file must be a valid Excel .xlsx file",
      });
    }

    // Parse the in-memory Excel file and persist it to the DB.
    const parsedExcelData = await parseExcelInfo(Readable.from(uploadedFile.buffer));
    writeExcelToDB(String(workspaceId), parsedExcelData);

    return res.status(201).json({
      message: "Excel file imported successfully",
      workspaceId,
      imported: {
        employees: parsedExcelData.employees.length,
        jobs: parsedExcelData.jobs.length,
        forecastEntries: parsedExcelData.forecast_entries.length,
      },
    });
  } catch (error) {
    console.error("POST /api/import-excel failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to import Excel file";

    // Common DB conflict case if records already exist.
    if (
      message.includes("UNIQUE constraint failed") ||
      message.includes("constraint failed")
    ) {
      return res.status(409).json({
        error:
          "Import failed because this workspace or some imported records already exist",
      });
    }

    // Multer file-size case.
    if (message.includes("File too large")) {
      return res.status(413).json({ error: "Uploaded file is too large" });
    }

    return res.status(500).json({ error: "Failed to import Excel file" });
  }
});

export default router;

/**
 * Very small helper for validating uploaded Excel files.
 * Checks both the file extension and a small set of expected mimetypes.
 */
function isExcelFile(filename: string, mimetype: string): boolean {
  const extension = path.extname(filename).toLowerCase();

  const allowedExtensions = new Set([".xlsx"]);
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ]);

  return allowedExtensions.has(extension) && allowedMimeTypes.has(mimetype);
}