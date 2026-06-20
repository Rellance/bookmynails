// Liiketoimintalogiikka varauksille.
// Kutsuu bookingsRepository-metodeja. Ei sisällä SQL:ää.
import * as repo from '../repositories/bookings.repository.js';

export function getBookings(technicianId) {
  return repo.findAll(technicianId);
}

export function getBookingById(id) {
  return repo.findById(id);
}

// Vahvistaa varauksen atomisesti: lukitsee slotin, luo booking-rivin,
// merkitsee slotin varatuksi — kaikki yhdessä transaktiossa.
//
// Parametrit:
//   slotId        – ehdotetun slotin ID (tuli AI-vastauksessa)
//   serviceId     – valitun palvelun ID
//   customerName  – asiakkaan nimi
//   customerPhone – puhelinnumero (pakollinen, mestari soittaa tarvittaessa)
//   customerEmail – sähköposti (valinnainen)
//   notes         – lisätietoja (valinnainen)
//
// Heittää 409-virheen jos slotti on jo varattu (race condition käsitelty
// repositoryn FOR UPDATE -lukituksella).
export function confirmBooking({ slotId, serviceId, customerName, customerPhone, customerEmail, notes }) {
  if (!serviceId) {
    const err = new Error(
      'Palvelutyyppi puuttuu. Kerro AI-assistentille millaisen palvelun haluat (esim. "manikyyri" tai "geelilakkaus").'
    );
    err.statusCode = 400;
    throw err;
  }
  return repo.confirmAtomic({ slotId, serviceId, customerName, customerPhone, customerEmail, notes });
}

export function cancelBooking(id) {
  return repo.cancel(id);
}
