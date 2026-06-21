import { API_BASE_URL } from '../config.js';

export async function fetchServices(technicianId) {
  const params = technicianId ? `?technicianId=${technicianId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/services${params}`);
  if (!res.ok) throw new Error('Virhe palveluiden haussa');
  return res.json();
}
