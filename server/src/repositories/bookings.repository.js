// Kaikki SQL-kyselyt varauksille. Ei liiketoimintalogiikkaa.
import { pool } from '../db/pool.js';

export async function findAll(technicianId) {
  const { rows } = await pool.query(
    `SELECT b.*, s.name_fi AS service_name, s.price_eur,
            t.name AS technician_name,
            sl.start_at, sl.end_at
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     JOIN technicians t ON t.id = b.technician_id
     JOIN availability_slots sl ON sl.id = b.slot_id
     WHERE ($1::int IS NULL OR b.technician_id = $1)
     ORDER BY sl.start_at ASC`,
    [technicianId ?? null]
  );
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(
    `SELECT b.*, s.name_fi AS service_name, s.price_eur,
            t.name AS technician_name,
            sl.start_at, sl.end_at
     FROM bookings b
     JOIN services s ON s.id = b.service_id
     JOIN technicians t ON t.id = b.technician_id
     JOIN availability_slots sl ON sl.id = b.slot_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

// Luo varauksen ja merkitsee slotin varatuksi ATOMISESTI yhdessä transaktiossa.
//
// Miksi transaktio eikä kaksi erillistä kyselyä?
//   Ilman transaktiota kaksi samanaikaista pyyntöä voivat molemmat lukea slotin
//   is_booked = false, molemmat luoda varauksen ja tuloksena yksi slotti on
//   varattu kahdesti. FOR UPDATE lukitsee rivin ja estää tämän.
//
// technician_id haetaan slottiriviltä itseltään — kutsujan ei tarvitse tietää sitä.
export async function confirmAtomic({ slotId, serviceId, customerName, customerPhone, customerEmail, notes }) {
  const client = await pool.connect(); // yksi yhteys koko transaktion ajaksi

  try {
    await client.query('BEGIN');

    // Lukitse slottirivi ja tarkista samalla, että se on edelleen vapaa.
    // FOR UPDATE estää samanaikaisen muokkauksen kunnes COMMIT tai ROLLBACK.
    const { rows: slotRows } = await client.query(
      `SELECT id, technician_id
       FROM availability_slots
       WHERE id = $1 AND is_booked = false
       FOR UPDATE`,
      [slotId]
    );

    if (!slotRows.length) {
      const err = new Error('Valittu aika on jo varattu tai poistettu');
      err.statusCode = 409; // Conflict — asiakasvirhe, ei palvelinvirhe
      throw err;
    }

    const { technician_id: technicianId } = slotRows[0];

    // Luo varausrivi
    const { rows: bookingRows } = await client.query(
      `INSERT INTO bookings
         (technician_id, service_id, slot_id,
          customer_name, customer_phone, customer_email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [technicianId, serviceId, slotId,
       customerName, customerPhone,
       customerEmail ?? null, notes ?? null]
    );

    // Merkitse slotti varatuksi — tehdään viimeisenä, jotta ROLLBACK palauttaa sen vapaaksi
    await client.query(
      `UPDATE availability_slots SET is_booked = true WHERE id = $1`,
      [slotId]
    );

    await client.query('COMMIT');
    return bookingRows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // Heitetään ylöspäin — errorHandler tai service käsittelee
  } finally {
    client.release(); // Palauta yhteys poolille aina — myös virheen sattuessa
  }
}

export async function cancel(id) {
  const { rows } = await pool.query(
    `UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}
