import sqlite3 from "sqlite3";
import {open, Database } from "sqlite";
import { ENV } from "../config/env";

let db: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export async function getDb() {
  if (!db) {
    db = await open({
      filename: ENV.SQLITE_PATH,
      driver: sqlite3.Database,
    });
  }
  return db;
}

// Helper wrappers
export async function queryGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const database = await getDb();
  return database.get<T>(sql, params);
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();
  const rows = await database.all<T[]>(sql, params);
  return rows;
}


export async function execute(sql: string, params: any[] = []) {
  const database = await getDb();
  return database.run(sql, params)
}