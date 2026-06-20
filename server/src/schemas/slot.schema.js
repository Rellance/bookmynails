import { z } from 'zod';

export const slotSchema = z.object({
  technicianId: z.number().int().positive(),
  startAt: z.iso.datetime({ message: 'startAt täytyy olla ISO 8601 -muodossa' }),
  endAt: z.iso.datetime({ message: 'endAt täytyy olla ISO 8601 -muodossa' }),
});
