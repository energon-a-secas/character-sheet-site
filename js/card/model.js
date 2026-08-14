// The card model: turns interview state into an ordered list of renderable blocks.
//
// This is deliberately separate from rendering. The model decides *what is worth
// saying* and how badly it wants to be on the card; the renderer decides how it
// looks and what still fits. Adding a field to the card means adding it here once,
// not in a draw function plus a matching measure function.

import {
  getRPGClass, PLATFORMS, FREE_TIME_OPTIONS,
  GUNDAMS, DB_FORMS, TF_FACTIONS, goldSaintById,
} from '../data.js';
import { filledMemes } from '../media-embed.js';
import { selectedAvatar, highlightedMedia } from './media.js';

// Higher priority survives when a fixed-size layout has to drop content.
// The ordering encodes the product claim: practical collaboration info beats taste.
export const PRIORITY = {
  essential: 100,  // never dropped — identity, class
  high: 80,        // the reason a colleague opens the card
  medium: 50,      // taste and personality
  low: 20,         // nice to have
};

const WILDCARD_LABELS = {
  weirdThing: 'Weird, but not really',
  lifeHack: 'Life hack',
  hillToDieOn: 'Hill to die on',
  guiltyPleasure: 'Guilty pleasure',
  threeApps: 'Only 3 apps',
  breakfastSTier: 'S-tier breakfast',
};

/**
 * Deterministic shuffle. The two-truths order must be stable across the card,
 * the deck and the presenter script for a given sheet, or the card gives the
 * lie away by position while the deck says something else.
 */
export function seededShuffle(items, seed) {
  const out = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A stable per-sheet seed, so the same answers always shuffle the same way. */
export function sheetSeed(s) {
  return [s.identity.name, s.intro.truth1, s.intro.truth2, s.intro.lie].join('|') || 'seed';
}

/**
 * The two-truths statements in stable shuffled order, each tagged with whether
 * it is the lie. Consumers that must not reveal the answer ignore `isLie`.
 *
 * A sheet decoded from a share link has no answer to tag: the encoder replaces
 * the three fields with a pre-shuffled `statements` array (js/share/link.js), so
 * `isLie` is null there rather than false — "unknown", not "true".
 */
export function getTwoTruths(s) {
  if (Array.isArray(s.intro.statements)) {
    return s.intro.statements.filter(Boolean).map(text => ({ text, isLie: null }));
  }

  const items = [
    { text: s.intro.truth1, isLie: false },
    { text: s.intro.truth2, isLie: false },
    { text: s.intro.lie, isLie: true },
  ].filter(i => i.text);
  if (items.length < 3) return [];
  return seededShuffle(items, sheetSeed(s));
}

/**
 * The Legends facts worth printing.
 *
 * `goldSaint` is skipped while `goldSaintMode` is `lost` — the interview hides the
 * chips in that mode rather than clearing the field, so an earlier pick is still
 * sitting there and must not reach the card. Same contract as
 * `anime.waifuHusbandoSkip`.
 */
export function legendFacts(s) {
  const l = s.legends;
  if (!l) return [];
  const items = [];

  const saint = l.goldSaintMode === 'lost' ? null : goldSaintById(l.goldSaint);
  if (saint) {
    items.push({ label: 'Gold Saint', value: `${saint.saint} of ${saint.sign} ${saint.symbol}` });
  }

  const gundam = GUNDAMS.find(g => g.id === l.gundam);
  if (gundam) {
    items.push({
      label: 'Mobile suit',
      // The joke only lands if the card is in on it. Printing "Optimus Prime"
      // under "Mobile suit" with a straight face reads as a data error.
      value: gundam.impostor ? `${gundam.name} — which is not a Gundam` : gundam.name,
    });
  }

  const form = DB_FORMS.find(f => f.id === l.dbForm);
  if (form) items.push({ label: 'Running on', value: form.label });

  const faction = TF_FACTIONS.find(f => f.id === l.tfFaction);
  if (faction) items.push({ label: 'Allegiance', value: faction.label });

  if (l.saturdayHero)     items.push({ label: 'Saturday-morning hero', value: l.saturdayHero });
  if (l.firstMachine)     items.push({ label: 'First machine', value: l.firstMachine });
  if (l.openingTheme)     items.push({ label: 'Knows by heart', value: l.openingTheme });
  if (l.arcadeGame)       items.push({ label: 'Ate my coins', value: l.arcadeGame });
  if (l.meetingChampion)  items.push({ label: 'Sends into bad meetings', value: l.meetingChampion });

  return items;
}

function freeTimeLabel(s) {
  if (s.intro.freeTimeChoice === 'custom') return s.intro.freeTimeCustom;
  const opt = FREE_TIME_OPTIONS.find(o => o.id === s.intro.freeTimeChoice);
  return opt ? opt.label : '';
}

/** Current local time in a IANA zone, as "14:20" — undefined if the zone is bad. */
function localTimeIn(timezone) {
  if (!timezone) return '';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit',
    }).format(new Date());
  } catch { return ''; }
}

/** UTC offset as "UTC-3" for a zone. */
export function utcOffset(timezone) {
  if (!timezone) return '';
  try {
    const now = new Date();
    const tz = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
      .formatToParts(now).find(p => p.type === 'timeZoneName');
    return tz ? tz.value.replace('GMT', 'UTC') : '';
  } catch { return ''; }
}

/**
 * Build the full card model. Every block carries a priority so a fixed-size
 * layout can drop the least important content and say what it dropped.
 */
export function buildCardModel(s) {
  const blocks = [];
  const push = (b) => { if (b) blocks.push(b); };

  // ── Identity header ───────────────────────────────────────────────────────
  const avatar = selectedAvatar(s);
  const offset = utcOffset(s.identity.timezone);
  const place = [s.identity.city, s.identity.country].filter(Boolean).join(', ');

  const header = {
    id: 'header',
    kind: 'header',
    priority: PRIORITY.essential,
    name: s.identity.name || 'Unknown Adventurer',
    rpgClass: getRPGClass(s),
    avatar: avatar ? { image: avatar.image, label: avatar.label, type: avatar.type } : null,
    role: [s.intro.jobTitle, s.intro.yearsExperience].filter(Boolean).join(' · '),
    prevCompany: s.intro.prevCompany,
    place,
    timezone: s.identity.timezone,
    utcOffset: offset,
    localTime: localTimeIn(s.identity.timezone),
    bestTime: s.identity.bestTimeToPresent,
    description: s.identity.description,
  };
  push(header);

  // ── How to work with me — the practical half, ranked highest ──────────────
  const workFacts = [];
  if (offset || place) {
    workFacts.push({
      label: 'Where / when',
      value: [place, offset].filter(Boolean).join(' · '),
    });
  }
  if (s.identity.bestTimeToPresent) {
    workFacts.push({ label: 'Best reached', value: s.identity.bestTimeToPresent });
  }
  if (s.intro.currentlyLearning) {
    workFacts.push({ label: 'Currently learning', value: s.intro.currentlyLearning });
  }
  if (workFacts.length) {
    push({ id: 'work', kind: 'facts', priority: PRIORITY.high, title: 'Working with me', items: workFacts });
  }

  // ── Story ─────────────────────────────────────────────────────────────────
  const storyFacts = [];
  if (s.intro.careerHighlight) storyFacts.push({ label: 'Proudest of', value: s.intro.careerHighlight });
  if (s.intro.unknownFact) storyFacts.push({ label: 'Few people know', value: s.intro.unknownFact });
  const ft = freeTimeLabel(s);
  if (ft) storyFacts.push({ label: 'Free time', value: ft });
  if (storyFacts.length) {
    push({ id: 'story', kind: 'facts', priority: PRIORITY.high, title: 'My story', items: storyFacts });
  }
  if (s.intro.motto) {
    push({ id: 'motto', kind: 'quote', priority: PRIORITY.medium, text: s.intro.motto });
  }

  // ── Two truths and a lie — shuffled, answer withheld ──────────────────────
  const truths = getTwoTruths(s);
  if (truths.length) {
    push({
      id: 'truths',
      kind: 'truths',
      priority: PRIORITY.high,
      title: 'Two truths, one lie',
      hint: 'One of these is false. Ask me which.',
      items: truths.map(t => t.text),
    });
  }

  // ── Taste: gaming / anime / movies as parallel columns ────────────────────
  const taste = [];
  const gameItems = s.gaming.topGames.map(g => g.name);
  if (gameItems.length || s.gaming.replayGame || s.gaming.favoriteCharacter || s.gaming.worstGame) {
    taste.push({
      key: 'gaming',
      title: 'Gaming',
      list: gameItems,
      extras: [
        s.gaming.consoles.length && { label: 'Plays on', value: s.gaming.consoles.map(c => c.toUpperCase()).join(' / ') },
        s.gaming.replayGame && { label: 'Would replay blind', value: s.gaming.replayGame.name },
        s.gaming.favoriteCharacter && { label: 'Favourite character', value: s.gaming.favoriteCharacter },
        s.gaming.worstGame && { label: 'Never again', value: s.gaming.worstGame },
      ].filter(Boolean),
    });
  }

  if (s.anime.watches) {
    const animeItems = s.anime.topAnime.map(a => a.name);
    if (animeItems.length || s.anime.favoriteCharacterData || s.anime.subDub) {
      taste.push({
        key: 'anime',
        title: 'Anime',
        list: animeItems,
        extras: [
          s.anime.subDub && { label: 'Sub or dub', value: s.anime.subDub },
          s.anime.genres.length && { label: 'Genres', value: s.anime.genres.join(', ') },
          s.anime.favoriteCharacterData && { label: 'Favourite character', value: s.anime.favoriteCharacterData.name },
          s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip && { label: 'Waifu / husbando', value: s.anime.waifuHusbandoData.name },
          s.anime.comfortRewatch && { label: 'Comfort rewatch', value: s.anime.comfortRewatch.name },
          s.anime.worstAnime && { label: 'Never again', value: s.anime.worstAnime },
        ].filter(Boolean),
      });
    }
  }

  const movieItems = s.movies.topMovies.map(m => m.name);
  if (movieItems.length || s.movies.favoriteQuote || s.movies.marvelHero || s.movies.dcHero) {
    const fandom = [];
    if (s.movies.starWars && s.movies.starWarsTrilogy) {
      fandom.push(`${cap(s.movies.starWarsTrilogy)} trilogy${s.movies.starWarsSide ? ` · ${cap(s.movies.starWarsSide)} side` : ''}`);
    }
    if (s.movies.marvel && s.movies.marvelHero) fandom.push(`Marvel: ${s.movies.marvelHero}`);
    if (s.movies.dc && s.movies.dcHero) fandom.push(`DC: ${s.movies.dcHero}`);
    taste.push({
      key: 'movies',
      title: 'Movies & series',
      list: movieItems,
      extras: [
        s.movies.genres.length && { label: 'Genres', value: s.movies.genres.join(', ') },
        fandom.length && { label: 'Fandom', value: fandom.join(' · ') },
        s.movies.comfortRewatch && { label: 'Comfort rewatch', value: s.movies.comfortRewatch.name },
        s.movies.worstMovie && { label: 'Never again', value: s.movies.worstMovie },
      ].filter(Boolean),
    });
  }

  if (taste.length) {
    push({ id: 'taste', kind: 'columns', priority: PRIORITY.medium, columns: taste });
  }

  if (s.movies.favoriteQuote) {
    push({
      id: 'quote',
      kind: 'quote',
      priority: PRIORITY.medium,
      text: s.movies.favoriteQuote,
      source: s.movies.favoriteQuoteSource,
    });
  }

  // ── Hobbies ───────────────────────────────────────────────────────────────
  const hobbies = [...s.hobbies.selected];
  if (s.hobbies.custom) hobbies.push(s.hobbies.custom);
  if (hobbies.length || s.hobbies.creative) {
    push({
      id: 'hobbies',
      kind: 'tags',
      priority: PRIORITY.medium,
      title: 'Hobbies',
      tags: hobbies,
      note: s.hobbies.creative ? { label: 'Creative', value: s.hobbies.creative } : null,
    });
  }

  // ── Hot takes ─────────────────────────────────────────────────────────────
  const takes = Object.entries(s.wildcards)
    .filter(([, v]) => v.value && !v.skip)
    .map(([k, v]) => ({ label: WILDCARD_LABELS[k] || k, value: v.value }));
  if (takes.length) {
    push({ id: 'takes', kind: 'facts', priority: PRIORITY.medium, title: 'Hot takes', items: takes });
  }

  // ── Legends ───────────────────────────────────────────────────────────────
  const legends = legendFacts(s);
  if (legends.length) {
    push({ id: 'legends', kind: 'facts', priority: PRIORITY.medium, title: 'Legends', items: legends });
  }

  // ── Memes ─────────────────────────────────────────────────────────────────
  filledMemes(s).forEach((m, i) => {
    push({
      id: `meme${i}`,
      kind: 'link',
      priority: PRIORITY.low,
      title: i === 0 ? 'Lives in my head rent-free' : 'Also this',
      url: m.url,
      note: m.note,
      // A remote URL. `renderCard` only draws it once it has been inlined, so a
      // host that refuses CORS costs the thumbnail and nothing else.
      thumb: m.media?.thumb || '',
    });
  });

  // ── Socials ───────────────────────────────────────────────────────────────
  const handles = s.identity.handles.filter(h => h.handle);
  if (s.cardConfig.showSocials && handles.length) {
    push({
      id: 'socials',
      kind: 'socials',
      priority: PRIORITY.low,
      items: handles.map(h => ({
        label: PLATFORMS.find(p => p.id === h.platform)?.label || h.platform,
        handle: h.handle,
      })),
    });
  }

  // ── Media grid ────────────────────────────────────────────────────────────
  const media = s.cardConfig.showCollection ? highlightedMedia(s) : [];
  if (media.length) {
    push({ id: 'media', kind: 'media', priority: PRIORITY.low, items: media });
  }

  return { blocks, header };
}

/** Every remote image the card needs, for preloading / inlining. */
export function collectImageUrls(model) {
  const urls = [];
  if (model.header.avatar?.image) urls.push(model.header.avatar.image);
  const mediaBlock = model.blocks.find(b => b.kind === 'media');
  if (mediaBlock) mediaBlock.items.forEach(m => { if (m.image) urls.push(m.image); });
  model.blocks.forEach(b => { if (b.kind === 'link' && b.thumb) urls.push(b.thumb); });
  return [...new Set(urls)];
}

function cap(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}
