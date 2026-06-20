// Aikaslottikomponentti: näyttää vapaat ajat kalenterinäkymässä tai listana.
// Props: slots (array), onSelect (fn), selectedSlotId (number | null)
// TODO: hae vapaat ajat availabilityApi:sta, merkitse valittu
export default function TimeSlotPicker({ slots = [], onSelect, selectedSlotId }) {
  if (!slots.length) return <p>Ei vapaita aikoja valitulle päivälle.</p>;
  return (
    <ul>
      {slots.map((slot) => (
        <li key={slot.id}>
          <button
            onClick={() => onSelect?.(slot.id)}
            aria-pressed={slot.id === selectedSlotId}
          >
            {new Date(slot.start_at).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
          </button>
        </li>
      ))}
    </ul>
  );
}
