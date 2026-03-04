import Database from "better-sqlite3";
const DATABASE_PATH = "/database/hr.db";

export const db = new Database(DATABASE_PATH);