// Share links carry the whole sheet in the URL hash.
//
// Nothing is uploaded: the fragment never leaves the browser as part of an HTTP
// request, so a shared card is readable by whoever holds the link and by nobody
// else. That is also why the QR code is generated locally (js/share/qr.js) —
// handing the URL to a third-party QR service would hand over the answers too.
//
// One field is transformed rather than copied: the two-truths answer. See
// `shuffleTruths` below.

import { seededShuffle } from '../card/model.js';

// Fields deliberately excluded from a share link: they are either session state
// or not the person's own content.
const OMIT = new Set(['_user', '_sheetId', '_sheetName', 'currentSection', 'showBuilder']);

/** Strip empty values so the encoded payload stays small. */
function prune(value) {
  if (Array.isArray(value)) {
    const arr = value.map(prune).filter(v => v !== undefined);
    return arr.length ? arr : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (OMIT.has(k)) continue;
      const p = prune(v);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (value === '' || value === null || value === undefined) return undefined;
  return value;
}

function toBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function gzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/**
 * Replace truth1/truth2/lie with the three statements in shuffled order and no
 * marker saying which is false.
 *
 * The reader page renders the statements and invites you to guess, so shipping a
 * field literally named `lie` would hand the answer to anyone who opened devtools
 * or read the decoded JSON. Shuffling in the *encoder* means the answer is absent
 * from the link, not merely unrendered — the only honest way to make the page's
 * "the answer is not in this link" claim true.
 *
 * The order is the same stable shuffle the card uses, so a shared card and the
 * sender's own card list the statements identically.
 */
function shuffleTruths(sheet) {
  const intro = sheet.intro;
  if (!intro) return sheet;

  const items = [intro.truth1, intro.truth2, intro.lie].filter(Boolean);
  const { truth1, truth2, lie, ...rest } = intro;
  if (items.length < 3) return { ...sheet, intro: rest };

  const seed = [sheet.identity?.name, truth1, truth2, lie].join('|') || 'seed';
  return { ...sheet, intro: { ...rest, statements: seededShuffle(items, seed) } };
}

/** Encode a sheet into a hash payload string. */
export async function encodeSheet(state) {
  const payload = shuffleTruths(prune(state) || {});
  const json = JSON.stringify(payload);
  const raw = new TextEncoder().encode(json);
  return toBase64Url(await gzip(raw));
}

/**
 * Encode several sheets as one roster payload.
 *
 * Gzipped as a single array rather than as concatenated per-sheet payloads: the
 * sheets of one team repeat each other heavily (same city, same platforms, the
 * same three shows), and one compression window over all of them is far smaller
 * than the sum of separate ones.
 *
 * Every sheet goes through the same answer-stripping as a single share link — a
 * roster assembled from someone's own local sheet must not leak their lie just
 * because it took a different code path.
 */
export async function encodeRoster(sheets) {
  const payload = sheets.map(s => shuffleTruths(prune(s) || {}));
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  return toBase64Url(await gzip(raw));
}

/** Decode a roster payload back into an array of sheets. Throws on bad input. */
export async function decodeRoster(payload) {
  const bytes = await gunzip(fromBase64Url(payload));
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(parsed)) throw new Error('not a roster');
  return parsed;
}

/** Absolute party URL carrying the whole roster. */
export async function buildRosterUrl(sheets, { base } = {}) {
  const origin = base || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return `${origin}party.html#r=${await encodeRoster(sheets)}`;
}

/** Read a roster out of the current URL, or null when there is none. */
export async function readRosterFromLocation() {
  const m = location.hash.match(/[#&]r=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    return await decodeRoster(m[1]);
  } catch {
    return null;
  }
}

/** Decode a hash payload back into a sheet object. Throws on malformed input. */
export async function decodeSheet(payload) {
  const bytes = await gunzip(fromBase64Url(payload));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** Absolute, shareable read-only card URL for this sheet. */
export async function buildShareUrl(state, { base } = {}) {
  const origin = base || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  const payload = await encodeSheet(state);
  return `${origin}card.html#s=${payload}`;
}

/** Read the sheet out of the current URL, or null when there is none. */
export async function readSheetFromLocation() {
  const m = location.hash.match(/[#&]s=([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    return await decodeSheet(m[1]);
  } catch {
    return null;
  }
}

/** Pull the payload out of a pasted card URL (or a bare payload). */
export function payloadFromUrl(input) {
  const text = (input || '').trim();
  if (!text) return null;
  const m = text.match(/[#&]s=([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{16,}$/.test(text) ? text : null;
}
