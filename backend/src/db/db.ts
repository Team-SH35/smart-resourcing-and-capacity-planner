import Database from "better-sqlite3";

const dbPath = process.env.NODE_ENV === 'test'
    ? ':memory:'
    : "/database/hr.db"

export const db = new Database(dbPath);