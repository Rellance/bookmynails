// Kutsuu bookingsService-metodeja, ei sisällä liiketoimintalogiikkaa.
import * as bookingsService from '../services/bookings.service.js';

export async function listBookings(req, res, next) {
  try {
    const { technicianId } = req.query;
    res.json(await bookingsService.getBookings(technicianId ? Number(technicianId) : undefined));
  } catch (err) {
    next(err);
  }
}

// POST /api/bookings/confirm — AI:n ehdottaman slotin atomiinen vahvistus.
// Palauttaa 409 jos slotti on jo varattu (race condition).
export async function confirmBooking(req, res, next) {
  try {
    const booking = await bookingsService.confirmBooking(req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err); // 409 Conflict menee errorHandlerille suoraan err.statusCode:n kautta
  }
}

// POST /api/bookings — manuaalinen varaus hallintapaneelista (ei AI-flow)
export async function createBooking(req, res, next) {
  try {
    const booking = await bookingsService.confirmBooking(req.body);
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
}

export async function getBooking(req, res, next) {
  try {
    const booking = await bookingsService.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Varausta ei löydy' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

export async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingsService.cancelBooking(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Varausta ei löydy' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}
