const STORAGE_KEY = 'player-card';

export const state = {
  currentSection: 0,

  identity: {
    name: '',
    handles: [],
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

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}
