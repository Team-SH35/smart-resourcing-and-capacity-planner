import { Router } from "express";
import { queryGet } from "../db/pool";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    // Simple DB check
    await queryGet("SELECT 1 as ok");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

export default router;
