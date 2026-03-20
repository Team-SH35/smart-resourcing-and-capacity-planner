import type { ChatResponse } from "../components/data/types";
import type {  JobCode, ForecastUpdateInput, ForecastDeleteInput } from "../components/data/types";
 
const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const AI_BASE = import.meta.env.VITE_AI_API_URL as string;
 
export async function getApiHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Backend health check failed: ${res.status}`);
  }
  return res.json();
}
 
export async function askChatbot(
  message: string,
  userId: string = "guest",
  sessionId?: string
) {
  const res = await fetch(`${AI_BASE}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userId, sessionId }),
  });
 
  if (!res.ok) {
    throw new Error(`AI service error: ${res.status}`);
  }
 
  return res.json() as Promise<ChatResponse>;
}
 
export async function approveChange(sessionId: string) {
  const res = await fetch(`${AI_BASE}/api/v1/approve-change/${sessionId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Approval failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}
 
export async function rejectChange(sessionId: string) {
  const res = await fetch(`${AI_BASE}/api/v1/reject-change/${sessionId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Rejection failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}

export async function undoChange(sessionId: string) {
  const res = await fetch(`${AI_BASE}/api/v1/undo-change/${sessionId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Undo failed: ${res.status}`);
  return res.json() as Promise<ChatResponse>;
}

export async function getBusinessUnits(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/job-codes`);
 
 
  if (!res.ok) {
    throw new Error(`Failed to fetch job codes: ${res.status}`);
  }
 
  const data: JobCode[] = await res.json();
 
  const units = Array.from(
    new Set(
      data
        .map((job) => job.businessUnit)
        .filter((unit): unit is string => Boolean(unit))
    )
  );
 
  return units;
}
 
export async function uploadExcel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("workspaceId", "1");
 
  const res = await fetch(`${API_BASE}/api/import-excel`, {
    method: "POST",
    body: formData,
  });
 
  const data = await res.json();
 
  if (!res.ok) {
    throw new Error(data.error || `Upload failed: ${res.status}`);
  }
 
  return data;
}
 
export async function getEmployees() {
  const res = await fetch(`${API_BASE}/api/employees`);
  if (!res.ok) {
    throw new Error(`Failed to fetch employees: ${res.status}`);
  }
  return res.json();
}
 
export async function getJobs() {
  const res = await fetch(`${API_BASE}/api/job-codes`);
  if (!res.ok) {
    throw new Error(`Failed to fetch job codes: ${res.status}`);
  }
  return res.json();
}
 
export async function getForecastEntries() {
  const res = await fetch(`${API_BASE}/api/forecast-entries`);
  if (!res.ok) {
    throw new Error(`Failed to fetch capacity forecast: ${res.status}`);
  }
  return res.json();
}
 
export async function updateForecast({
  employeeName,
  jobCode,
  month,
  days,
}: ForecastUpdateInput) {
  const res = await fetch(`${API_BASE}/api/forecast-entries`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeName, jobCode, month, days }),
  });
 
  if (!res.ok) throw new Error("Failed to update forecast");
 
  return res.json();
}
 
export async function deleteForecast({
  employeeName,
  jobCode,
  month,
}: ForecastDeleteInput) {
  const res = await fetch(`${API_BASE}/api/forecast-entries`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeName, jobCode, month }),
  });
 
  if (!res.ok) throw new Error("Failed to delete forecast");
 
  return res.json();
}
 
export async function createForecastEntry({
  employeeName,
  jobCode,
  month,
  days,
}: {
  employeeName: string;
  jobCode: string;
  month: string;
  days: number;
}) {
  const res = await fetch(`${API_BASE}/api/forecast-entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeName, jobCode, month, days }),
  });
 
  if (!res.ok) throw new Error("Failed to create forecast");
 
  return res.json();
}
 
export async function updateCost({
  cost,
  employeeID,
  jobCode,
  workspaceID,
}: {
  cost: number;
  employeeID: number;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cost, employeeID, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update cost");
  return res.json();
}
 
export async function updateStartDate({
  startDate,
  jobCode,
  workspaceID,
}: {
  startDate: string;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-start-date`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update start date");
  return res.json();
}
 
export async function updateEndDate({
  endDate,
  jobCode,
  workspaceID,
}: {
  endDate: string;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-end-date`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endDate, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update end date");
  return res.json();
}
 
export async function updateBudget({
  newBudget,
  jobCode,
  workspaceID,
}: {
  newBudget: number;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-monetary-budget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newBudget, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update budget");
  return res.json();
}
 
export async function updateTimeBudget({
  timeBudget,
  jobCode,
  workspaceID,
}: {
  timeBudget: number;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-time-budget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ timeBudget, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update time budget");
  return res.json();
}
 
export async function updateCurrencySymbol({
  currencySymbol,
  jobCode,
  workspaceID,
}: {
  currencySymbol: string;
  jobCode: string;
  workspaceID: number;
}) {
  const res = await fetch(`${API_BASE}/api/update-currency-symbol`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currencySymbol, jobCode, workspaceID }),
  });
 
  if (!res.ok) throw new Error("Failed to update currency symbol");
  return res.json();
}
 
export async function addSpecialism({
  specialisms,
  employeeID,
}: {
  specialisms: string[];
  employeeID: number;
}) {
  const res = await fetch(`${API_BASE}/api/add-specialisms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ specialisms, employeeID }),
  });
 
  if (!res.ok) throw new Error("Failed to add specialisms");
  return res.json();
}
 
