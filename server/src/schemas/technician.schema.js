import { z } from 'zod';

export const technicianSchema = z.object({
  name: z.string().min(1, 'Nimi on pakollinen'),
  phone: z.string().optional(),
  email: z.email('Virheellinen sähköpostiosoite'),
  bio: z.string().optional(),
  location: z.string().optional(),
});
