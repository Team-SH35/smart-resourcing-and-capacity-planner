import { Router } from "express";
import { queryAll, queryGet } from "../db/pool";

const router = Router();


//GET /jobs?workspaceID=1

router.get("/", async (req, res) => {
  try {
    const workspaceID =
      typeof req.query.workspaceID === "string" ? Number(req.query.workspaceID) : undefined;

    if (workspaceID !== undefined && Number.isNaN(workspaceID)) {
      return res.status(400).json({ error: "workspaceID must be a number" });
    }

    const sql = `
      SELECT
        JobCode AS jobCode,
        Description AS description,
        BusinessUnit AS businessUnit,
        TimeBudget AS timeBudget,
        CurrencySymbol AS currencySymbol,
        MonetaryBudget AS monetaryBudget,
        StartDate AS startDate,
        FinishDate AS finishDate,
        workspaceID AS workspaceID
      FROM Job
      ${workspaceID !== undefined ? "WHERE workspaceID = ?" : ""}
      ORDER BY StartDate ASC
    `;

    const rows = await queryAll(sql, workspaceID !== undefined ? [workspaceID] : []);
    res.json(rows);
  } catch (err) {
    console.error("GET /jobs failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /jobs/:jobCode

router.get("/:jobCode", async (req, res) => {
  try {
    const jobCode = req.params.jobCode;

    const row = await queryGet(
      `
      SELECT
        JobCode AS jobCode,
        Description AS description,
        BusinessUnit AS businessUnit,
        TimeBudget AS timeBudget,
        CurrencySymbol AS currencySymbol,
        MonetaryBudget AS monetaryBudget,
        StartDate AS startDate,
        FinishDate AS finishDate,
        workspaceID AS workspaceID
      FROM Job
      WHERE JobCode = ?
      `,
      [jobCode]
    );

    if (!row) return res.status(404).json({ error: "Job not found" });
    res.json(row);
  } catch (err) {
    console.error("GET /jobs/:jobCode failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
