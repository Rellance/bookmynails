// Kaikki SQL-kyselyt aikasloteille. Ei liiketoimintalogiikkaa.
import { pool } from '../db/pool.js';

export async function findFree({ technicianId, date }) {
  const { rows } = await pool.query(
    `SELECT * FROM availability_slots
     WHERE technician_id = $1
       AND is_booked = false
       AND ($2::date IS NULL
            OR (start_at AT TIME ZONE 'Europe/Helsinki')::date = $2::date)
     ORDER BY start_at`,
    [technicianId, date ?? null]
  );
  return rows;
}

// Hakee enintään 3 sopivaa vapaata slottia AI-ehdotusta varten.
//
// dates            – ['YYYY-MM-DD', ...] kandidaattipäivät (1–7 kpl)
// afterTime        – 'HH:MM' alaraja tai null (ei aikasuodatusta)
// minDurationMinutes – palvelun kesto minuuteissa tai null (ei kestotarkistusta)
export async function findSuggested({ technicianId, dates, afterTime, minDurationMinutes }) {
  const { rows } = await pool.query(
    `SELECT *,
            ROUND(EXTRACT(EPOCH FROM (end_at - start_at)) / 60) AS duration_minutes
     FROM availability_slots
     WHERE technician_id     = $1
       AND is_booked         = false
       AND (start_at AT TIME ZONE 'Europe/Helsinki')::date = ANY($2::date[])
       AND ($3::time IS NULL
            OR (start_at AT TIME ZONE 'Europe/Helsinki')::time >= $3::time)
       AND ($4::int  IS NULL
            OR EXTRACT(EPOCH FROM (end_at - start_at)) / 60 >= $4)
     ORDER BY start_at
     LIMIT 3`,
    [technicianId, dates, afterTime ?? null, minDurationMinutes ?? null]
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM availability_slots WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function insert(data) {
  const { technicianId, startAt, endAt } = data;
  const { rows } = await pool.query(
    `INSERT INTO availability_slots (technician_id, start_at, end_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [technicianId, startAt, endAt]
  );
  return rows[0];
}

// Käytetään confirmAtomic-transaktion sisällä — ottaa yhteyden client-parametrina,
// ei poolista, jotta transaktion konteksti säilyy.
export async function lockAndMarkBooked(client, slotId) {
  const { rows } = await client.query(
    `SELECT id, technician_id
     FROM availability_slots
     WHERE id = $1 AND is_booked = false
     FOR UPDATE`,  // lukitaan rivi — estää samanaikaisen kaksoisvarauksen
    [slotId]
  );
  if (!rows.length) return null; // slotti jo varattu tai poistettu

  await client.query(
    `UPDATE availability_slots SET is_booked = true WHERE id = $1`,
    [slotId]
  );
  return rows[0]; // palauttaa { id, technician_id }
}

export async function remove(id) {
  const { rowCount } = await pool.query(
    `DELETE FROM availability_slots WHERE id = $1 AND is_booked = false`,
    [id]
  );
  return rowCount > 0;
}
