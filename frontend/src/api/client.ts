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

  return res.json() as Promise<{ response: string; session_id: string }>;
}
