import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ENV } from "./config/env";
import healthRouter from "./routes/health";
import specialismRouter from "./routes/specialisms";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

app.use("/health", healthRouter);
app.use("/specialisms", specialismRouter);

app.listen(ENV.PORT, () => {
  console.log(`Backend listening on http://localhost:${ENV.PORT}`);
});
