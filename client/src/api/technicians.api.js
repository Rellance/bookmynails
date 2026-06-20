// HTTP-kutsut mestareille — käytä näitä komponenteissa fetch-kutsujen sijaan.
const BASE = '/api/technicians';

export async function fetchTechnicians() {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Virhe mestareiden haussa');
  return res.json();
}

export async function fetchTechnician(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Mestaria ei löydy');
  return res.json();
}
