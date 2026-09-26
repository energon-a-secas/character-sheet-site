import { httpsUrl } from './utils.js';

const WORKER_URL = location.hostname === 'localhost'
  ? 'https://charactersheet-api.neorgon.workers.dev'
  : 'https://charactersheet-api.neorgon.workers.dev';

// Every search result is third-party data: RAWG and TMDB take community edits, and
// whatever they return is rendered into the dropdown and then stored in the sheet.
// Keep only the fields the app reads, as plain strings or numbers, and only https
// image URLs. The sinks still escape; this is the second layer, not the only one.
const TEXT_FIELDS = ['name', 'year', 'type', 'platforms', 'episodes', 'nicknames'];
const IMAGE_FIELDS = ['image', 'imageLarge'];

function scalar(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return '';
}

function cleanResult(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const out = { id: scalar(r.id) };
  for (const k of TEXT_FIELDS) if (k in r) out[k] = scalar(r[k]);
  for (const k of IMAGE_FIELDS) if (k in r) out[k] = httpsUrl(r[k]);
  return out;
}

async function query(type, q) {
  if (!q || q.length < 2) return [];
  try {
    const res = await fetch(`${WORKER_URL}?type=${type}&q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.map(cleanResult).filter(Boolean) : [];
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
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.filter(item => item && typeof item === 'object').map(item => ({
      name: String(scalar(item.name)),
      country: String(scalar(item.country)),
      region: String(scalar(item.admin1)),
      timezone: String(scalar(item.timezone)),
      lat: item.latitude,
      lon: item.longitude,
    }));
  } catch (err) {
    console.warn('City search failed:', err);
    return [];
  }
}
