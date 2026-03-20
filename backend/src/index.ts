import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ENV } from "./config/env";
import apiRouter from "./routes/api";

dotenv.config();

const app = express();

// Enable CORS so the frontend can call the backend from a different origin.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json());

// Simple root route for quickly testing whether the backend is alive.
app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

// Mount all API routes under /api.
app.use("/api", apiRouter);

// Start the server.
app.listen(ENV.PORT, () => {
  console.log(`Backend listening on http://localhost:${ENV.PORT}`);
});