// Frontend-facing employee structure.
export interface Employee {
  name: string;
  specialisms: string[];
  excludedFromAI: boolean;
}

// Frontend-facing job structure.
export interface JobCode {
  jobCode: string;
  description: string;
  customerName: string;
  businessUnit: string;

  budgetTime?: number | null;
  budgetCost?: number | null;
  budgetCostCurrency?: string | null;

  startDate: string;
  finishDate?: string | null;
}

// A single project block shown on the calendar UI.
export interface CalendarProject {
  id: string;
  title: string;
  client: string;
  team: string;
  startDate: string;
  endDate: string;
  color: string;
}

// A calendar row containing one team's projects.
export interface CalendarRow {
  rowId: string;
  team: string;
  projects: CalendarProject[];
}

// Flattened forecast-entry structure used by the frontend.
export type ForecastEntry = {
  employeeName: string;
  customer: string;
  jobCode: string;
  description: string;
  days: number;
  cost: number | null;
  month: string;
};