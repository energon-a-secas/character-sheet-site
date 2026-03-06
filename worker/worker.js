const RAWG_BASE = 'https://api.rawg.io/api';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const JIKAN_BASE = 'https://api.jikan.moe/v4';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const ALLOWED_ORIGINS = [
  'https://charactersheet.neorgon.com',
  'http://localhost:8889',
  'http://localhost:8888',
];

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
  return (data.results || []).map(g => ({
    id: g.id,
    name: g.name,
    image: g.background_image || '',
    year: g.released ? g.released.slice(0, 4) : '',
    platforms: (g.platforms || []).map(p => p.platform.name).slice(0, 3).join(', '),
  }));
}

async function searchAnime(query) {
  const url = `${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=8&sfw=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map(a => ({
    id: a.mal_id,
    name: a.title,
    image: a.images?.jpg?.small_image_url || '',
    imageLarge: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || '',
    year: a.year || (a.aired?.from ? a.aired.from.slice(0, 4) : ''),
    episodes: a.episodes ? `${a.episodes} eps` : '',
  }));
}

async function searchAnimeCharacters(query) {
  const url = `${JIKAN_BASE}/characters?q=${encodeURIComponent(query)}&limit=8`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.data || []).map(c => ({
    id: c.mal_id,
    name: c.name,
    image: c.images?.jpg?.small_image_url || c.images?.jpg?.image_url || '',
    imageLarge: c.images?.jpg?.image_url || '',
    nicknames: (c.nicknames || []).slice(0, 2).join(', '),
  }));
}

async function searchMovies(query, env) {
  const url = `${TMDB_BASE}/search/multi?query=${encodeURIComponent(query)}&page=1&include_adult=false`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.TMDB_READ_TOKEN}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || [])
    .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
    .slice(0, 8)
    .map(m => ({
      id: m.id,
      name: m.title || m.name,
      image: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : '',
      year: (m.release_date || m.first_air_date || '').slice(0, 4),
      type: m.media_type === 'tv' ? 'Series' : 'Movie',
    }));
}
