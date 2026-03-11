import { ConvexHttpClient } from "https://esm.sh/convex@1.21.0/browser";

// Run: npx convex dev — then paste your deployment URL here
const CONVEX_URL = "https://aware-peccary-979.convex.cloud";
export const convex = new ConvexHttpClient(CONVEX_URL);

export const api = {
  auth: { register: "auth:register", login: "auth:login" },
  sheets: { list: "sheets:list", save: "sheets:save", remove: "sheets:remove" },
};

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
  },

  showBuilder: false,
  cardConfig: {
    avatarId: '',
    highlightedMedia: [],
    showSocials: true,
    showCollection: true,
  },

  // Auth / session (not persisted to localStorage)
  _user: null,       // { id, username } after login
  _sheetId: null,    // current Convex sheet _id
  _sheetName: null,  // current sheet name
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
    // Strip auth/session fields before persisting
    const { _user, _sheetId, _sheetName, ...toSave } = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
  s.intro = {
    jobTitle: '', yearsExperience: '', prevCompany: '', city: '',
    careerHighlight: '', motto: '', unknownFact: '', currentlyLearning: '',
    freeTimeChoice: '', freeTimeCustom: '', truth1: '', truth2: '', lie: '',
  };
  s.showBuilder = false;
  s.cardConfig = { avatarId: '', highlightedMedia: [], showSocials: true, showCollection: true };
  // _user, _sheetId, _sheetName are intentionally NOT reset (session survives startOver)
  localStorage.removeItem(STORAGE_KEY);
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
