import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { bookingSchema, confirmBookingSchema } from '../schemas/booking.schema.js';
import * as controller from '../controllers/bookings.controller.js';

export const bookingsRouter = Router();

// GET  /api/bookings?technicianId=  — hae varaukset (mestarille)
// POST /api/bookings                — luo varaus manuaalisesti (hallintapaneeli)
// POST /api/bookings/confirm        — vahvista AI:n ehdottama slotti atomisesti
// GET  /api/bookings/:id            — hae varaus id:llä
// PATCH /api/bookings/:id/cancel    — peruuta varaus
bookingsRouter.get('/', controller.listBookings);
bookingsRouter.post('/confirm', validate(confirmBookingSchema), controller.confirmBooking); // ENNEN /:id
bookingsRouter.post('/', validate(bookingSchema), controller.createBooking);
bookingsRouter.get('/:id', controller.getBooking);
bookingsRouter.patch('/:id/cancel', controller.cancelBooking);
