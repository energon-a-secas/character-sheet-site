// The shape of a sheet, and nothing else.
//
// Deliberately free of dependencies. state.js owns the *live* sheet and therefore
// pulls in Convex; the read-only card page needs the shape but must not load a
// backend client it never calls — its CSP forbids the CDN that Convex ships from.
// Keeping the shape here lets both import it.

/**
 * A complete, empty sheet — the single definition of the sheet's shape.
 *
 * Returned fresh each call so callers cannot share nested objects. Both the live
 * `state` and `resetState` are built from this: when the two were written out by
 * hand they drifted, and `resetState` silently stopped clearing fields that had
 * been added to only one of them.
 */
export function blankSheet() {
  return {
    currentSection: 0,

    identity: {
      name: '',
      handles: [],
      country: '',
      city: '',
      timezone: '',
      bestTimeToPresent: '',
      description: '',
    },

    gaming: {
      consoles: [],
      topGames: [],
      replayGame: null,
      favoriteCharacter: '',
      worstGame: '',
    },

    anime: {
      watches: null,
      topAnime: [],
      genres: [],
      favoriteFromGenre: '',
      favoriteCharacterData: null,
      waifuHusbandoData: null,
      waifuHusbandoSkip: '',
      subDub: '',
      comfortRewatch: null,
      worstAnime: '',
    },

    movies: {
      topMovies: [],
      genres: [],
      favoriteFromGenre: '',
      starWars: null,
      starWarsTrilogy: '',
      starWarsSide: '',
      marvel: null,
      marvelHero: '',
      dc: null,
      dcHero: '',
      comfortRewatch: null,
      favoriteQuote: '',
      favoriteQuoteSource: '',
      worstMovie: '',
    },

    hobbies: {
      selected: [],
      custom: '',
      creative: '',
    },

    wildcards: {
      weirdThing: { value: '', skip: '' },
      lifeHack: { value: '', skip: '' },
      hillToDieOn: { value: '', skip: '' },
      guiltyPleasure: { value: '', skip: '' },
      threeApps: { value: '', skip: '' },
      breakfastSTier: { value: '', skip: '' },
    },

    // Saturday-morning canon. Deliberately its own section rather than a branch of
    // `anime`: these are broadcast-TV memories, and gating them behind "do you
    // watch anime?" hides them from the people most likely to have an answer.
    legends: {
      // One of the twelve zodiac ids. The twelve Gold Saints *are* the twelve
      // signs, so this single field answers both framings of the question;
      // `goldSaintMode` only decides which one the chips are labelled with.
      goldSaint: '',
      goldSaintMode: '',   // '' | 'zodiac' (asked by sign) | 'lost' (never seen it)
      gundam: '',
      dbForm: '',
      tfFaction: '',
      retroDepth: '',
      firstMachine: '',
      openingTheme: '',
      saturdayHero: '',
      arcadeGame: '',
      meetingChampion: '',
    },

    extras: {
      // Two slots. `url` is classified at render time into a YouTube thumbnail,
      // a direct image, or a plain link — see js/media-embed.js.
      memes: [{ url: '', note: '' }, { url: '', note: '' }],
    },

    intro: {
      // Career
      jobTitle: '',
      yearsExperience: '',
      prevCompany: '',
      city: '',
      careerHighlight: '',
      // Personal
      motto: '',
      unknownFact: '',
      currentlyLearning: '',
      // Fun Facts
      freeTimeChoice: '',
      freeTimeCustom: '',
      truth1: '',
      truth2: '',
      lie: '',
      // Set only on sheets decoded from a share link: the three statements
      // pre-shuffled with the answer stripped out. See js/share/link.js.
      statements: null,
    },

    showBuilder: false,
    cardConfig: {
      avatarId: '',
      highlightedMedia: [],
      showSocials: true,
      showCollection: true,
      theme: 'default',
      layout: 'vertical',
      // PNG export multiplier (1 | 2 | 3). The export re-renders at this scale
      // rather than upscaling a bitmap, so 3× is genuinely sharper, not bigger.
      scale: 2,
    },

    // Auth / session (not persisted to localStorage; Clerk owns the session)
    _user: null,       // { label } when signed in via neorgon-auth-client
    _sheetId: null,    // current Convex sheet _id
    _sheetName: null,  // current sheet name
  };
}

export function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

const MEME_SLOTS = 2;

/**
 * Bring an older sheet up to the current shape, in place.
 *
 * Runs on every path that produces a live sheet — `loadSaved` (localStorage) and
 * `hydrateSheet` (share links, roster links, JSON import) — because a sheet that
 * predates a shape change arrives through all of them. `extras.memeLink` /
 * `memeNote` were a single flat pair before the meme became a two-slot array;
 * merging the new blank shape over an old sheet leaves the array empty and the
 * legacy keys stranded, so the meme silently disappears from cards that had one.
 *
 * Also pads the array back to `MEME_SLOTS`: a share link prunes empty values, so
 * a sheet with only the first meme filled decodes with a one-element array.
 */
export function migrateSheet(sheet) {
  const extras = sheet.extras;
  if (!extras) return sheet;

  if (!Array.isArray(extras.memes)) extras.memes = [];

  if (extras.memeLink || extras.memeNote) {
    extras.memes[0] = {
      url: extras.memes[0]?.url || extras.memeLink || '',
      note: extras.memes[0]?.note || extras.memeNote || '',
    };
  }
  delete extras.memeLink;
  delete extras.memeNote;

  for (let i = 0; i < MEME_SLOTS; i++) {
    const slot = extras.memes[i];
    extras.memes[i] = { url: slot?.url || '', note: slot?.note || '' };
  }
  extras.memes.length = MEME_SLOTS;

  return sheet;
}

/**
 * Fill a partial sheet out to the full shape.
 *
 * Share links and the JSON export drop empty values to stay small, so a decoded
 * sheet is missing most keys. Card rendering reads nested arrays like
 * `anime.topAnime` directly, so it needs the gaps filled rather than a guard at
 * every read site.
 */
export function hydrateSheet(partial) {
  const sheet = blankSheet();
  if (partial) deepMerge(sheet, partial);
  return migrateSheet(sheet);
}
