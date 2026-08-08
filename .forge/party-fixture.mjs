// A roster with hand-computed expected answers.
//
// The overlaps here are contrived so the assertions can be exact rather than
// "looks plausible". What each sheet is for:
//
//   Ada    America/Santiago  UTC-4 (or -3 in DST)  — the dense fixture's person
//   Kenji  Asia/Tokyo        UTC+9  — the far end of the timezone gap
//   Marta  Europe/Madrid     UTC+1/+2 — sits between the two
//   Sam    (no timezone)     — must be reported as uncounted, not silently dropped
//
// Deliberate overlaps:
//   "Elden Ring"   → Ada, Kenji, Marta   (3 — the top shared row)
//   "Hollow Knight"→ Ada, Sam            (2)
//   "Arrival"      → Ada, Marta          (2)
//   "Cooking"      → Ada, Kenji, Sam     (3)
//   "PC"           → all four            (platform — must rank below titles)
//   "elden ring" vs "Elden Ring" → Kenji types it lowercase, to exercise normKey
//   "Outer Wilds"  → Kenji only          (a solo title)
//
// Nobody's `lie` is compared anywhere; the answer field exists only so the
// answer-stripping path can be checked on a roster link.

const base = () => ({
  identity: { name: '', handles: [], country: '', city: '', timezone: '', bestTimeToPresent: '', description: '' },
  intro: {},
  gaming: { consoles: [], topGames: [], replayGame: null, favoriteCharacter: '', worstGame: '' },
  anime: { watches: null, topAnime: [], genres: [] },
  movies: { topMovies: [], genres: [] },
  hobbies: { selected: [], custom: '', creative: '' },
  wildcards: {},
  extras: {},
  cardConfig: { theme: 'default', layout: 'vertical', scale: 2, showSocials: true, showCollection: true, avatarId: '', highlightedMedia: [] },
});

export const ADA = {
  ...base(),
  identity: { ...base().identity, name: 'Ada', city: 'Santiago', country: 'Chile', timezone: 'America/Santiago', bestTimeToPresent: 'Mornings, before 11:00' },
  intro: { jobTitle: 'Platform Engineer', currentlyLearning: 'Rust, badly', truth1: 'A', truth2: 'B', lie: 'C' },
  gaming: { ...base().gaming, consoles: ['pc'], topGames: [{ name: 'Hollow Knight' }, { name: 'Elden Ring' }] },
  movies: { ...base().movies, topMovies: [{ name: 'Arrival' }] },
  hobbies: { ...base().hobbies, selected: ['Cooking', 'Cycling'] },
  wildcards: { hillToDieOn: { value: 'Tabs in YAML are a crime.', skip: '' } },
};

export const KENJI = {
  ...base(),
  identity: { ...base().identity, name: 'Kenji', city: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  intro: { jobTitle: 'SRE', currentlyLearning: 'Go', truth1: 'D', truth2: 'E', lie: 'F' },
  // Lowercase on purpose: normKey must fold it into Ada's "Elden Ring".
  gaming: { ...base().gaming, consoles: ['pc', 'nintendo'], topGames: [{ name: 'elden ring' }], replayGame: { name: 'Outer Wilds' } },
  hobbies: { ...base().hobbies, selected: ['Cooking'] },
  wildcards: { lifeHack: { value: 'Calendar-block lunch.', skip: '' } },
};

export const MARTA = {
  ...base(),
  identity: { ...base().identity, name: 'Marta', city: 'Madrid', country: 'Spain', timezone: 'Europe/Madrid' },
  intro: { jobTitle: 'Data Engineer' },
  gaming: { ...base().gaming, consoles: ['pc'], topGames: [{ name: 'Elden Ring' }] },
  movies: { ...base().movies, topMovies: [{ name: 'Arrival' }] },
  hobbies: { ...base().hobbies, selected: ['Reading'] },
};

// No timezone at all — the case that must be reported rather than dropped.
export const SAM = {
  ...base(),
  identity: { ...base().identity, name: 'Sam', city: 'Somewhere' },
  intro: { jobTitle: 'Designer' },
  gaming: { ...base().gaming, consoles: ['pc'], topGames: [{ name: 'Hollow Knight' }] },
  hobbies: { ...base().hobbies, selected: ['Cooking'] },
};

export const ROSTER = [ADA, KENJI, MARTA, SAM];
