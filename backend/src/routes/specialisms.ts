import { Router } from "express";
import { queryAll, queryGet } from "../db/pool";

const router = Router();

// GET /speialisms
// Returns all employee specialisms
router.get("/", async (_req, res) => {
    try {
        const countRow = await queryGet<{ count: number }>(
            `SELECT COUNT(*) as count FROM EmployeeSpecialisms`
        );

        console.log("EmployeeSpecialisms count:", countRow?.count);

        const rows = await queryAll<{ id: number; specialism: string }>(
            `SELECT Id as id, Specialism as specialism
            FROM EmployeeSpecialisms
            ORDER BY Specialism ASC`
        );

        res.json(rows);
    } catch (err) {
        console.error("GET /specialisms failed:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router