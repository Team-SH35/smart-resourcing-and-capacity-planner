import { Router } from "express";
import { queryAll } from "../db/pool";

const router = Router();

/**
 * GET /forecast
 * Optional filters:
 * - workspaceID (number)
 * - employeeID (number)
 * - jobCode (string)
 * - month (string, e.g. "2026-02-01" depending on DB format)
 */

router.get("/", async (req, res) => {
  try {
    const workspaceID =
      typeof req.query.workspaceID === "string" ? Number(req.query.workspaceID) : undefined;
    const employeeID =
      typeof req.query.employeeID === "string" ? Number(req.query.employeeID) : undefined;
    const jobCode = typeof req.query.jobCode === "string" ? req.query.jobCode : undefined;
    const month = typeof req.query.month === "string" ? req.query.month : undefined;

    if (workspaceID !== undefined && Number.isNaN(workspaceID))
      return res.status(400).json({ error: "workspaceID must be a number" });
    if (employeeID !== undefined && Number.isNaN(employeeID))
      return res.status(400).json({ error: "employeeID must be a number" });

    const where: string[] = [];
    const params: any[] = [];

    if (workspaceID !== undefined) {
      where.push("workspaceID = ?");
      params.push(workspaceID);
    }
    if (employeeID !== undefined) {
      where.push("EmployeeID = ?");
      params.push(employeeID);
    }
    if (jobCode !== undefined) {
      where.push("JobCode = ?");
      params.push(jobCode);
    }
    if (month !== undefined) {
      where.push("Month = ?");
      params.push(month);
    }

    const sql = `
      SELECT
        EmployeeID AS employeeID,
        JobCode AS jobCode,
        Days AS days,
        Month AS month,
        Cost AS cost,
        OverBudget AS overBudget,
        workspaceID AS workspaceID
      FROM ForecastEntry
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY Month ASC, JobCode ASC, EmployeeID ASC
    `;

    const rows = await queryAll(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /forecast failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
