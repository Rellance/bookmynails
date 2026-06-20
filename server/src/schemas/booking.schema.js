import { z } from 'zod';

export const bookingSchema = z.object({
  technicianId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  slotId: z.number().int().positive(),
  customerName: z.string().min(1, 'Asiakkaan nimi on pakollinen'),
  customerPhone: z.string().min(1, 'Puhelinnumero on pakollinen'),
  customerEmail: z.email().optional(),
  notes: z.string().optional(),
});

// POST /api/bookings/confirm — AI-chatin ehdottaman slotin vahvistus.
// technicianId puuttuu tarkoituksella: repository johtaa sen slottiriviltä itse.
export const confirmBookingSchema = z.object({
  slotId: z.number().int().positive(),
  // serviceId voi olla null jos AI ei tunnistanut palvelutyyppiä — tarkistetaan service-kerroksessa
  serviceId: z.number().int().positive().nullable().optional(),
  customerName: z.string().min(1, 'Asiakkaan nimi on pakollinen'),
  customerPhone: z.string().min(1, 'Puhelinnumero on pakollinen'),
  customerEmail: z.email().optional(),
  notes: z.string().optional(),
});
