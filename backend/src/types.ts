export interface Employee {
  name: string;
  specialisms: string[];
  excludedFromAI: boolean;
}

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

export interface CalendarProject {
  id: string;
  title: string;
  client: string;
  team: string;
  startDate: string;
  endDate: string;
  color: string;
}

export interface CalendarRow {
  rowId: string;
  team: string;
  projects: CalendarProject[];
}

export type ForecastEntry = {
  employeeName: string;
  customer: string;
  jobCode: string;
  description: string;
  days: number;
  cost: number | null;
  month: string;
};
