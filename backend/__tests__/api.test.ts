process.env.NODE_ENV = "test";

import { describe, it, expect, beforeAll } from "@jest/globals";
import express from "express";
import request from "supertest";
import db from "../src/db/db";
import apiRouter from "../src/routes/api";

// ---------------------------------------------------------------------------
// Minimal Express app — no listen(), just middleware + router
// ---------------------------------------------------------------------------
const app = express();
app.use(express.json());
app.use("/api", apiRouter);

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------
const WORKSPACE_ID = 1;
const JOB_CODE = "TEST-001";
const JOB_CODE_2 = "TEST-002"; // used by delete test
const EMPLOYEE_NAME = "SMITH, John";
const EMPLOYEE_NAME_2 = "JONES, Alice";

function seedAll() {
  db.exec(`INSERT OR IGNORE INTO Workspace (WorkspaceID) VALUES (${WORKSPACE_ID})`);

  db.exec(`
    INSERT OR IGNORE INTO Employee (EmployeeID, Name, ExcludeFromAI, WorkspaceID)
    VALUES
      (1, '${EMPLOYEE_NAME}', 0, ${WORKSPACE_ID}),
      (2, '${EMPLOYEE_NAME_2}', 0, ${WORKSPACE_ID})
  `);

  db.exec(`
    INSERT OR IGNORE INTO Job
      (JobCode, Description, BusinessUnit, ResourceBu, JobOrigin, ReplyEntity,
       customer, t_code, TimeBudget, CurrencySymbol, MonetaryBudget, Cost,
       StartDate, FinishDate, WorkspaceID)
    VALUES
      ('${JOB_CODE}', 'Test Job One', 'Engineering', 'RBU', 'Origin', 'Entity',
       'Acme', 'TC01', 100, '$', 50000, 0,
       '2024-01-01T00:00:00.000Z', '2024-12-31T00:00:00.000Z', ${WORKSPACE_ID}),
      ('${JOB_CODE_2}', 'Test Job Two', 'Finance', 'RBU2', 'Origin2', 'Entity2',
       'Beta', 'TC02', 50, '£', 25000, 0,
       '2024-01-01T00:00:00.000Z', NULL, ${WORKSPACE_ID})
  `);

  db.exec(`
    INSERT OR IGNORE INTO ForecastEntry
      (EmployeeID, JobCode, Cost, Days, WorkspaceID,
       Days_allocated_jan, Days_allocated_feb, Days_allocated_mar,
       Days_allocated_apr, Days_allocated_may, Days_allocated_jun,
       Days_allocated_jul, Days_allocated_aug, Days_allocated_sep,
       Days_allocated_oct, Days_allocated_nov, Days_allocated_dec)
    VALUES
      (1, '${JOB_CODE}', 1000, 5, ${WORKSPACE_ID},
       5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
  `);

  db.exec(`
    INSERT OR REPLACE INTO Month_Work_Days
      (WorkspaceID,
       jan_work, jan_hypo, feb_work, feb_hypo, mar_work, mar_hypo,
       apr_work, apr_hypo, may_work, may_hypo, jun_work, jun_hypo,
       jul_work, jul_hypo, aug_work, aug_hypo, sep_work, sep_hypo,
       oct_work, oct_hypo, nov_work, nov_hypo, dec_work, dec_hypo)
    VALUES
      (${WORKSPACE_ID},
       20, 2, 18, 2, 21, 2, 20, 2, 21, 2, 20, 2,
       23, 2, 21, 2, 20, 2, 23, 2, 20, 2, 17, 2)
  `);
}

beforeAll(() => {
  seedAll();
});

// ===========================================================================
// GET /api/health
// ===========================================================================
describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

// ===========================================================================
// GET /api/employees
// ===========================================================================
describe("GET /api/employees", () => {
  it("returns 200 with an array of employees", async () => {
    const res = await request(app).get("/api/employees");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("each employee has name, specialisms, and excludedFromAI fields", async () => {
    const res = await request(app).get("/api/employees");
    const employee = res.body[0];
    expect(employee).toHaveProperty("name");
    expect(employee).toHaveProperty("specialisms");
    expect(employee).toHaveProperty("excludedFromAI");
    expect(Array.isArray(employee.specialisms)).toBe(true);
  });
});

// ===========================================================================
// GET /api/job-codes
// ===========================================================================
describe("GET /api/job-codes", () => {
  it("returns 200 with an array of jobs", async () => {
    const res = await request(app).get("/api/job-codes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("each job has jobCode and description fields", async () => {
    const res = await request(app).get("/api/job-codes");
    const job = res.body[0];
    expect(job).toHaveProperty("jobCode");
    expect(job).toHaveProperty("description");
  });
});

// ===========================================================================
// GET /api/forecast-entries
// ===========================================================================
describe("GET /api/forecast-entries", () => {
  it("returns 200 with an array of forecast entries", async () => {
    const res = await request(app).get("/api/forecast-entries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ===========================================================================
// GET /api/calendar
// ===========================================================================
describe("GET /api/calendar", () => {
  it("returns 200 with an array", async () => {
    const res = await request(app).get("/api/calendar");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ===========================================================================
// GET /api/business-units
// ===========================================================================
describe("GET /api/business-units", () => {
  it("returns 200 with an array of business units", async () => {
    const res = await request(app).get("/api/business-units");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain("Engineering");
  });
});

// ===========================================================================
// GET /api/month-work-days
// ===========================================================================
describe("GET /api/month-work-days", () => {
  it("returns 200 with work day data for a valid workspace", async () => {
    const res = await request(app)
      .get("/api/month-work-days")
      .query({ workspaceId: WORKSPACE_ID });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("jan_work");
    expect(res.body).toHaveProperty("jan_hypo");
  });

  it("returns 400 when workspaceId is missing", async () => {
    const res = await request(app).get("/api/month-work-days");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 for a workspace with no work day data", async () => {
    const res = await request(app)
      .get("/api/month-work-days")
      .query({ workspaceId: 9999 });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// GET /api/export-excel-sheet
// ===========================================================================
describe("GET /api/export-excel-sheet", () => {
  it("returns 400 when workspaceId is missing", async () => {
    const res = await request(app).get("/api/export-excel-sheet");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns an xlsx file for a valid workspaceId", async () => {
    const res = await request(app)
      .get("/api/export-excel-sheet")
      .query({ workspaceId: WORKSPACE_ID });
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/spreadsheetml/);
  });
});

// ===========================================================================
// POST /api/jobs
// ===========================================================================
describe("POST /api/jobs", () => {
  it("returns 400 when jobCode is missing", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ workspaceID: WORKSPACE_ID, description: "Missing code" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jobCode/);
  });

  it("returns 400 when workspaceID is missing", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ jobCode: "NEW-001", description: "No workspace" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workspaceID/);
  });

  it("returns 400 for an invalid startDate", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ jobCode: "NEW-002", workspaceID: WORKSPACE_ID, startDate: "not-a-date" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/startDate/);
  });

  it("returns 400 for a currencySymbol longer than 1 character", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ jobCode: "NEW-003", workspaceID: WORKSPACE_ID, currencySymbol: "USD" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/currencySymbol/);
  });

  it("creates a new job and returns 201", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({
        jobCode: "NEW-004",
        description: "New test job",
        businessUnit: "Engineering",
        workspaceID: WORKSPACE_ID,
        startDate: "2024-03-01",
      });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("jobCode", "NEW-004");
  });

  it("returns 409 when creating a duplicate job", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .send({ jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/);
  });
});

// ===========================================================================
// DELETE /api/jobs/:jobCode
// ===========================================================================
describe("DELETE /api/jobs/:jobCode", () => {
  it("returns 400 when workspaceID is missing from body", async () => {
    const res = await request(app).delete(`/api/jobs/${JOB_CODE_2}`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workspaceID/);
  });

  it("returns 404 for a non-existent job", async () => {
    const res = await request(app)
      .delete("/api/jobs/DOES-NOT-EXIST")
      .send({ workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(404);
  });

  it("deletes an existing job and returns 200", async () => {
    const res = await request(app)
      .delete(`/api/jobs/${JOB_CODE_2}`)
      .send({ workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("jobCode", JOB_CODE_2);
  });
});

// ===========================================================================
// POST /api/forecast-entries
// ===========================================================================
describe("POST /api/forecast-entries", () => {
  it("returns 400 when employeeName is missing", async () => {
    const res = await request(app)
      .post("/api/forecast-entries")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/employeeName/);
  });

  it("returns 400 when jobCode is missing", async () => {
    const res = await request(app)
      .post("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jobCode/);
  });

  it("returns 400 for a non-existent employee", async () => {
    const res = await request(app)
      .post("/api/forecast-entries")
      .send({ employeeName: "NOBODY, Fake", jobCode: JOB_CODE });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/);
  });

  it("returns 400 for a non-existent job", async () => {
    const res = await request(app)
      .post("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME, jobCode: "NO-JOB" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/);
  });

  it("creates a new forecast entry for employee 2 and returns 201", async () => {
    const res = await request(app)
      .post("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME_2, jobCode: JOB_CODE, days: 3 });
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// PATCH /api/forecast-entries
// ===========================================================================
describe("PATCH /api/forecast-entries", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .patch("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("updates days on an existing forecast entry", async () => {
    const res = await request(app)
      .patch("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME, jobCode: JOB_CODE, days: 10, month: "jan" });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// DELETE /api/forecast-entries
// ===========================================================================
describe("DELETE /api/forecast-entries", () => {
  it("returns 400 when employeeName is missing", async () => {
    const res = await request(app)
      .delete("/api/forecast-entries")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/employeeName/);
  });

  it("returns 404 for an entry that does not exist", async () => {
    const res = await request(app)
      .delete("/api/forecast-entries")
      .send({ employeeName: "NOBODY, Fake", jobCode: JOB_CODE });
    expect(res.status).toBe(404);
  });

  it("deletes an existing forecast entry", async () => {
    const res = await request(app)
      .delete("/api/forecast-entries")
      .send({ employeeName: EMPLOYEE_NAME_2, jobCode: JOB_CODE });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/add-specialisms
// ===========================================================================
describe("POST /api/add-specialisms", () => {
  it("returns 400 when specialisms is not an array", async () => {
    const res = await request(app)
      .post("/api/add-specialisms")
      .send({ employeeName: EMPLOYEE_NAME, specialisms: "Structural" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/non-empty array/);
  });

  it("returns 400 when specialisms is an empty array", async () => {
    const res = await request(app)
      .post("/api/add-specialisms")
      .send({ employeeName: EMPLOYEE_NAME, specialisms: [] });
    expect(res.status).toBe(400);
  });

  it("returns 400 when employeeName is missing", async () => {
    const res = await request(app)
      .post("/api/add-specialisms")
      .send({ specialisms: ["Civil Engineering"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/employeeName/);
  });

  it("returns 400 for a non-existent employee", async () => {
    const res = await request(app)
      .post("/api/add-specialisms")
      .send({ employeeName: "NOBODY, Fake", specialisms: ["Civil"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/);
  });

  it("adds specialisms to an employee and returns 201", async () => {
    const res = await request(app)
      .post("/api/add-specialisms")
      .send({ employeeName: EMPLOYEE_NAME, specialisms: ["Structural Engineering"] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("employeeName", EMPLOYEE_NAME);
    expect(res.body).toHaveProperty("added", 1);
  });
});

// ===========================================================================
// POST /api/update-cost
// ===========================================================================
describe("POST /api/update-cost", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-cost")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("updates cost and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-cost")
      .send({ cost: 2000, employeeID: 1, jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/update-monetary-budget
// ===========================================================================
describe("POST /api/update-monetary-budget", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-monetary-budget")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
  });

  it("updates monetary budget and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-monetary-budget")
      .send({ newBudget: 75000, jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/update-time-budget
// ===========================================================================
describe("POST /api/update-time-budget", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-time-budget")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
  });

  it("updates time budget and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-time-budget")
      .send({ timeBudget: 200, jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/update-currency-symbol
// ===========================================================================
describe("POST /api/update-currency-symbol", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-currency-symbol")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
  });

  it("returns 400 when currencySymbol is more than 1 character", async () => {
    const res = await request(app)
      .post("/api/update-currency-symbol")
      .send({ currencySymbol: "USD", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/length 1/);
  });

  it("updates currency symbol and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-currency-symbol")
      .send({ currencySymbol: "€", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/update-start-date
// ===========================================================================
describe("POST /api/update-start-date", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-start-date")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid date", async () => {
    const res = await request(app)
      .post("/api/update-start-date")
      .send({ startDate: "not-a-date", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid date/);
  });

  it("updates start date and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-start-date")
      .send({ startDate: "2024-06-01", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/update-end-date
// ===========================================================================
describe("POST /api/update-end-date", () => {
  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/update-end-date")
      .send({ jobCode: JOB_CODE });
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid date", async () => {
    const res = await request(app)
      .post("/api/update-end-date")
      .send({ endDate: "not-a-date", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid date/);
  });

  it("updates end date and returns 200", async () => {
    const res = await request(app)
      .post("/api/update-end-date")
      .send({ endDate: "2025-01-01", jobCode: JOB_CODE, workspaceID: WORKSPACE_ID });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// POST /api/month-work-days
// ===========================================================================
const validMonthWorkDays = {
  workspaceID: WORKSPACE_ID,
  jan_work: 20, jan_hypo: 2,
  feb_work: 18, feb_hypo: 2,
  mar_work: 21, mar_hypo: 2,
  apr_work: 20, apr_hypo: 2,
  may_work: 21, may_hypo: 2,
  jun_work: 20, jun_hypo: 2,
  jul_work: 23, jul_hypo: 2,
  aug_work: 21, aug_hypo: 2,
  sep_work: 20, sep_hypo: 2,
  oct_work: 23, oct_hypo: 2,
  nov_work: 20, nov_hypo: 2,
  dec_work: 17, dec_hypo: 2,
};

describe("POST /api/month-work-days", () => {
  it("returns 400 when workspaceID is missing", async () => {
    const res = await request(app)
      .post("/api/month-work-days")
      .send({ jan_work: 20 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/workspaceID/);
  });

  it("returns 400 when a month field is missing", async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { jan_work, ...incomplete } = validMonthWorkDays;
    const res = await request(app)
      .post("/api/month-work-days")
      .send(incomplete);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jan_work/);
  });

  it("returns 400 when a month field is negative", async () => {
    const res = await request(app)
      .post("/api/month-work-days")
      .send({ ...validMonthWorkDays, jan_work: -1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/jan_work/);
  });

  it("upserts month work days and returns 200", async () => {
    const res = await request(app)
      .post("/api/month-work-days")
      .send(validMonthWorkDays);
    expect(res.status).toBe(200);
  });
});
