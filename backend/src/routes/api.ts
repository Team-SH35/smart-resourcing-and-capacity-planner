import { Router } from "express";
import multer from "multer";
import path from "node:path";
import { Readable } from "stream"

import {
  getEmployees,
  getJobCodes,
  getForecastEntries,
  getCalendarRows,
  createForecastEntry,
  updateForecastEntryDays,
  deleteForecastEntry,
  updateCost,
} from "../services/dataService";
import parseExcelInfo from "../excel-utils/parse_excel";
import { writeExcelToDB } from "../db/write_to_db";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/employees", (_req, res) => {
  try {
    res.json(getEmployees());
  } catch (error) {
    console.error("GET /api/employees failed:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

router.get("/job-codes", (_req, res) => {
  try {
    res.json(getJobCodes());
  } catch (error) {
    console.error("GET /api/job-codes failed:", error);
    res.status(500).json({ error: "Failed to fetch job codes" });
  }
});

router.get("/forecast-entries", (_req, res) => {
  try {
    res.json(getForecastEntries());
  } catch (error) {
    console.error("GET /api/forecast-entries failed:", error);
    res.status(500).json({ error: "Failed to fetch forecast entries" });
  }
});

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


router.patch("/forecast-entries", (req, res) => {
  try {
    const { employeeName, jobCode, month, days } = req.body;

    if (!employeeName || !jobCode || days === undefined) {
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

router.get("/calendar", (_req, res) => {
  try {
    res.json(getCalendarRows());
  } catch (error) {
    console.error("GET /api/calendar failed:", error);
    res.status(500).json({ error: "Failed to fetch calendar data" });
  }
});

router.post("/update-cost", async (req, res) => {
  try {
    const { cost, jobCode, workspaceID } = req.body;

    if (!cost || !jobCode || workspaceID) {
      return res.status(400).json({
        error: "cost, workspaceID and jobCode are required",
      });
    }

    const result = updateCost({ cost, jobCode, workspaceID });

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

    return res.status(500).json({ error: "Failed to update job cost" });
  }
})

router.post("/import-excel", upload.single("file"), async (req, res) => {
  try {
    const uploadedFile = req.file;
    const workspaceIdRaw = req.body.workspaceId;

    if (!uploadedFile) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    if (!workspaceIdRaw) {
      return res.status(400).json({ error: "workspaceId is required" });
    }

    const workspaceId = Number(workspaceIdRaw);

    if (!Number.isInteger(workspaceId)) {
      return res.status(400).json({ error: "workspaceId must be an integer" });
    }

    if (!isExcelFile(uploadedFile.originalname, uploadedFile.mimetype)) {
      return res.status(400).json({
        error: "Uploaded file must be a valid Excel .xlsx file",
      });
    }

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

    if (
      message.includes("UNIQUE constraint failed") ||
      message.includes("constraint failed")
    ) {
      return res.status(409).json({
        error:
          "Import failed because this workspace or some imported records already exist",
      });
    }

    if (message.includes("File too large")) {
      return res.status(413).json({ error: "Uploaded file is too large" });
    }

    return res.status(500).json({ error: "Failed to import Excel file" });
  }
});

export default router;

function isExcelFile(filename: string, mimetype: string): boolean {
  const extension = path.extname(filename).toLowerCase();

  const allowedExtensions = new Set([".xlsx"]);
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
  ]);

  return allowedExtensions.has(extension) && allowedMimeTypes.has(mimetype);
}