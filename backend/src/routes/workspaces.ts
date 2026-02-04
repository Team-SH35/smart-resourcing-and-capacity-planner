import { Router } from "express";
import { queryAll, queryGet } from "../db/pool";

const router = Router();


// GET /workspaces

router.get("/", async (_req, res) => {
  try {
    const rows = await queryAll<{ workspaceID: number; createdDate: string }>(
      `SELECT workspaceID AS workspaceID, CreatedDate AS createdDate
       FROM Workspace
       ORDER BY workspaceID ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error("GET /workspaces failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /workspaces/:workspaceID

router.get("/:workspaceID", async (req, res) => {
  try {
    const workspaceID = Number(req.params.workspaceID);
    if (Number.isNaN(workspaceID)) return res.status(400).json({ error: "Invalid workspaceID" });

    const row = await queryGet<{ workspaceID: number; createdDate: string }>(
      `SELECT workspaceID AS workspaceID, CreatedDate AS createdDate
       FROM Workspace
       WHERE workspaceID = ?`,
      [workspaceID]
    );

    if (!row) return res.status(404).json({ error: "Workspace not found" });
    res.json(row);
  } catch (err) {
    console.error("GET /workspaces/:workspaceID failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
