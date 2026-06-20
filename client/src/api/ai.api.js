// HTTP-kutsut AI-assistentille.
export async function sendChatMessage({ sessionId, message, technicianId }) {
  const res = await fetch('/api/ai/chat', {
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
  const res = await fetch(`/api/ai/history/${sessionId}`);
  if (!res.ok) throw new Error('Historian haku epäonnistui');
  return res.json();
}
