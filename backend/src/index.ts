import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { ENV } from "./config/env";
import healthRouter from "./routes/health";
import specialismRouter from "./routes/specialisms";
import workspacesRouter from "./routes/workspaces";
import specialismsRouter from "./routes/specialisms";
import employeesRouter from "./routes/employees";
import jobsRouter from "./routes/jobs";
import forecastRouter from "./routes/forecast";
import scheduleRouter from "./routes/schedule";


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
app.use("/workspaces", workspacesRouter);
app.use("/specialisms", specialismsRouter);
app.use("/employees", employeesRouter);
app.use("/jobs", jobsRouter);
app.use("/forecast", forecastRouter);
app.use("/schedule", scheduleRouter);


app.listen(ENV.PORT, () => {
  console.log(`Backend listening on http://localhost:${ENV.PORT}`);
});
