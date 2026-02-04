import { Router } from "express";
import { queryAll } from "../db/pool";

const router = Router();

// GET /employees?workspaceID=1
// Returns employees optionally filtered by workspace
// Includes specialism name via LEFT JOIN (null if none)

router.get("/", async (req, res) => {
  try {
    const workspaceID =
      typeof req.query.workspaceID === "string" ? Number(req.query.workspaceID) : undefined;

    if (workspaceID !== undefined && Number.isNaN(workspaceID)) {
      return res.status(400).json({ error: "workspaceID must be a number" });
    }

    const sql = `
      SELECT
        e.EmployeeID AS employeeID,
        e.Name AS name,
        e.Specialism AS specialismId,
        s.Specialism AS specialism,
        e.Exclude_from_AI AS excludeFromAI,
        e.workspaceID AS workspaceID
      FROM Employee e
      LEFT JOIN EmployeeSpecialisms s ON s.Id = e.Specialism
      ${workspaceID !== undefined ? "WHERE e.workspaceID = ?" : ""}
      ORDER BY e.Name ASC
    `;

    const rows = await queryAll(sql, workspaceID !== undefined ? [workspaceID] : []);
    res.json(rows);
  } catch (err) {
    console.error("GET /employees failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /employees/:employeeID
router.get("/:employeeID", async (req, res) => {
  try {
    const employeeID = Number(req.params.employeeID);
    if (Number.isNaN(employeeID)) return res.status(400).json({ error: "Invalid employeeID" });

    const row = await queryGet(
      `
      SELECT
        e.EmployeeID AS employeeID,
        e.Name AS name,
        e.Specialism AS specialismId,
        s.Specialism AS specialism,
        e.Exclude_from_AI AS excludeFromAI,
        e.workspaceID AS workspaceID
      FROM Employee e
      LEFT JOIN EmployeeSpecialisms s ON s.Id = e.Specialism
      WHERE e.EmployeeID = ?
      `,
      [employeeID]
    );

    if (!row) return res.status(404).json({ error: "Employee not found" });
    res.json(row);
  } catch (err) {
    console.error("GET /employees/:employeeID failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;