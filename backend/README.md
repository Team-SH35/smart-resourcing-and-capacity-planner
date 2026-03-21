# Backend

## Overview
This is the Express + TypeScript backend for the project. It provides API endpoints for managing employees, jobs, forecast data, and importing Excel files into the database.

## Tech Stack
- Node.js
- TypeScript
- Express
- SQLite (better-sqlite3)
- multer (file uploads)
- exceljs (Excel parsing)

## Core Features
- Employee and job data retrieval
- Forecast entry creation, update, and deletion
- Calendar data generation from jobs
- Update job metadata (budget, time, currency, dates)
- Update forecast costs
- Manage employee specialisms
- Import Excel data into the database
- Health check endpoint

## Running the Backend

Install dependencies:
```bash
npm install