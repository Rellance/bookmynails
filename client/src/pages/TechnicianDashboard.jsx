// Mestarin näkymä: varauskalenteri (tulevat ja menneet varaukset).
// Hakee varaukset backendista GET /api/bookings?technicianId=...
// TODO: lisää autentikointi (mestari kirjautuu sisään ennen tänne pääsyä)
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config.js';

const TECHNICIAN_ID = import.meta.env.VITE_TECHNICIAN_ID
  ? Number(import.meta.env.VITE_TECHNICIAN_ID)
  : 1;

const HELSINKI_TZ = 'Europe/Helsinki';

// Muotoile slotin alkamisaika aina Helsinki-aikavyöhykkeellä (start_at on UTC).
function formatDateTime(startAt) {
  const d = new Date(startAt);
  const date = d.toLocaleDateString('fi-FI', {
    timeZone: HELSINKI_TZ, weekday: 'short', day: 'numeric', month: 'numeric',
  });
  const time = d.toLocaleTimeString('fi-FI', {
    timeZone: HELSINKI_TZ, hour: '2-digit', minute: '2-digit',
  });
  return { date, time };
}

const STATUS_LABELS = { confirmed: 'Vahvistettu', cancelled: 'Peruttu' };

export default function TechnicianDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/bookings?technicianId=${TECHNICIAN_ID}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (active) setBookings(Array.isArray(data) ? data : []);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const S = {
    page:    { fontFamily: "'Manrope',sans-serif", color: '#2c2329', background: 'linear-gradient(180deg,#fffdfc 0%,#fdf3f5 100%)', minHeight: '100vh', padding: '56px 18px 80px' },
    wrap:    { maxWidth: 560, margin: '0 auto' },
    eyebrow: { color: '#c97f92', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 700 },
    title:   { fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(32px,8vw,46px)', color: '#2c2329', marginTop: 8, lineHeight: 1.05 },
    sub:     { color: '#9a8a90', fontSize: 14, fontWeight: 500, marginTop: 6 },
    card:    { display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #f1dde3', borderRadius: 16, padding: '14px 16px', boxShadow: '0 6px 18px -12px rgba(120,60,78,.4)' },
    dateBox: { width: 52, height: 52, borderRadius: 12, background: '#fdeef1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' },
    note:    { textAlign: 'center', color: '#9a8a90', fontSize: 15, fontWeight: 500, padding: '48px 0' },
  };

  function StatusBadge({ status }) {
    const cancelled = status === 'cancelled';
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, flex: 'none',
        color: cancelled ? '#b06a6a' : '#3f9b63',
        background: cancelled ? '#f7e7e7' : '#e6f6ec',
      }}>
        {STATUS_LABELS[status] ?? status}
      </span>
    );
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={{ textAlign: 'center', marginBottom: 30 }}>
          <span style={S.eyebrow}>Mestarin näkymä</span>
          <h1 style={S.title}>Varauskalenteri</h1>
          <p style={S.sub}>Tulevat ja menneet varaukset</p>
        </header>

        {loading && <p style={S.note}>Ladataan…</p>}
        {!loading && error && <p style={S.note}>Varausten haku epäonnistui. Yritä myöhemmin uudelleen.</p>}
        {!loading && !error && bookings.length === 0 && <p style={S.note}>Ei varauksia vielä 💅</p>}

        {!loading && !error && bookings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bookings.map((b) => {
              const { date, time } = formatDateTime(b.start_at);
              return (
                <div key={b.id} style={S.card}>
                  <div style={S.dateBox}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2c2329', lineHeight: 1 }}>{time}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{b.customer_name}</div>
                    <div style={{ fontSize: 13, color: '#9a8a90', fontWeight: 500 }}>
                      {date} · {b.service_name}
                    </div>
                    <a href={`tel:${b.customer_phone}`} style={{ fontSize: 13, color: '#c97f92', fontWeight: 600, textDecoration: 'none' }}>
                      {b.customer_phone}
                    </a>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
