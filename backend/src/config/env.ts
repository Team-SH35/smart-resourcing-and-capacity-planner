export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),

  SQLITE_PATH: process.env.SQLITE_PATH ?? "/database/hr.db",

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "https://localhost:5173",
};