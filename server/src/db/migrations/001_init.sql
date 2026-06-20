-- BookMyNails — alkuperäinen skeema
-- Suorita Supabase SQL Editor -editorissa tai psql:llä.

-- ─── Mestarit ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS technicians (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,
  phone      VARCHAR(30),
  email      VARCHAR(255)  NOT NULL UNIQUE,
  bio        TEXT,
  location   VARCHAR(120),                 -- esim. "Helsinki, Kallio"
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Palvelut ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id               SERIAL PRIMARY KEY,
  technician_id    INT           NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  name_fi          VARCHAR(120)  NOT NULL,       -- palvelun nimi suomeksi
  description_fi   TEXT,
  duration_minutes INT           NOT NULL CHECK (duration_minutes >= 15),
  price_eur        NUMERIC(6,2)  NOT NULL CHECK (price_eur > 0),
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Vapaat ajat ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availability_slots (
  id             SERIAL PRIMARY KEY,
  technician_id  INT          NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  start_at       TIMESTAMPTZ  NOT NULL,
  end_at         TIMESTAMPTZ  NOT NULL,
  is_booked      BOOLEAN      NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT no_overlap EXCLUDE USING gist (
    technician_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
);

-- ─── Varaukset ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               SERIAL PRIMARY KEY,
  technician_id    INT          NOT NULL REFERENCES technicians(id),
  service_id       INT          NOT NULL REFERENCES services(id),
  slot_id          INT          NOT NULL REFERENCES availability_slots(id),
  customer_name    VARCHAR(120) NOT NULL,
  customer_phone   VARCHAR(30)  NOT NULL,
  customer_email   VARCHAR(255),
  notes            TEXT,
  status           VARCHAR(20)  NOT NULL DEFAULT 'confirmed'
                                CHECK (status IN ('confirmed', 'cancelled')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── AI-keskustelulokit ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversation_logs (
  id             SERIAL PRIMARY KEY,
  session_id     UUID         NOT NULL,
  technician_id  INT          REFERENCES technicians(id),  -- nullable: ennen mestarin valintaa
  role           VARCHAR(10)  NOT NULL CHECK (role IN ('user', 'assistant')),
  message        TEXT         NOT NULL,
  booking_id     INT          REFERENCES bookings(id),     -- asetetaan jos chat johti varaukseen
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Indeksit ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_services_technician       ON services(technician_id);
CREATE INDEX IF NOT EXISTS idx_slots_technician_start    ON availability_slots(technician_id, start_at);
CREATE INDEX IF NOT EXISTS idx_bookings_technician       ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session           ON ai_conversation_logs(session_id);

-- ─── btree_gist laajennos (tarvitaan EXCLUDE-rajoitteeseen) ────────────────
-- Supabasessa se on yleensä jo käytössä; jos ei, aja:
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
