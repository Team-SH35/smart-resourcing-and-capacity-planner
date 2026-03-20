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

  const res = await fetch(`${API_BASE}/api/import-excel`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();
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
