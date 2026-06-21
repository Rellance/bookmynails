import { API_BASE_URL } from '../config.js';

export async function fetchTechnicians() {
  const res = await fetch(`${API_BASE_URL}/api/technicians`);
  if (!res.ok) throw new Error('Virhe mestareiden haussa');
  return res.json();
}

export async function fetchTechnician(id) {
  const res = await fetch(`${API_BASE_URL}/api/technicians/${id}`);
  if (!res.ok) throw new Error('Mestaria ei löydy');
  return res.json();
}
