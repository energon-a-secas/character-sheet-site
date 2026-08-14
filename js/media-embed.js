// Work out what a pasted URL actually points at, so a meme can be shown rather
// than merely linked.
//
// Three kinds are worth distinguishing and no more: a YouTube video (which has a
// predictable thumbnail URL), a direct image (which is its own thumbnail), and
// everything else (which gets a link and no promises). Guessing harder than that
// means fetching the URL to sniff it, and the card renders offline.

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;

const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com',
  'youtu.be', 'www.youtu.be', 'music.youtube.com',
]);

/**
 * The video id in a YouTube URL, or null.
 *
 * Covers the four shapes people actually paste: `watch?v=`, `youtu.be/<id>`,
 * `/shorts/<id>` and `/embed/<id>`.
 */
function youtubeId(u) {
  if (!YOUTUBE_HOSTS.has(u.hostname)) return null;

  const fromQuery = u.searchParams.get('v');
  if (fromQuery && /^[\w-]{6,20}$/.test(fromQuery)) return fromQuery;

  const parts = u.pathname.split('/').filter(Boolean);
  if (u.hostname.endsWith('youtu.be') && parts[0]) {
    return /^[\w-]{6,20}$/.test(parts[0]) ? parts[0] : null;
  }
  if ((parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') && parts[1]) {
    return /^[\w-]{6,20}$/.test(parts[1]) ? parts[1] : null;
  }
  return null;
}

/**
 * Classify a pasted URL.
 *
 * Returns `null` for anything that is not an absolute http(s) URL. That check is
 * load-bearing rather than tidiness: the result feeds an `href` and an `<img
 * src>`, and `javascript:` in an href is executable. Refusing every other scheme
 * up front is cheaper than sanitising per call site.
 *
 * `thumb` is a remote URL. On the card it is only rendered if it inlined
 * successfully (see js/card/export.js) — an arbitrary image host is under no
 * obligation to send CORS headers, and a PNG export must not contain a hole.
 */
export function classifyMediaUrl(raw) {
  const text = (raw || '').trim();
  if (!text) return null;

  let u;
  try {
    u = new URL(text);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const vid = youtubeId(u);
  if (vid) {
    return {
      kind: 'youtube',
      href: `https://www.youtube.com/watch?v=${vid}`,
      thumb: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
      label: 'YouTube',
    };
  }

  if (IMAGE_EXT.test(u.pathname)) {
    return { kind: 'image', href: u.href, thumb: u.href, label: 'Image' };
  }

  return { kind: 'link', href: u.href, thumb: '', label: u.hostname.replace(/^www\./, '') };
}

/** The memes worth showing: a slot counts once it has a URL or a note. */
export function filledMemes(sheet) {
  return (sheet.extras.memes || [])
    .map(m => ({ ...m, media: classifyMediaUrl(m.url) }))
    .filter(m => m.url || m.note);
}
