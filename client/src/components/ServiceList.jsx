// Palvelulista. Asiakkaalle: vain luku. Mestarille: muokkausnapit.
// Props: services (array), editable (bool), onEdit (fn), onDelete (fn)
export default function ServiceList({ services = [], editable, onEdit, onDelete }) {
  if (!services.length) return <p>Ei palveluita.</p>;
  return (
    <ul>
      {services.map((s) => (
        <li key={s.id}>
          {s.name_fi} — {s.price_eur} € / {s.duration_minutes} min
          {editable && (
            <>
              <button onClick={() => onEdit?.(s)}>Muokkaa</button>
              <button onClick={() => onDelete?.(s.id)}>Poista</button>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
