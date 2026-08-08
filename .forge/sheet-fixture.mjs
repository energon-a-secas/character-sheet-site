// One realistic sheet, shared by the checks in this directory.
//
// Deliberately dense: every optional field filled, so the fixed-size presets are
// forced to drop blocks and the fit logic is actually exercised.

export const SHEET = {
  identity: {
    name: 'Ada Rivera', country: 'Chile', city: 'Santiago',
    timezone: 'America/Santiago', bestTimeToPresent: 'Mornings, before 11:00',
    description: 'Infra engineer who keeps a mechanical keyboard at three offices.',
    handles: [{ platform: 'github', handle: 'adarivera' }, { platform: 'discord', handle: 'ada#0001' }],
  },
  intro: {
    jobTitle: 'Platform Engineer', yearsExperience: '9 years', prevCompany: 'Mercado Libre',
    city: 'Santiago', careerHighlight: 'Cut a 40-minute deploy to four minutes.',
    motto: 'Make it boring, then make it fast.',
    unknownFact: 'I competed in speed cubing.',
    currentlyLearning: 'Rust, badly',
    freeTimeChoice: 'custom', freeTimeCustom: 'Long walks with a podcast',
    truth1: 'I have visited 14 countries.',
    truth2: 'I once fixed prod from a moving bus.',
    lie: 'I hold a private pilot licence.',
  },
  gaming: {
    consoles: ['pc', 'switch'],
    topGames: [{ name: 'Hollow Knight' }, { name: 'Elden Ring' }],
    replayGame: { name: 'Outer Wilds' }, favoriteCharacter: 'Hornet', worstGame: 'Any battle royale',
  },
  anime: {
    watches: true, topAnime: [{ name: 'Vinland Saga' }],
    genres: ['Seinen', 'Historical'], subDub: 'Sub, always', worstAnime: 'Isekai #4000',
  },
  movies: {
    topMovies: [{ name: 'Arrival' }], genres: ['Sci-fi'],
    favoriteQuote: 'If you could see your whole life, would you change things?',
    favoriteQuoteSource: 'Arrival', worstMovie: 'Emoji Movie',
  },
  hobbies: { selected: ['Cooking', 'Cycling'], custom: 'Fountain pens', creative: 'Bookbinding' },
  wildcards: {
    hillToDieOn: { value: 'Tabs in YAML are a crime.', skip: '' },
    breakfastSTier: { value: 'Marraqueta with palta.', skip: '' },
    lifeHack: { value: 'Calendar-block your lunch.', skip: '' },
    weirdThing: { value: '', skip: 'skip' },
    guiltyPleasure: { value: '', skip: '' },
    threeApps: { value: '', skip: '' },
  },
  extras: { memeLink: 'https://example.com/meme', memeNote: 'The "this is fine" dog, weekly.' },
  cardConfig: {
    avatarId: '', highlightedMedia: [], showSocials: true, showCollection: true,
    theme: 'default', layout: 'vertical', highQuality: true,
  },
};
