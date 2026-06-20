import { z } from 'zod';

export const serviceSchema = z.object({
  technicianId: z.number().int().positive(),
  nameFi: z.string().min(1, 'Palvelun nimi on pakollinen'),
  descriptionFi: z.string().optional(),
  durationMinutes: z.number().int().min(15, 'Kesto vähintään 15 min'),
  priceEur: z.number().positive('Hinta on pakollinen'),
});
