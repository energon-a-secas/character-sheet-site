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

export async function searchCities(q) {
  if (!q || q.length < 2) return [];
  try {
    // Using OpenStreetMap Nominatim (free, no key required)
    const osmRes = await fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1`, {
      headers: { 'User-Agent': 'CharacterSheet/1.0' }
    });
    if (!osmRes.ok) return [];
    const osmData = await osmRes.json();
    return osmData.map(item => ({
      name: item.name || item.display_name.split(',')[0],
      country: item.address?.country || '',
      region: item.address?.state || item.address?.region || '',
      timezone: 'UTC', // OSM doesn't provide timezone - would need separate lookup
      lat: item.lat,
      lon: item.lon,
    }));
  } catch (err) {
    console.warn('City search failed:', err);
    return [];
  }
}
