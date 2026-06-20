// HTTP-kutsut palveluille.
export async function fetchServices(technicianId) {
  const params = technicianId ? `?technicianId=${technicianId}` : '';
  const res = await fetch(`/api/services${params}`);
  if (!res.ok) throw new Error('Virhe palveluiden haussa');
  return res.json();
}
