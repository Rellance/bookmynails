// HTTP-kutsut varauksille.
export async function createBooking(data) {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Varauksen luonti epäonnistui');
  }
  return res.json();
}

export async function fetchBookings(technicianId) {
  const params = technicianId ? `?technicianId=${technicianId}` : '';
  const res = await fetch(`/api/bookings${params}`);
  if (!res.ok) throw new Error('Virhe varausten haussa');
  return res.json();
}
