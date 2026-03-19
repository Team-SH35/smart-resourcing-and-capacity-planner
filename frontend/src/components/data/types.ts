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

export type ProposedChange = {
  id: string;
  type: string;
  description: string;
  data: Record<string, unknown>;
  status: string;
};

export type ChatResponse = {
  response: string;
  sessionId: string;
  proposed_changes: ProposedChange[];
};

export type ForecastEntry = {
  employeeName: string;
  customer: string;
  jobCode: string;
  description: string;
  days: number;
  cost: number | null;
  month: string;
};
