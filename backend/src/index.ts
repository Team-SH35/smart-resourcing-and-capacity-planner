import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { test } from './excel-utils/excel_test'

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (_req, res) => {
  res.json({ message: "Backend API is running" });
});

const PORT = process.env.PORT || 4000;

test()

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});