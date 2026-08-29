// Team patterns across several sheets.
//
// Pure functions over an array of hydrated sheets — no DOM, no state. Everything
// here is derived from what people actually filled in; nothing is inferred or
// scored. That matters because the output gets read out loud in a meeting: a
// "shared interest" that only one person listed is worse than no output at all.
//
// Two facts about the inputs shape the code:
//
// 1. A sheet from a share link has `intro.statements` (pre-shuffled, no answer)
//    instead of truth1/truth2/lie. So nothing here may read the answer.
// 2. `bestTimeToPresent` is free text ("mornings, after coffee"). It is displayed
//    but never computed with — only the IANA timezone is machine-readable.

import { CONSOLES } from '../data.js';
import { getRPGClass } from '../data.js';
import { utcOffset } from '../card/model.js';
import { selectedAvatar } from '../card/media.js';

// The window a person is assumed reachable in their own local time. Deliberately
// narrower than "awake": the question this answers is "when can we all meet".
const WORK_START_MIN = 9 * 60;
const WORK_END_MIN = 18 * 60;

const CONSOLE_LABEL = Object.fromEntries(CONSOLES.map(c => [c.id, c.label]));

/**
 * What gets compared across people, and where each lives on a sheet.
 *
 * Ordered by how much a match actually says. Two people naming the same game is
 * a conversation; two people ticking the same platform is a coincidence — which
 * is why platforms sit last and are labelled as such.
 */
// `pick` reaches past the top-N lists into replay/rewatch picks: those are titles
// the person named too, and leaving them out meant a game only one person listed
// as "would replay blind" was invisible to both the shared and the solo lists.
const CATEGORIES = [
  {
    key: 'games', label: 'Games',
    pick: s => [...s.gaming.topGames.map(g => g.name), s.gaming.replayGame?.name],
  },
  {
    key: 'anime', label: 'Anime',
    pick: s => (s.anime.watches ? [...s.anime.topAnime.map(a => a.name), s.anime.comfortRewatch?.name] : []),
  },
  {
    key: 'movies', label: 'Movies & series',
    pick: s => [...s.movies.topMovies.map(m => m.name), s.movies.comfortRewatch?.name],
  },
  { key: 'hobbies',     label: 'Hobbies',        pick: s => [...s.hobbies.selected, s.hobbies.custom] },
  { key: 'animeGenres', label: 'Anime genres',   pick: s => (s.anime.watches ? s.anime.genres : []) },
  { key: 'movieGenres', label: 'Screen genres',  pick: s => s.movies.genres },
  { key: 'platforms',   label: 'Plays on',       pick: s => s.gaming.consoles.map(c => CONSOLE_LABEL[c] || c) },
];

const CATEGORY_RANK = Object.fromEntries(CATEGORIES.map((c, i) => [c.key, i]));

/** Same title typed two ways is still the same title. */
function normKey(text) {
  return String(text).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * A person's UTC offset in minutes, or null when they gave no usable timezone.
 *
 * `longOffset` rather than `shortOffset` because half-hour zones exist and
 * "GMT+5:30" must not round to +5 in the overlap grid.
 */
export function offsetMinutes(timezone) {
  if (!timezone) return null;
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(new Date())
      .find(p => p.type === 'timeZoneName');
    if (!part) return null;
    if (part.value === 'GMT') return 0;
    const m = part.value.match(/GMT([+-])(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
  } catch {
    return null;  // an invalid zone is missing data, not a crash
  }
}

/** Trim a hydrated sheet down to the fields the party board displays. */
export function toMember(sheet, id) {
  const avatar = selectedAvatar(sheet);
  return {
    id,
    sheet,
    name: sheet.identity.name || 'Unnamed',
    rpgClass: getRPGClass(sheet),
    place: [sheet.identity.city, sheet.identity.country].filter(Boolean).join(', '),
    timezone: sheet.identity.timezone || '',
    offsetLabel: utcOffset(sheet.identity.timezone),
    offsetMinutes: offsetMinutes(sheet.identity.timezone),
    bestTime: sheet.identity.bestTimeToPresent || '',
    avatarImage: avatar?.image || '',
    role: sheet.intro.jobTitle || '',
  };
}

function localMinutesAt(utcHour, offset) {
  return ((utcHour * 60 + offset) % 1440 + 1440) % 1440;
}

/**
 * Per-UTC-hour availability, plus the longest run of hours where the most people
 * are free at once.
 *
 * The run search wraps around midnight UTC: a Chile/Japan pair overlaps across
 * the 23:00 boundary, and a non-circular scan reports two short windows instead
 * of one usable one.
 */
export function overlap(members) {
  const placed = members.filter(m => m.offsetMinutes !== null);
  const unknown = members.filter(m => m.offsetMinutes === null).map(m => m.name);

  const hours = Array.from({ length: 24 }, (_, h) => ({
    utcHour: h,
    available: placed
      .filter(m => {
        const local = localMinutesAt(h, m.offsetMinutes);
        return local >= WORK_START_MIN && local < WORK_END_MIN;
      })
      .map(m => m.name),
  }));

  const best = Math.max(0, ...hours.map(h => h.available.length));

  let window = null;
  if (best > 0) {
    let runStart = null;
    let bestRun = null;
    for (let i = 0; i < 48; i++) {
      const hit = hours[i % 24].available.length === best;
      if (hit && runStart === null) runStart = i;
      if (!hit && runStart !== null) {
        const len = i - runStart;
        if (!bestRun || len > bestRun.length) bestRun = { start: runStart % 24, length: len };
        runStart = null;
      }
      // A run cannot be longer than a full day even if every hour qualifies.
      if (runStart !== null && i - runStart >= 24) {
        bestRun = { start: runStart % 24, length: 24 };
        break;
      }
    }
    if (runStart !== null && !bestRun) bestRun = { start: runStart % 24, length: 48 - runStart };
    if (bestRun) {
      window = {
        startUtc: bestRun.start,
        endUtc: (bestRun.start + bestRun.length) % 24,
        length: Math.min(bestRun.length, 24),
        names: hours[bestRun.start].available,
      };
    }
  }

  return { hours, best, window, unknown, placed: placed.length };
}

/**
 * Items grouped by how many people listed them.
 *
 * `shared` needs two people by definition. `solo` is only interesting once there
 * are three or more sheets — in a pair, everything unmatched is "solo" and the
 * list is just both sheets printed back.
 */
export function commonGround(members) {
  const shared = [];
  const solo = [];

  for (const cat of CATEGORIES) {
    const tally = new Map();
    for (const m of members) {
      let picked;
      try {
        picked = cat.pick(m.sheet) || [];
      } catch {
        picked = [];  // a sparse decoded sheet may be missing a nested array
      }
      // De-duplicate within one person so a repeated entry cannot fake a match.
      const seen = new Set();
      for (const raw of picked) {
        if (!raw) continue;
        const key = normKey(raw);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        if (!tally.has(key)) tally.set(key, { label: String(raw), people: [] });
        tally.get(key).people.push(m.name);
      }
    }

    for (const entry of tally.values()) {
      const row = { category: cat.key, categoryLabel: cat.label, label: entry.label, people: entry.people };
      if (entry.people.length >= 2) shared.push(row);
      else solo.push(row);
    }
  }

  // Category first, then headcount. Sorting by headcount alone put "PC: everyone"
  // above a game three people named, which is the opposite of the claim in the
  // CATEGORIES comment: a platform tick is a coincidence, a shared title is a
  // conversation. Category rank also fixes the group order the UI renders in.
  shared.sort((a, b) => CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]
    || b.people.length - a.people.length
    || a.label.localeCompare(b.label));

  // Only titles make an interesting "nobody else" line — a lone hobby or genre
  // is usually just an unfilled field on everyone else's sheet.
  const soloTitles = solo
    .filter(r => ['games', 'anime', 'movies'].includes(r.category))
    .sort((a, b) => a.people[0].localeCompare(b.people[0]) || a.label.localeCompare(b.label));

  return { shared, solo: members.length >= 3 ? soloTitles : [] };
}

/** RPG class tally, most common first. */
export function composition(members) {
  const tally = new Map();
  for (const m of members) {
    if (!tally.has(m.rpgClass)) tally.set(m.rpgClass, []);
    tally.get(m.rpgClass).push(m.name);
  }
  return [...tally.entries()]
    .map(([rpgClass, people]) => ({ rpgClass, people }))
    .sort((a, b) => b.people.length - a.people.length || a.rpgClass.localeCompare(b.rpgClass));
}

function joinNames(names) {
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The two people furthest apart in time, or null when fewer than two are placed.
 *
 * Returns names, not members. A member holds its whole `sheet`, so returning the
 * objects put every field of two people's sheets — including the two-truths
 * answer of anyone whose sheet came from local storage or a .json import — inside
 * the analysis result, which is the thing that gets serialised into the summary.
 */
export function widestGap(members) {
  const placed = members.filter(m => m.offsetMinutes !== null);
  if (placed.length < 2) return null;
  let worst = null;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const raw = Math.abs(placed[i].offsetMinutes - placed[j].offsetMinutes);
      // Time-of-day distance wraps: UTC+13 and UTC-11 are 2 hours apart, not 24.
      const gap = Math.min(raw, 1440 - raw);
      if (!worst || gap > worst.minutes) worst = { a: placed[i].name, b: placed[j].name, minutes: gap };
    }
  }
  return worst;
}

/**
 * Concrete prompts, each tied to something on a real sheet.
 *
 * Deliberately not generic ("what do you like to do?") — the point of collecting
 * the sheets is that the prompt can name the game and the two people who listed
 * it. Every line here must be falsifiable against the roster.
 */
export function icebreakers(members, { shared, solo }, gap) {
  const out = [];

  // "all" is wrong for a pair — "Ada and Sam all listed" reads as a typo, and these
  // lines get read out loud.
  for (const row of shared.filter(r => r.category !== 'platforms').slice(0, 3)) {
    const both = row.people.length === 2 ? 'both' : 'all';
    out.push(`${joinNames(row.people)} ${both} listed **${row.label}**, find out who got furthest.`);
  }

  const withTruths = members.filter(m => (m.sheet.intro.statements?.length || 0) >= 3
    || (m.sheet.intro.truth1 && m.sheet.intro.truth2 && m.sheet.intro.lie));
  if (withTruths.length >= 2) {
    out.push(`${withTruths.length} of you brought two truths and a lie. Run them back to back and keep score.`);
  }

  if (solo.length) {
    const pick = solo[0];
    out.push(`Nobody but ${pick.people[0]} listed **${pick.label}**. Ask for the pitch.`);
  }

  const learners = members.filter(m => m.sheet.intro.currentlyLearning);
  if (learners.length >= 2) {
    const both = learners.length === 2 ? 'are both' : 'are all';
    out.push(`${joinNames(learners.map(m => m.name))} ${both} learning something right now, swap notes.`);
  } else if (learners.length === 1) {
    out.push(`${learners[0].name} is learning ${learners[0].sheet.intro.currentlyLearning}. Ask how it is going.`);
  }

  if (gap && gap.minutes >= 240) {
    out.push(`${gap.a} and ${gap.b} are ${Math.round(gap.minutes / 60)} hours apart. Agree who takes the awkward hour.`);
  }

  const takes = members.filter(m => Object.values(m.sheet.wildcards || {}).some(w => w?.value && !w?.skip));
  if (takes.length >= 2) {
    out.push(`${takes.length} hot takes are on these cards. Read them out unattributed and guess the author.`);
  }

  if (!out.length) {
    out.push('Not much to go on yet: add another sheet or two and the overlaps show up.');
  }
  return out;
}

/** Everything the board needs, from a member list. */
export function analyze(members) {
  const ground = commonGround(members);
  const gap = widestGap(members);
  return {
    overlap: overlap(members),
    ground,
    composition: composition(members),
    gap,
    icebreakers: icebreakers(members, ground, gap),
  };
}

/** UTC hour as "14:00". */
export function fmtHour(h) {
  return `${String(((h % 24) + 24) % 24).padStart(2, '0')}:00`;
}

export { joinNames, CATEGORIES };
