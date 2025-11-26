import { Pool } from "pg";
import { ENV } from "../config/env";

if (!ENV.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
});

// Helper function for queries
export const query = (text: string, params?: any[]) => pool.query(text, params);
