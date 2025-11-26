import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
