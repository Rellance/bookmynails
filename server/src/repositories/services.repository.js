// Kaikki SQL-kyselyt palveluille (manikyyri, rakennukset jne.). Ei liiketoimintalogiikkaa.
import { pool } from '../db/pool.js';

export async function findAll(technicianId) {
  const { rows } = await pool.query(
    `SELECT * FROM services
     WHERE ($1::int IS NULL OR technician_id = $1)
       AND is_active = true
     ORDER BY name_fi`,
    [technicianId ?? null]
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM services WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function insert(data) {
  const { technicianId, nameFi, descriptionFi, durationMinutes, priceEur } = data;
  const { rows } = await pool.query(
    `INSERT INTO services (technician_id, name_fi, description_fi, duration_minutes, price_eur)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [technicianId, nameFi, descriptionFi, durationMinutes, priceEur]
  );
  return rows[0];
}

export async function update(id, data) {
  const { nameFi, descriptionFi, durationMinutes, priceEur, isActive } = data;
  const { rows } = await pool.query(
    `UPDATE services
     SET name_fi           = COALESCE($2, name_fi),
         description_fi    = COALESCE($3, description_fi),
         duration_minutes  = COALESCE($4, duration_minutes),
         price_eur         = COALESCE($5, price_eur),
         is_active         = COALESCE($6, is_active)
     WHERE id = $1
     RETURNING *`,
    [id, nameFi, descriptionFi, durationMinutes, priceEur, isActive]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query(
    `UPDATE services SET is_active = false WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
}

// Epätarkka haku palvelun nimellä — käytetään AI-ekstraktion service_type-kentän sovittamiseen.
// ILIKE '%term%' kattaa kirjoitusvaihtelut (esim. "manikyyri" löytää "Klassinen manikyyri").
// Palauttaa ensimmäisen osuman tai null.
export async function findByNameFi(technicianId, nameFi) {
  const { rows } = await pool.query(
    `SELECT * FROM services
     WHERE technician_id = $1
       AND is_active = true
       AND name_fi ILIKE $2
     ORDER BY name_fi
     LIMIT 1`,
    [technicianId, `%${nameFi}%`]
  );
  return rows[0] ?? null;
}
