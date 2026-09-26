const RAWG_BASE = 'https://api.rawg.io/api';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const ALLOWED_ORIGINS = [
  'https://charactersheet.neorgon.com',
  'http://localhost:8814',
  'http://127.0.0.1:8814',
];

// Upstream records are third-party data: RAWG and TMDB take community edits. The
// page renders these fields into HTML and stores them in the sheet, so emit only
// plain strings or numbers, and only https image URLs. The page escapes at render
// as well; this layer means a bad record never reaches it in the first place.
function scalar(v) {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return '';
}

function httpsUrl(v) {
  if (typeof v !== 'string' || !v) return '';
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

function list(v) {
  return Array.isArray(v) ? v : [];
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300',
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: corsHeaders(request),
      });
    }

    const origin = request.headers.get('Origin') || '';
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }

    const referer = request.headers.get('Referer') || '';
    if (!origin && referer && !ALLOWED_ORIGINS.some(o => referer.startsWith(o))) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const query = url.searchParams.get('q');

    if (!type || !query || query.length < 2) {
      return new Response(JSON.stringify([]), { headers: corsHeaders(request) });
    }

    try {
      let results;
      switch (type) {
        case 'game':
          results = await searchGames(query, env);
          break;
        case 'anime':
          results = await searchAnime(query);
          break;
        case 'character':
          results = await searchAnimeCharacters(query);
          break;
        case 'movie':
          results = await searchMovies(query, env);
          break;
        default:
          return new Response(JSON.stringify({ error: 'Unknown type' }), {
            status: 400, headers: corsHeaders(request),
          });
      }
      return new Response(JSON.stringify(results), { headers: corsHeaders(request) });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Upstream error' }), {
        status: 502, headers: corsHeaders(request),
      });
    }
  },
};

async function searchGames(query, env) {
  const url = `${RAWG_BASE}/games?key=${env.RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return list(data.results).filter(g => g && typeof g === 'object').map(g => ({
    id: scalar(g.id),
    name: scalar(g.name),
    image: httpsUrl(g.background_image),
    year: typeof g.released === 'string' ? g.released.slice(0, 4) : '',
    platforms: list(g.platforms).map(p => scalar(p?.platform?.name)).slice(0, 3).join(', '),
  }));
}

async function searchAnime(query) {
  const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return list(data.data).filter(a => a && typeof a === 'object').map(a => ({
    id: scalar(a.mal_id),
    name: scalar(a.title),
    image: httpsUrl(a.images?.jpg?.small_image_url),
    imageLarge: httpsUrl(a.images?.jpg?.large_image_url) || httpsUrl(a.images?.jpg?.image_url),
    year: scalar(a.year) || (typeof a.aired?.from === 'string' ? a.aired.from.slice(0, 4) : ''),
    episodes: scalar(a.episodes) ? `${scalar(a.episodes)} eps` : '',
  }));
}

async function searchAnimeCharacters(query) {
  const url = `${JIKAN_BASE}/characters?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return list(data.data).filter(c => c && typeof c === 'object').map(c => ({
    id: scalar(c.mal_id),
    name: scalar(c.name),
    image: httpsUrl(c.images?.jpg?.small_image_url) || httpsUrl(c.images?.jpg?.image_url),
    imageLarge: httpsUrl(c.images?.jpg?.image_url),
    nicknames: list(c.nicknames).slice(0, 2).map(scalar).join(', '),
  }));
}

async function searchMovies(query, env) {
  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=1&include_adult=false`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.TMDB_READ_TOKEN}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return list(data.results)
    .filter(r => r && (r.media_type === 'movie' || r.media_type === 'tv'))
    .slice(0, 8)
    .map(m => ({
      id: scalar(m.id),
      name: scalar(m.title || m.name),
      image: typeof m.poster_path === 'string' && m.poster_path.startsWith('/')
        ? httpsUrl(`${TMDB_IMG}${m.poster_path}`) : '',
      year: String(scalar(m.release_date || m.first_air_date)).slice(0, 4),
      type: m.media_type === 'tv' ? 'Series' : 'Movie',
    }));
}
