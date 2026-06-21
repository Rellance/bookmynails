import { API_BASE_URL } from '../config.js';

export async function sendChatMessage({ sessionId, message, technicianId }) {
  const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, message, technicianId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Viestin lähetys epäonnistui');
  }
  return res.json();
}

export async function fetchChatHistory(sessionId) {
  const res = await fetch(`${API_BASE_URL}/api/ai/history/${sessionId}`);
  if (!res.ok) throw new Error('Historian haku epäonnistui');
  return res.json();
}
