const STORAGE_KEY = 'player-card';

export const state = {
  currentSection: 0,

  identity: {
    name: '',
    handles: [],
    country: '',
    bestTimeToPresent: '',
    description: '',
  },

  gaming: {
    consoles: [],
    topGames: [],
    replayGame: null,
    favoriteCharacter: '',
  },

  anime: {
    watches: null,
    topAnime: [],
    favoriteCharacterData: null,
    waifuHusbandoData: null,
    waifuHusbandoSkip: '',
    subDub: '',
    comfortRewatch: null,
  },

  movies: {
    topMovies: [],
    starWars: null,
    starWarsTrilogy: '',
    starWarsSide: '',
    marvel: null,
    marvelHero: '',
    comfortRewatch: null,
    favoriteQuote: '',
    favoriteQuoteSource: '',
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

  extras: {
    memeLink: '',
    memeNote: '',
  },

  intro: {
    jobTitle: '',
    yearsExperience: '',
    prevCompany: '',
    city: '',
    freeTimeChoice: '',
    freeTimeCustom: '',
    truth1: '',
    truth2: '',
    lie: '',
  },

  showBuilder: false,
  cardConfig: {
    avatarId: '',
    highlightedMedia: [],
    showSocials: true,
    showCollection: true,
  },
};

export function loadSaved(s) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      deepMerge(s, saved);
    }
  } catch { /* ignore */ }
}

export function save(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota */ }
}

export function resetState(s) {
  s.currentSection = 0;
  s.identity = { name: '', handles: [], description: '', country: '', bestTimeToPresent: '' };
  s.gaming = { consoles: [], topGames: [], replayGame: null, favoriteCharacter: '' };
  s.anime = { watches: null, topAnime: [], favoriteCharacterData: null, waifuHusbandoData: null, waifuHusbandoSkip: '', subDub: '', comfortRewatch: null };
  s.movies = { topMovies: [], starWars: null, starWarsTrilogy: '', starWarsSide: '', marvel: null, marvelHero: '', comfortRewatch: null, favoriteQuote: '', favoriteQuoteSource: '' };
  s.hobbies = { selected: [], custom: '', creative: '' };
  s.wildcards = {
    weirdThing: { value: '', skip: '' }, lifeHack: { value: '', skip: '' },
    hillToDieOn: { value: '', skip: '' }, guiltyPleasure: { value: '', skip: '' },
    threeApps: { value: '', skip: '' }, breakfastSTier: { value: '', skip: '' },
  };
  s.extras = { memeLink: '', memeNote: '' };
  s.intro = { jobTitle: '', yearsExperience: '', prevCompany: '', city: '', freeTimeChoice: '', freeTimeCustom: '', truth1: '', truth2: '', lie: '' };
  s.showBuilder = false;
  s.cardConfig = { avatarId: '', highlightedMedia: [], showSocials: true, showCollection: true };
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
