import { Router } from "express";
import {
    getEmployees,
    getJobCodes,
    getForecastEntries,
    getCalendarRows,
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

export default router;