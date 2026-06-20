// Liiketoimintalogiikka aikasloteille.
// Kutsuu availabilityRepository- ja servicesService-metodeja. Ei sisällä SQL:ää.
import * as repo from '../repositories/availability.repository.js';
import * as servicesService from './services.service.js';

// ── Päivämäärämuunnokset ──────────────────────────────────────────────────────
//
// AI:n palauttama extraction.date voi olla:
//   • 'YYYY-MM-DD'   → tarkka päivä suoraan SQL:ään
//   • 'huomenna'     → lasketaan huominen Helsinki-aikavyöhykkeellä
//   • 'maanantai'    → suomalainen viikonpäivä → lasketaan seuraava esiintymä
//   • 'ensi tiistai' → sama, "ensi"-etuliite ei muuta logiikkaa
//   • null           → päivää ei mainittu → haetaan seuraavat 7 päivää
//
// JS:n getDay() palauttaa: 0=su 1=ma 2=ti 3=ke 4=to 5=pe 6=la
const FI_WEEKDAYS = {
  sunnuntai: 0, maanantai: 1, tiistai: 2, keskiviikko: 3,
  torstai: 4,   perjantai: 5, lauantai: 6,
};

// Palauttaa "tänään" Helsinki-aikavyöhykkeellä muodossa 'YYYY-MM-DD'.
// sv-SE locale tuottaa suoraan YYYY-MM-DD-muodon — ei tarvita manuaalista muotoilua.
// Tärkeää: toISOString() käyttää UTC:tä. Kello 22:00 UTC = 01:00 seuraavana päivänä
// Helsingissä → ilman timezone-tarkistusta "huomenna" osoittaisi väärään päivään.
function todayInHelsinki() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' }).format(new Date());
}

// Lisää päiviä YYYY-MM-DD-merkkijonoon timezone-turvallisesti.
// Parsitaan puoleen päivään UTC:tä — näin setUTCDate(+n) ei koskaan hyppää
// päivänvaihtumisenyli DST-siirtymistä huolimatta.
function addDays(yyyymmdd, n) {
  const d = new Date(`${yyyymmdd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Palauttaa ISO-muotoisen päivämäärän 'YYYY-MM-DD' seuraavalle targetDay:lle.
// Jos tänään on sama viikonpäivä → palautetaan ensi viikolla (oletus: tänä päivänä
// on jo myöhäistä; voidaan muuttaa tarvittaessa).
function nextWeekdayDate(targetDay) {
  const todayStr = todayInHelsinki();
  const todayDow = new Date(`${todayStr}T12:00:00Z`).getUTCDay(); // 0=su
  let daysUntil = targetDay - todayDow;
  if (daysUntil <= 0) daysUntil += 7;
  return addDays(todayStr, daysUntil);
}

// Muuntaa extraction.date → taulukko ISO-päivämääriä.
// Repository odottaa taulukkoa, koska "ei päivää" → haetaan 7 kandidaattia kerralla.
function parseDates(dateStr) {
  // Ei päivää mainittu → haetaan seuraavat 7 päivää kandidaateiksi
  if (!dateStr) {
    const today = todayInHelsinki();
    return Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
  }

  // Tarkka ISO-päivä — käytetään suoraan
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return [dateStr];
  }

  const lower = dateStr.toLowerCase();

  // "huomenna" — lasketaan Helsinki-aikavyöhykkeellä, ei UTC:llä
  if (lower.includes('huomenna')) {
    return [addDays(todayInHelsinki(), 1)];
  }

  // Etsitään suomalainen viikonpäivä merkkijonosta
  // (kattaa myös "ensi maanantai", "seuraava tiistai" jne.)
  for (const [name, dayNum] of Object.entries(FI_WEEKDAYS)) {
    if (lower.includes(name)) return [nextWeekdayDate(dayNum)];
  }

  return []; // Tuntematon muoto → ei tuloksia (service palauttaa [])
}

// ── Aikatoiveen muunnokset ────────────────────────────────────────────────────
//
// Geminin palauttama extraction.time_preference voi olla:
//   • 'after 17:00' / '17:00 jälkeen' → alaraja 17:00
//   • '14:00'                          → haetaan slotteja jotka alkavat ≥ 14:00
//   • 'aamupäivä' / 'aamulla'          → alaraja 08:00
//   • 'iltapäivä'                      → alaraja 12:00
//   • 'ilta' / 'illalla'               → alaraja 17:00
//   • null                             → ei aikasuodatusta
//
// Palautetaan 'HH:MM'-merkkijono tai null.
// SQL-kysely käyttää: start_at::time >= $afterTime
function parseAfterTime(timePref) {
  if (!timePref) return null;

  const lower = timePref.toLowerCase();

  // Suomalaiset kellonajat ilmaistuna sanallisesti
  if (/aamupäivä|aamulla|aamu/.test(lower)) return '08:00';
  if (/iltapäivä|puolenpäivän jälkeen/.test(lower)) return '12:00';
  if (/ilta(päivä)?|illalla/.test(lower)) return '17:00';

  // Kellonaikamuoto: "17:00", "17.00"
  const clockMatch = lower.match(/(\d{1,2})[.:](\d{2})/);
  if (clockMatch) {
    return `${clockMatch[1].padStart(2, '0')}:${clockMatch[2]}`;
  }

  // "after 17" tai "17 jälkeen" (tunti ilman minuutteja)
  const hourMatch = lower.match(/after\s+(\d{1,2})|(\d{1,2})\s+jälkeen/);
  if (hourMatch) {
    const h = (hourMatch[1] ?? hourMatch[2]).padStart(2, '0');
    return `${h}:00`;
  }

  return null; // Ei tunnistettu → ei aikasuodatusta
}

// ── Julkinen API ──────────────────────────────────────────────────────────────

// Etsii sopivat vapaat slotit Gemini-ekstraktion perusteella.
// Kutsutaan ai.service.js:stä heti extractBookingIntent()-kutsun jälkeen.
//
// Parametrit:
//   technicianId  – mestarin ID (tulee HTTP-pyynnöstä)
//   extraction    – { date, time_preference, service_type, raw_confidence }
//
// Palauttaa enintään 3 sopivaa slottia (repository rajoittaa LIMIT 3:lla).
// Palauttaa { slots, matchedServiceId }.
// matchedServiceId tarvitaan frontendissä POST /api/bookings/confirm -kutsussa.
export async function suggestSlots({ technicianId, extraction }) {
  // 1. Muunna date-merkkijono ISO-päivämäärien taulukoksi
  const dates = parseDates(extraction.date);
  if (!dates.length) return { slots: [], matchedServiceId: null };

  // 2. Muunna time_preference SQL-käyttöiseksi alarajaksi
  const afterTime = parseAfterTime(extraction.time_preference);

  // 3. Jos palvelutyyppi on tunnistettu, haetaan sen kesto ja id:
  //    • kesto → suodatetaan liian lyhyet slotit pois
  //    • id    → palautetaan frontendille vahvistusta varten
  let minDurationMinutes = null;
  let matchedServiceId = null;
  if (extraction.service_type) {
    const service = await servicesService.findByNameFi(technicianId, extraction.service_type);
    if (service) {
      minDurationMinutes = service.duration_minutes;
      matchedServiceId = service.id;
    }
  }

  // 4. Delegoi SQL-haku repositorylle — ei SQL:ää täällä
  const slots = await repo.findSuggested({ technicianId, dates, afterTime, minDurationMinutes });
  return { slots, matchedServiceId };
}

export function getFreeSlots({ technicianId, date }) {
  return repo.findFree({ technicianId, date });
}

export function createSlot(data) {
  return repo.insert(data);
}

export function deleteSlot(id) {
  return repo.remove(id);
}
