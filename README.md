# BookMyNails 💅

🔗 **Live demo:** https://brave-island-0a272a203.7.azurestaticapps.net/

AI-powered appointment booking assistant for self-employed nail technicians in Finland. A customer types anything in Finnish — *«ensi tiistai iltapäivällä geelilakkaus»* — Groq extracts the date, time, and service, finds a free slot in PostgreSQL, and atomically confirms the booking.

![Hero](docs/screenshot-hero.png)

![Chat](docs/screenshot-chat.png)

## How it works

```
customer types → POST /api/ai/chat
              → Groq (JSON mode, Finnish system prompt)
              → Zod validation of extraction
              → slot search (ANY($dates::date[]), time + duration filter)
              → suggestedSlots → frontend renders slot cards
              → customer clicks Varaa → name + phone form
              → POST /api/bookings/confirm
              → SELECT FOR UPDATE → INSERT booking → UPDATE slot → COMMIT
              → confirmation message in chat
              → (roadmap) Twilio SMS to customer and technician
```

## Notable engineering decisions

**EXCLUDE constraint prevents overlapping slots**
```sql
ALTER TABLE availability_slots
  ADD CONSTRAINT no_overlap EXCLUDE USING gist (
    technician_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  );
```
PostgreSQL rejects overlapping time ranges for the same technician at the database level — not at the application level.

**SELECT FOR UPDATE prevents double-booking race conditions**
```sql
SELECT id, technician_id FROM availability_slots
WHERE id = $1 AND is_booked = false
FOR UPDATE;
```
When two requests hit the same slot simultaneously, the second transaction waits for the first to finish. If the slot is already `is_booked = true`, the second request receives a 409 Conflict — not a silent failure.

**Failure-aware retry strategy**
```
429 → instant fallback to llama-3.1-8b-instant (waiting is pointless — quota exhausted)
503 → exponential backoff: 4 s → 8 s → 16 s (model overloaded, retry makes sense)
401/403 → fail-fast break (config error, retries won't help)
```

**Finnish natural language date parsing**

Groq returns `date` as free text («huomenna», «ensi maanantai», «24.6.»). `availability.service.js` converts it to ISO dates using Helsinki timezone — `Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Helsinki' })` instead of `toISOString()`, which uses UTC and gives the wrong day after 22:00.

**Consistent Europe/Helsinki timezone across the whole flow**

Timestamps are stored as UTC (`TIMESTAMPTZ`) and converted to Helsinki time *explicitly* at every display and filtering boundary — never relying on the ambient timezone of the server, browser, or database session:

- **Display** — both the backend chat text (`buildReply`) and the frontend slot cards (`formatSlot`) format times with `timeZone: 'Europe/Helsinki'`. A slot stored as `15:00 UTC` shows as `klo 18.00` whether the customer's browser is in Finland or abroad, and the chat text always matches the slot card.
- **SQL filtering** — date/time matching uses `(start_at AT TIME ZONE 'Europe/Helsinki')::date` / `::time` so an "evening" request (`≥ 17:00` Helsinki) is compared in wall-clock Helsinki time, not in the Postgres session's UTC.

## Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express 5, ESM |
| AI | Groq API (`llama-3.3-70b-versatile`), groq-sdk, Zod v4 |
| Database | PostgreSQL (Supabase), `btree_gist` extension |
| Architecture | routes → controllers → services → repositories |

## Running locally

```bash
# 1. Clone
git clone https://github.com/Rellance/bookmynails.git
cd bookmynails

# 2. Backend
cd server
npm install
cp .env.example .env
# Fill in DATABASE_URL and GROQ_API_KEY in .env

# Run migration (once)
psql $DATABASE_URL -f src/db/migrations/001_init.sql

node server.js           # http://localhost:3001

# 3. Frontend (separate terminal)
cd ../client
npm install
npm run dev              # http://localhost:5173
                         # Vite proxies /api → :3001
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

## Deployment

The app runs entirely on Azure:

| Component | Service | Notes |
|-----------|---------|-------|
| Backend (Express API) | Azure App Service | `bookmynails-api.azurewebsites.net`, deployed with `az webapp up` |
| Frontend (Vite SPA) | Azure Static Web Apps | [live demo](https://brave-island-0a272a203.7.azurestaticapps.net/), deployed with `swa deploy` |
| Database | PostgreSQL (Supabase) | `TIMESTAMPTZ` columns, GIST exclusion constraint |

The frontend reads the backend URL from `VITE_API_URL` (baked into the bundle at build time via `client/.env.production`); secrets (`DATABASE_URL`, `GROQ_API_KEY`) live only in App Service configuration and are never committed.

## Roadmap

- [ ] Twilio SMS reminders 24 h and 2 h before the appointment
- [ ] TechnicianDashboard — manage bookings, slots, and services
- [ ] Azure Functions cron job for SMS reminders
- [ ] Multi-tenant support (multiple technicians via `technician_id`)
- [ ] Date-range filter and CSV export for bookings

✅ **Done:** deployed to Azure App Service (backend) + Azure Static Web Apps (frontend); explicit Europe/Helsinki timezone handling end-to-end.

## License

MIT
