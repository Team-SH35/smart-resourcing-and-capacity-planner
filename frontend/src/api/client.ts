import type { JobCode } from "../../../backend/src/types";

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

  return res.json() as Promise<{ response: string; sessionId: string; proposed_changes: any[] }>;
}

export async function approveChange(sessionId: string) {
  const res = await fetch(`${AI_BASE}/api/v1/approve-change/${sessionId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Approval failed: ${res.status}`);
  return res.json() as Promise<{ response: string; sessionId: string; proposed_changes: any[] }>;
}

export async function rejectChange(sessionId: string) {
  const res = await fetch(`${AI_BASE}/api/v1/reject-change/${sessionId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Rejection failed: ${res.status}`);
  return res.json() as Promise<{ response: string; sessionId: string; proposed_changes: any[] }>;
}

export async function getBusinessUnits(): Promise<string[]> {
  console.log("API_BASE:", API_BASE);
  const res = await fetch(`${API_BASE}/api/job-codes`);
  console.log("Fetching:", `${API_BASE}/api/job-codes`);

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

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }

  return res.json();
}