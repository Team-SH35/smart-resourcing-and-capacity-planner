import { Router } from "express";
import { queryAll } from "../db/pool";

const router = Router();

// GET /schedule?workspaceID=1&month=2026-02-01
// Returns joined forecast rows: employee name + job description + days/cost.
// Filters are optional.

router.get("/", async (req, res) => {
  try {
    const workspaceID =
      typeof req.query.workspaceID === "string" ? Number(req.query.workspaceID) : undefined;
    const month = typeof req.query.month === "string" ? req.query.month : undefined;

    if (workspaceID !== undefined && Number.isNaN(workspaceID))
      return res.status(400).json({ error: "workspaceID must be a number" });

    const where: string[] = [];
    const params: any[] = [];

    if (workspaceID !== undefined) {
      where.push("f.workspaceID = ?");
      params.push(workspaceID);
    }
    if (month !== undefined) {
      where.push("f.Month = ?");
      params.push(month);
    }

    const sql = `
      SELECT
        f.EmployeeID AS employeeID,
        e.Name AS employeeName,
        f.JobCode AS jobCode,
        j.Description AS jobDescription,
        j.BusinessUnit AS businessUnit,
        f.Month AS month,
        f.Days AS days,
        f.Cost AS cost,
        f.OverBudget AS overBudget,
        f.workspaceID AS workspaceID
      FROM ForecastEntry f
      LEFT JOIN Employee e ON e.EmployeeID = f.EmployeeID
      LEFT JOIN Job j ON j.JobCode = f.JobCode
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY f.Month ASC, j.Description ASC, e.Name ASC
    `;

    const rows = await queryAll(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("GET /schedule failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
