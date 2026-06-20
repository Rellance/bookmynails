import { z } from 'zod';

// What Groq extracts from a Finnish customer message.
// Used for Zod post-validation of the JSON mode response.
export const chatExtractionSchema = z.object({
  date: z
    .string()
    .nullable()
    .describe(
      'Toivottu päivämäärä muodossa YYYY-MM-DD tai viikonpäivän nimi (esim. "maanantai"). ' +
      'null jos asiakasviesti ei sisällä päivämäärätietoa.'
    ),
  time_preference: z
    .string()
    .nullable()
    .describe(
      'Toivottu kellonaika tai aikaväli vapaassa muodossa, esim. "14:00", "after 17:00", ' +
      '"aamupäivä". null jos ei mainita.'
    ),
  service_type: z
    .string()
    .nullable()
    .describe(
      'Palvelun tyyppi asiakkaan mainitsemana, esim. "manikyyri", "geelilakkaus", ' +
      '"rakennekynnet", "kynsihuolto". null jos ei mainita.'
    ),
  raw_confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'Kuinka varmasti malli tunnisti varaustarkoituksen (0 = ei yhtään, 1 = täysin varma). ' +
      'Laske tämä itse arvioimalla viestin selkeyttä.'
    ),
});
