import Groq from 'groq-sdk';
import { env } from '../config/env.js';
import { chatExtractionSchema } from '../schemas/chatExtraction.schema.js';
import * as repo from '../repositories/aiLogs.repository.js';
import * as availabilityService from './availability.service.js';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

// Groq ei tue responseSchema-parametria kuten Gemini — JSON mode varmistaa vain sen,
// että malli palauttaa validia JSON:ia. Skeema kuvataan system-promptissa tekstinä,
// jotta malli tietää mitä kenttiä tuottaa.
// Zod-validointi tarkistaa rakenteen ennen kuin dataa käytetään.
const SYSTEM_PROMPT = `Olet varausassistentti kynsihoitolassa. Analysoi asiakkaan viesti ja palauta VAIN JSON.

Vastaa AINA tässä muodossa (älä lisää muuta tekstiä):
{
  "date": "<YYYY-MM-DD tai viikonpäivän nimi tai null>",
  "time_preference": "<kellonaika tai aikaväli tai null>",
  "service_type": "<palvelun tyyppi tai null>",
  "raw_confidence": <luku 0.0–1.0>
}

Säännöt:
- date: jos asiakas mainitsee viikonpäivän ("ensi maanantai", "torstaina") → palauta se sellaisenaan.
  Jos tarkka päivämäärä ("24.6.", "kesäkuun 24.") → muunna muotoon YYYY-MM-DD. Muuten null.
- time_preference: kellonaikatoive vapaassa muodossa, esim. "17:00", "after 17:00", "aamupäivä". Muuten null.
- service_type: tunnista "manikyyri", "geelilakkaus", "rakennekynnet", "kynsihuolto", "pedikyyri"
  ja niiden variantit. Muuten null.
- raw_confidence: kuinka selvästi viesti on varaustarkoituksella (0 = ei lainkaan, 1 = täysin selvä).`;

export class AiExtractionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AiExtractionError';
    this.cause = cause;
    this.statusCode = 502;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const FALLBACK_MODEL = 'llama-3.1-8b-instant'; // Kevyempi malli 429-tilanteessa

async function extractBookingIntent(message) {
  let lastError;
  let useFallback = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const model =
      useFallback || attempt === MAX_RETRIES ? FALLBACK_MODEL : env.GROQ_MODEL;

    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: message },
        ],
        response_format: { type: 'json_object' }, // Pakottaa mallin palauttamaan validia JSON:ia
        temperature: 0,
      });

      const rawText = completion.choices[0]?.message?.content;
      if (!rawText) throw new Error('Empty response from model');

      const parsed = chatExtractionSchema.safeParse(JSON.parse(rawText));
      if (!parsed.success) {
        throw new Error(
          `AI response failed validation: ${parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`
        );
      }

      return parsed.data;
    } catch (err) {
      lastError = err;
      const status = err?.status ?? err?.cause?.status;
      console.error(
        `[AI] Attempt ${attempt + 1}/${MAX_RETRIES + 1} (${model}) failed:`,
        err.message
      );

      // Fail-fast: virheellinen API-avain tai tuntematon malli
      if (status === 401 || status === 403) break;

      // 429 = kiintiö täynnä — odottaminen ei auta, vaihdetaan kevyempään malliin
      if (status === 429) {
        if (useFallback || model === FALLBACK_MODEL) break; // fallbackillakin 429 → luovutetaan
        useFallback = true;
        continue; // ei viivettä — välitön retry kevyemmällä mallilla
      }

      if (attempt < MAX_RETRIES) {
        const delay =
          status === 503
            ? RETRY_DELAY_MS * 2 ** (attempt + 1) // Ylikuormitus: 4s, 8s, 16s
            : RETRY_DELAY_MS * (attempt + 1);      // Muut: 2s, 4s, 6s
        await sleep(delay);
      }
    }
  }

  throw new AiExtractionError('Viestin analysointi epäonnistui', lastError);
}

export async function chat({ sessionId, message, technicianId }) {
  await repo.saveMessage({ sessionId, technicianId, role: 'user', message });

  const extraction = await extractBookingIntent(message);

  let suggestedSlots = [];
  let matchedServiceId = null;
  if (extraction.raw_confidence >= 0.4 && technicianId) {
    const result = await availabilityService.suggestSlots({ technicianId, extraction });
    suggestedSlots = result.slots;
    matchedServiceId = result.matchedServiceId;
  }

  const replyMessage = buildReply(extraction, suggestedSlots);
  await repo.saveMessage({ sessionId, technicianId, role: 'assistant', message: replyMessage });

  return { sessionId, role: 'assistant', message: replyMessage, extraction, suggestedSlots, matchedServiceId };
}

export function getHistory(sessionId) {
  return repo.findBySession(sessionId);
}

function buildReply(extraction, suggestedSlots) {
  if (extraction.raw_confidence < 0.4) {
    return 'Hei! Milloin haluaisit varata ajan ja mitä palvelua olet kiinnostunut?';
  }

  if (!suggestedSlots.length) {
    const dateHint = extraction.date ? ` ${extraction.date}` : '';
    return `Valitettavasti ei löytynyt vapaita aikoja${dateHint}. Haluatko kokeilla toista päivää?`;
  }

  const options = suggestedSlots
    .map((slot) => {
      const start = new Date(slot.start_at);
      // Aina Helsinki-aikavyöhyke (start_at on UTC). Ilman timeZone-arvoa
      // teksti käyttäisi palvelimen zonea (Azure = UTC) ja näyttäisi eri ajan
      // kuin frontendin slot-kortti.
      const date = start.toLocaleDateString('fi-FI', {
        timeZone: 'Europe/Helsinki',
        weekday: 'long', day: 'numeric', month: 'numeric',
      });
      const time = start.toLocaleTimeString('fi-FI', {
        timeZone: 'Europe/Helsinki',
        hour: '2-digit', minute: '2-digit',
      });
      return `• ${date} klo ${time}`;
    })
    .join('\n');

  const serviceHint = extraction.service_type ? ` (${extraction.service_type})` : '';

  return `Löytyi vapaita aikoja${serviceHint}:\n${options}\n\nMikä sopii sinulle? Vahvistuksen jälkeen aika on varattu.`;
}
