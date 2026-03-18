import { Router } from "express";
import {
    getEmployees,
    getJobCodes,
    getForecastEntries,
    getCalendarRows,
    createForecastEntry,
    updateForecastEntryDays,
    deleteForecastEntry,
} from "../services/dataService";

const router = Router();

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

router.get("/calendar", (_req, res) => {
    try {
        res.json(getCalendarRows());
    } catch (error) {
        console.error("GET /api/calendar failed:", error);
        res.status(500).json({ error: "Failed to fetch calendar data" });
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

    res.status(201).json(result);
  } catch (error) {
    console.error("POST /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create forecast entry";

    if (
      message.includes("not found") ||
      message.includes("already exists")
    ) {
      return res.status(400).json({ error: message });
    }

    res.status(500).json({ error: "Failed to create forecast entry" });
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

    res.json(result);
  } catch (error) {
    console.error("PATCH /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to update forecast entry";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    res.status(500).json({ error: "Failed to update forecast entry" });
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

    res.json(result);
  } catch (error) {
    console.error("DELETE /api/forecast-entries failed:", error);

    const message =
      error instanceof Error ? error.message : "Failed to delete forecast entry";

    if (message.includes("not found")) {
      return res.status(404).json({ error: message });
    }

    res.status(500).json({ error: "Failed to delete forecast entry" });
  }
});

export default router;