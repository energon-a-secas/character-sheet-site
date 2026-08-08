const WORKER_URL = location.hostname === 'localhost'
  ? 'https://charactersheet-api.neorgon.workers.dev'
  : 'https://charactersheet-api.neorgon.workers.dev';

async function query(type, q) {
  if (!q || q.length < 2) return [];
  try {
    const res = await fetch(`${WORKER_URL}?type=${type}&q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

export function searchGames(q) { return query('game', q); }
export function searchAnime(q) { return query('anime', q); }
export function searchAnimeCharacters(q) { return query('character', q); }
export function searchMovies(q) { return query('movie', q); }

// Open-Meteo geocoding — keyless, and returns the IANA timezone with the city,
// which Nominatim does not. The timezone drives the "when am I online" badge.
export async function searchCities(q) {
  if (!q || q.length < 2) return [];
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map(item => ({
      name: item.name,
      country: item.country || '',
      region: item.admin1 || '',
      timezone: item.timezone || '',
      lat: item.latitude,
      lon: item.longitude,
    }));
  } catch (err) {
    console.warn('City search failed:', err);
    return [];
  }
}
