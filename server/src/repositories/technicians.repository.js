// Kaikki SQL-kyselyt mestareille. Ei liiketoimintalogiikkaa.
import { pool } from '../db/pool.js';

export async function findAll() {
  const { rows } = await pool.query(
    `SELECT * FROM technicians ORDER BY name`
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM technicians WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function insert(data) {
  const { name, phone, email, bio, location } = data;
  const { rows } = await pool.query(
    `INSERT INTO technicians (name, phone, email, bio, location)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, phone, email, bio, location]
  );
  return rows[0];
}

export async function update(id, data) {
  const { name, phone, email, bio, location } = data;
  const { rows } = await pool.query(
    `UPDATE technicians
     SET name = COALESCE($2, name),
         phone = COALESCE($3, phone),
         email = COALESCE($4, email),
         bio = COALESCE($5, bio),
         location = COALESCE($6, location)
     WHERE id = $1
     RETURNING *`,
    [id, name, phone, email, bio, location]
  );
  return rows[0] ?? null;
}

export async function remove(id) {
  const { rowCount } = await pool.query(
    `DELETE FROM technicians WHERE id = $1`,
    [id]
  );
  return rowCount > 0;
}
