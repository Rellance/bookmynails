import { useState, useRef, useCallback } from 'react';

const TECHNICIAN_ID = import.meta.env.VITE_TECHNICIAN_ID
  ? Number(import.meta.env.VITE_TECHNICIAN_ID)
  : 1;

const FI_DAYS = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La'];

function formatSlot(slot, serviceType) {
  const start = new Date(slot.start_at);
  const mins = slot.duration_minutes
    ?? Math.round((new Date(slot.end_at) - start) / 60000);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  return {
    id: slot.id,
    day: FI_DAYS[start.getDay()],
    date: String(start.getDate()),
    time: start.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
    service: serviceType ? `${cap(serviceType)} · ${mins} min` : `Kynsihoito · ${mins} min`,
  };
}

export default function BookingPage() {
  const [messages, setMessages] = useState([
    { isAI: true, text: 'Hei! Olen Anna, tekoälyavustajasi 💅 Autan sinua varaamaan ajan manikyyriin. Milloin sinulle sopisi?' },
  ]);
  const [slots, setSlots] = useState([]);
  const [showSlots, setShowSlots] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [matchedServiceId, setMatchedServiceId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formError, setFormError] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [booked, setBooked] = useState(false);
  const scrollEl = useRef(null);

  function scrollDown() {
    requestAnimationFrame(() => {
      if (scrollEl.current) scrollEl.current.scrollTop = scrollEl.current.scrollHeight;
    });
  }

  function addMessage(msg) {
    setMessages(prev => [...prev, msg]);
    scrollDown();
  }

  const handleSend = useCallback(async (text) => {
    if (!text.trim() || typing || booked) return;
    addMessage({ isAI: false, text });
    setDraft('');
    setTyping(true);
    scrollDown();

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, technicianId: TECHNICIAN_ID, sessionId }),
      });
      const data = await res.json();

      if (!sessionId && data.sessionId) setSessionId(data.sessionId);
      setTyping(false);
      addMessage({ isAI: true, text: data.message });

      if (data.suggestedSlots?.length > 0) {
        setSlots(data.suggestedSlots.map(s => formatSlot(s, data.extraction?.service_type)));
        setMatchedServiceId(data.matchedServiceId ?? null);
        setShowSlots(true);
      }
    } catch {
      setTyping(false);
      addMessage({ isAI: true, text: 'Anteeksi, jokin meni pieleen. Yritä uudelleen.' });
    }
  }, [sessionId, typing, booked]);

  function handleBook(slot) {
    setShowSlots(false);
    setSelectedSlot(slot);
    addMessage({ isAI: false, text: `Valitsen ajan: ${slot.day} ${slot.date}, klo ${slot.time}` });
    setTyping(true);
    scrollDown();
    setTimeout(() => {
      setTyping(false);
      addMessage({ isAI: true, text: 'Hyvä valinta! Täytä vielä nimesi ja puhelinnumerosi, niin vahvistan ajan. 💕' });
      setShowForm(true);
      scrollDown();
    }, 1100);
  }

  async function handleConfirm() {
    const name = formName.trim();
    const phone = formPhone.trim();
    if (!name || !phone) { setFormError(true); return; }

    setApiError(null);
    try {
      const res = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          serviceId: matchedServiceId,
          customerName: name,
          customerPhone: phone,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setShowForm(false);
      setBooked(true);
      setFormError(false);
      addMessage({ isAI: false, text: `${name} · ${phone}` });
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        addMessage({
          isAI: true,
          text: `Täydellistä, ${name}! ✨ Aikasi on varattu: ${selectedSlot.day} ${selectedSlot.date} klo ${selectedSlot.time}. Lähetin vahvistuksen numeroon ${phone}. Nähdään pian! 💅`,
        });
      }, 1100);
    } catch (err) {
      console.error('[BookingPage] confirm failed:', err.message);
      setApiError(err.message || 'Varauksen vahvistus epäonnistui. Yritä uudelleen.');
    }
  }

  function scrollToChat() {
    const el = document.querySelector('[data-screen="chat"]');
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }

  // ── styles ──────────────────────────────────────────────────────────────────
  const S = {
    aiBubble:   { background: '#f3edef', color: '#3a2f34', borderRadius: '18px 18px 18px 5px',  padding: '12px 16px', fontSize: 14.5, lineHeight: 1.5, maxWidth: '78%', fontWeight: 500, whiteSpace: 'pre-line' },
    userBubble: { background: '#d98a9e', color: '#fff',    borderRadius: '18px 18px 5px 18px',   padding: '12px 16px', fontSize: 14.5, lineHeight: 1.5, maxWidth: '78%', fontWeight: 500, marginLeft: 'auto' },
    input:      { border: '1px solid #f0dee4', background: '#fdf7f8', borderRadius: 12, padding: '12px 15px', fontFamily: "'Manrope',sans-serif", fontSize: 14, color: '#2c2329', outline: 'none', width: '100%' },
  };

  return (
    <div style={{ fontFamily: "'Manrope',sans-serif", color: '#2c2329', background: '#fffdfc', width: '100%', overflowX: 'hidden' }}>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', width: '100%', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <img src="/images/hero.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(58,38,44,.34) 0%,rgba(58,38,44,.18) 38%,rgba(58,38,44,.62) 100%)' }} />
        <div className="bmn-rise" style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '32px 26px', maxWidth: 560 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 26, padding: '7px 15px', border: '1px solid rgba(255,255,255,.5)', borderRadius: 999, backdropFilter: 'blur(4px)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f5c6d0' }} />
            <span style={{ color: 'rgba(255,255,255,.92)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600 }}>Helsinki · Tekoälyvaraus</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", color: '#fff', fontWeight: 500, fontSize: 'clamp(52px,15vw,88px)', lineHeight: .98, letterSpacing: '-.01em', textShadow: '0 2px 30px rgba(40,20,26,.35)' }}>BookMyNails</h1>
          <p style={{ color: 'rgba(255,255,255,.94)', fontSize: 'clamp(16px,4.6vw,20px)', lineHeight: 1.5, margin: '20px auto 34px', maxWidth: 380, textShadow: '0 1px 14px rgba(40,20,26,.4)' }}>Varaa aika helposti tekoälyn avulla</p>
          <button onClick={scrollToChat} className="bmn-cta-btn" style={{ cursor: 'pointer', border: 'none', background: '#fff', color: '#2c2329', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 16, padding: '17px 38px', borderRadius: 999, boxShadow: '0 10px 34px rgba(40,20,26,.28)', transition: 'transform .25s,box-shadow .25s,background .25s' }}>
            Varaa aika nyt
          </button>
        </div>
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2, width: 1, height: 42, background: 'linear-gradient(180deg,transparent,rgba(255,255,255,.7))' }} />
      </section>

      {/* ── CHAT ───────────────────────────────────────────────────────────── */}
      <section data-screen="chat" style={{ background: 'linear-gradient(180deg,#fffdfc 0%,#fdf3f5 100%)', padding: '72px 18px 84px' }}>
        <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 28px' }}>
          <span style={{ color: '#c97f92', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 700 }}>Varaus</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(30px,8vw,42px)', color: '#2c2329', marginTop: 8, lineHeight: 1.05 }}>Keskustele Annan kanssa</h2>
        </div>

        <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: 26, boxShadow: '0 26px 70px -28px rgba(120,60,78,.35),0 2px 10px rgba(120,60,78,.06)', overflow: 'hidden', border: '1px solid #f6e6ea' }}>

          {/* chat header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '16px 18px', borderBottom: '1px solid #f4e7eb' }}>
            <div style={{ position: 'relative', flex: 'none' }}>
              <img src="/images/anna-avatar.jpg" alt="Anna" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 22%' }} />
              <span className="bmn-pulse" style={{ position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: '50%', background: '#5ec47b', border: '2.5px solid #fff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Anna</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#5ec47b', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5ec47b' }} />verkossa
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#b9aab0', fontWeight: 600, letterSpacing: '.04em' }}>Tekoälyavustaja</div>
          </div>

          {/* messages */}
          <div ref={scrollEl} style={{ padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 14, height: 430, overflowY: 'auto', background: 'linear-gradient(180deg,#fffdfc,#fff)' }}>

            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: m.isAI ? 'flex-start' : 'flex-end', animation: 'bmnPop .4s ease both' }}>
                {m.isAI && <img src="/images/anna-avatar.jpg" alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 22%', flex: 'none', alignSelf: 'flex-end' }} />}
                <div style={m.isAI ? S.aiBubble : S.userBubble}>{m.text}</div>
              </div>
            ))}

            {/* slot cards */}
            {showSlots && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 38, animation: 'bmnPop .5s ease both' }}>
                {slots.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: '1px solid #f1dde3', borderRadius: 16, padding: '13px 15px', boxShadow: '0 6px 18px -12px rgba(120,60,78,.4)' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fdeef1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#c97f92', textTransform: 'uppercase', letterSpacing: '.06em' }}>{s.day}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#2c2329', lineHeight: 1 }}>{s.date}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.time}</div>
                      <div style={{ fontSize: 12.5, color: '#9a8a90', fontWeight: 500 }}>{s.service}</div>
                    </div>
                    <button onClick={() => handleBook(s)} className="bmn-slot-btn" style={{ cursor: 'pointer', border: 'none', background: '#d98a9e', color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13.5, padding: '10px 20px', borderRadius: 999, transition: 'background .2s,transform .2s', flex: 'none' }}>Varaa</button>
                  </div>
                ))}
              </div>
            )}

            {/* booking form */}
            {showForm && (
              <div style={{ marginLeft: 38, background: '#fff', border: '1px solid #f1dde3', borderRadius: 16, padding: 16, boxShadow: '0 6px 18px -12px rgba(120,60,78,.4)', animation: 'bmnPop .5s ease both', display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>Vahvista varauksesi</div>
                  {selectedSlot && <div style={{ fontSize: 12.5, color: '#c97f92', fontWeight: 600, marginTop: 3 }}>{selectedSlot.day} {selectedSlot.date} · klo {selectedSlot.time} · {selectedSlot.service}</div>}
                </div>
                <input value={formName}  onChange={e => { setFormName(e.target.value);  setFormError(false); setApiError(null); }} placeholder="Nimi"          style={S.input} />
                <input value={formPhone} onChange={e => { setFormPhone(e.target.value); setFormError(false); setApiError(null); }} placeholder="Puhelinnumero" style={S.input} type="tel" />
                {formError && <div style={{ fontSize: 12, color: '#d4798f', fontWeight: 600 }}>Täytä nimi ja puhelinnumero.</div>}
                {apiError  && <div style={{ fontSize: 12, color: '#d4798f', fontWeight: 600 }}>Virhe: {apiError}</div>}
                <button onClick={handleConfirm} className="bmn-slot-btn" style={{ cursor: 'pointer', border: 'none', background: '#d98a9e', color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 14, padding: '13px 20px', borderRadius: 999, transition: 'background .2s,transform .2s' }}>Vahvista varaus</button>
              </div>
            )}

            {/* typing indicator */}
            {typing && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <img src="/images/anna-avatar.jpg" alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 22%', flex: 'none' }} />
                <div style={{ background: '#f3edef', borderRadius: '18px 18px 18px 5px', padding: '14px 16px', display: 'flex', gap: 4 }}>
                  {[0, .2, .4].map(d => <span key={d} style={{ width: 7, height: 7, borderRadius: '50%', background: '#c3b3b9', animation: `bmnPop .6s ${d}s infinite alternate` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderTop: '1px solid #f4e7eb', background: '#fff' }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(draft); }}
              placeholder={booked ? 'Varaus tehty 💅' : 'Kirjoita viesti…'}
              disabled={booked}
              style={{ flex: 1, border: '1px solid #f0dee4', background: '#fdf7f8', borderRadius: 999, padding: '13px 18px', fontFamily: "'Manrope',sans-serif", fontSize: 14.5, color: '#2c2329', outline: 'none' }}
            />
            <button
              onClick={() => handleSend(draft)}
              disabled={!draft.trim() || booked}
              className="bmn-send-btn"
              aria-label="Lähetä"
              style={{ cursor: 'pointer', border: 'none', background: '#d98a9e', color: '#fff', width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transition: 'background .2s,transform .2s' }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ── PORTFOLIO ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#fffdfc', padding: '74px 18px 90px' }}>
        <div style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 34px' }}>
          <span style={{ color: '#c97f92', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 700 }}>Galleria</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(34px,9vw,52px)', color: '#2c2329', marginTop: 8, lineHeight: 1 }}>Töitämme</h2>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bmn-work-card" style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 14px 34px -20px rgba(120,60,78,.5)' }}>
              <img src={`/images/work-${n}.jpg`} alt={`Kynsityö ${n}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .6s ease' }} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 46 }}>
          <button onClick={scrollToChat} className="bmn-slot-btn" style={{ cursor: 'pointer', border: 'none', background: '#d98a9e', color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15, padding: '16px 40px', borderRadius: 999, boxShadow: '0 14px 34px -14px rgba(217,138,158,.9)', transition: 'background .25s,transform .25s' }}>
            Varaa aika nyt
          </button>
          <p style={{ marginTop: 22, color: '#b3a4aa', fontSize: 12.5, fontWeight: 600, letterSpacing: '.04em' }}>BookMyNails · Helsinki, Suomi</p>
        </div>
      </section>

    </div>
  );
}
