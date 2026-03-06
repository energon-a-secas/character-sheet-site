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
