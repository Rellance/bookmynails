// Kaikki SQL-kyselyt AI-keskustelulokeille. Ei liiketoimintalogiikkaa.
import { pool } from '../db/pool.js';

export async function saveMessage({ sessionId, technicianId, role, message, bookingId }) {
  const { rows } = await pool.query(
    `INSERT INTO ai_conversation_logs
       (session_id, technician_id, role, message, booking_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [sessionId, technicianId ?? null, role, message, bookingId ?? null]
  );
  return rows[0];
}

export async function findBySession(sessionId) {
  const { rows } = await pool.query(
    `SELECT * FROM ai_conversation_logs
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );
  return rows;
}
