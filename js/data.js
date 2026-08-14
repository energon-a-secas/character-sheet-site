export const SECTIONS = [
  { key: 'identity',  title: 'Identity',           glow: '--glow-identity',  flavor: 'Who you are — and how you want to be introduced.' },
  { key: 'intro',     title: 'Your Story',         glow: '--glow-intro',     flavor: 'The 30-second intro — your job, your vibe, your city.' },
  { key: 'gaming',    title: 'Gaming',             glow: '--glow-gaming',    flavor: 'What worlds have you conquered? Presenters: safe small-talk territory.' },
  { key: 'anime',     title: 'Anime',              glow: '--glow-anime',     flavor: 'The culture check — sub or dub, we\'re not judging.' },
  { key: 'legends',   title: 'Legends',            glow: '--glow-legends',   flavor: 'Saturday-morning canon. No anime credentials required — most of this was just what was on TV.' },
  { key: 'movies',    title: 'Movies & Series',    glow: '--glow-movies',    flavor: 'What stories shaped you? Presenters: great for references and icebreakers.' },
  { key: 'hobbies',   title: 'Hobbies',            glow: '--glow-hobbies',   flavor: 'Side quests IRL. Presenters: conversation starters.' },
  { key: 'wildcards', title: 'Hot Takes & Games',  glow: '--glow-wildcards', flavor: 'Unpopular opinions, guilty pleasures, and one sneaky lie — who can guess it?' },
  { key: 'extras',    title: 'Extras',             glow: '--glow-extras',    flavor: 'Meme of choice and anything else you want on your card.' },
];

export const CONSOLES = [
  { id: 'pc',          label: 'PC',          icon: 'https://cdn.simpleicons.org/steam/white' },
  { id: 'playstation', label: 'PlayStation', icon: 'https://cdn.simpleicons.org/playstation/white' },
  { id: 'xbox',        label: 'Xbox',        icon: 'https://cdn.simpleicons.org/xbox/white' },
  { id: 'nintendo',    label: 'Nintendo',    icon: 'https://cdn.simpleicons.org/nintendoswitch/white' },
  { id: 'mobile',      label: 'Mobile',      icon: 'https://cdn.simpleicons.org/apple/white' },
  { id: 'retro',       label: 'Retro',       icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M0 21.653s3.154-.355 5.612-2.384c2.339-1.93 3.185-3.592 3.77-5.476.584-1.885.671-6.419.671-7.764V2.346H8.598v1.365c-.024 2.041-.2 5.918-1.135 8.444C5.203 18.242 0 18.775 0 18.775zm24 0s-3.154-.355-5.61-2.384c-2.342-1.93-3.187-3.592-3.772-5.476-.583-1.885-.671-6.419-.671-7.764V2.346H15.4l.001 1.365c.024 2.041.202 5.918 1.138 8.444 2.258 6.087 7.46 6.62 7.46 6.62zM10.659 2.348h2.685v19.306H10.66Z"/></svg>' },
];

export const PLATFORMS = [
  { id: 'psn',       label: 'PSN' },
  { id: 'xbox',      label: 'Xbox Live' },
  { id: 'steam',     label: 'Steam' },
  { id: 'discord',   label: 'Discord' },
  { id: 'switch',    label: 'Switch FC' },
  { id: 'twitter',   label: 'X / Twitter' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'twitch',    label: 'Twitch' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'github',    label: 'GitHub' },
  { id: 'linkedin',  label: 'LinkedIn' },
];

export const HOBBY_OPTIONS = [
  'Cooking', 'Music', 'Reading', 'Sports', 'Hiking', 'Photography',
  'Drawing', 'Writing', 'Gardening', 'Board Games', 'D&D / TTRPG',
  'Gym / Fitness', 'Dancing', 'Crafts / DIY', 'Volunteering',
  'Traveling', 'Pets', 'Streaming', 'Podcasts', 'Languages',
  'YouTube', 'Coding', 'Video Editing', 'Collecting', 'Meditation',
  'Martial Arts', 'Climbing', 'Cycling', 'Fishing', 'Cosplay',
];

export const ANIME_GENRES = [
  'Isekai', 'Shonen', 'Seinen', 'Shojo', 'Mecha', 'Slice of Life',
  'Romance', 'Horror', 'Psychological', 'Sports', 'Music', 'Fantasy',
];

export const MOVIE_GENRES = [
  'Action', 'Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Thriller',
  'Fantasy', 'Romance', 'Documentary', 'Animation', 'Mystery', 'Adventure',
];

export const FREE_TIME_OPTIONS = [
  { id: 'dad-stuff',          label: 'Dad stuff' },
  { id: 'mom-stuff',          label: 'Mom stuff' },
  { id: 'gardening',          label: 'Gardening' },
  { id: 'existential-crisis', label: 'Existential crisis' },
  { id: 'doomscrolling',      label: 'Doomscrolling' },
  { id: 'gaming',             label: 'Gaming (obviously)' },
  { id: 'cooking',            label: 'Cooking' },
  { id: 'running',            label: 'Running (from responsibilities)' },
  { id: 'reading',            label: 'Reading (not meetings)' },
  { id: 'overthinking',       label: 'Overthinking everything' },
  { id: 'napping',            label: 'Napping professionally' },
  { id: 'binge-watching',     label: 'Binge-watching' },
  { id: 'gym',                label: 'Going to the gym' },
  { id: 'cat-content',        label: 'Watching cat videos' },
  { id: 'traveling',          label: 'Traveling' },
  { id: 'side-projects',      label: 'Side projects' },
  { id: 'custom',             label: 'Something else...' },
];

// The twelve Gold Saints of Saint Seiya, in zodiac order.
//
// Sign and saint are the same answer wearing two labels, which is the whole point:
// someone who has never seen the show can still answer by birthday, and the app
// then tells them which Gold Saint that makes them. One state field, two questions.
//
// Every symbol carries a trailing U+FE0E (VARIATION SELECTOR-15). The twelve
// zodiac characters default to *emoji* presentation on macOS and iOS, which draws
// them from the colour-emoji font — a magenta tile that ignores `color`, so the
// gold styling silently did nothing and the chips looked like a rendering bug.
// VS15 asks for the text glyph, which takes the CSS colour.
export const GOLD_SAINTS = [
  { id: 'aries',       sign: 'Aries',       symbol: '♈︎', saint: 'Mu',         dates: 'Mar 21 – Apr 19' },
  { id: 'taurus',      sign: 'Taurus',      symbol: '♉︎', saint: 'Aldebaran',  dates: 'Apr 20 – May 20' },
  { id: 'gemini',      sign: 'Gemini',      symbol: '♊︎', saint: 'Saga',       dates: 'May 21 – Jun 20' },
  { id: 'cancer',      sign: 'Cancer',      symbol: '♋︎', saint: 'Deathmask',  dates: 'Jun 21 – Jul 22' },
  { id: 'leo',         sign: 'Leo',         symbol: '♌︎', saint: 'Aiolia',     dates: 'Jul 23 – Aug 22' },
  { id: 'virgo',       sign: 'Virgo',       symbol: '♍︎', saint: 'Shaka',      dates: 'Aug 23 – Sep 22' },
  { id: 'libra',       sign: 'Libra',       symbol: '♎︎', saint: 'Dohko',      dates: 'Sep 23 – Oct 22' },
  { id: 'scorpio',     sign: 'Scorpio',     symbol: '♏︎', saint: 'Milo',       dates: 'Oct 23 – Nov 21' },
  { id: 'sagittarius', sign: 'Sagittarius', symbol: '♐︎', saint: 'Aiolos',     dates: 'Nov 22 – Dec 21' },
  { id: 'capricorn',   sign: 'Capricorn',   symbol: '♑︎', saint: 'Shura',      dates: 'Dec 22 – Jan 19' },
  { id: 'aquarius',    sign: 'Aquarius',    symbol: '♒︎', saint: 'Camus',      dates: 'Jan 20 – Feb 18' },
  { id: 'pisces',      sign: 'Pisces',      symbol: '♓︎', saint: 'Aphrodite',  dates: 'Feb 19 – Mar 20' },
];

export function goldSaintById(id) {
  return GOLD_SAINTS.find(g => g.id === id) || null;
}

// Seven Gundams and one impostor. `impostor` is not decoration — the comment
// narrator and the card both read it, and picking it is a valid answer, not an
// error state.
export const GUNDAMS = [
  { id: 'rx78',    name: 'RX-78-2',       from: 'Mobile Suit Gundam' },
  { id: 'wing',    name: 'Wing Zero',     from: 'Gundam Wing' },
  // Spelled out rather than the Greek ν: at chip size the letter is
  // indistinguishable from a lowercase v, which reads as a typo.
  { id: 'nu',      name: 'Nu Gundam (ν)', from: "Char's Counterattack" },
  { id: 'unicorn', name: 'Unicorn',       from: 'Gundam Unicorn' },
  { id: 'exia',    name: 'Exia',          from: 'Gundam 00' },
  { id: 'freedom', name: 'Strike Freedom',from: 'Gundam SEED Destiny' },
  { id: 'barbatos',name: 'Barbatos',      from: 'Iron-Blooded Orphans' },
  // The subtitle names the real series, exactly like the other seven. Writing
  // "not a Gundam" here would answer the question on the chip itself — spotting
  // that Transformers is the odd one out *is* the joke. The card supplies the
  // punchline after the pick.
  { id: 'optimus', name: 'Optimus Prime', from: 'Transformers', impostor: true },
];

export const DB_FORMS = [
  { id: 'base',       label: 'Base form (well rested)' },
  { id: 'kaioken',    label: 'Kaioken (third coffee)' },
  { id: 'ssj',        label: 'Super Saiyan (deadline)' },
  { id: 'ultra',      label: 'Ultra Instinct (no thoughts)' },
  { id: 'fusion',     label: 'Fusion (I need a pair)' },
  { id: 'krillin',    label: 'Krillin, and proud' },
];

export const TF_FACTIONS = [
  { id: 'autobot',   label: 'Autobot' },
  { id: 'decepticon',label: 'Decepticon' },
  { id: 'depends',   label: 'Depends on the sprint' },
];

export const RETRO_DEPTH = [
  { id: 'grew-up',   label: 'Grew up on it' },
  { id: 'reruns',    label: 'Caught the reruns' },
  { id: 'late',      label: 'Discovered it late' },
  { id: 'lost',      label: 'Completely lost here' },
];

export const WILDCARDS = [
  { key: 'weirdThing',     label: 'Something people find weird about you but it really isn\'t' },
  { key: 'lifeHack',       label: 'Best life hack you\'ve discovered' },
  { key: 'hillToDieOn',    label: 'A hill you\'ll die on' },
  { key: 'guiltyPleasure', label: 'Guilty pleasure nobody knows about' },
  { key: 'threeApps',      label: 'If you could only keep 3 apps on your phone' },
  { key: 'breakfastSTier', label: 'Breakfast food tier list \u2014 what\'s S-tier?' },
];

export const RPG_CLASSES = {
  'Pixel Paladin':       { match: (s) => countGaming(s) >= 4 },
  'Otaku Guardian':      { match: (s) => countAnime(s) >= 4 },
  'Cinephile Knight':    { match: (s) => countMovies(s) >= 4 },
  'Creative Wanderer':   { match: (s) => s.hobbies.selected.length >= 5 },
  'Wildcard Rogue':      { match: (s) => countWildcards(s) >= 5 },
  'Bronze Saint':        { match: (s) => countLegends(s) >= 6 },
  'Digital Ronin':       { match: (s) => countAnime(s) >= 2 && countGaming(s) >= 2 },
  'Screen Sage':         { match: (s) => countMovies(s) >= 2 && countAnime(s) >= 2 },
  'Cultural Explorer':   { match: (s) => countMovies(s) >= 2 && s.hobbies.selected.length >= 3 },
  'Balanced Adventurer': { match: () => true },
};

function countGaming(s) {
  let c = 0;
  // Consoles are a checkbox row — one click each, and owning four of them says far
  // less than naming four favourite games. Counting them 1:1 made "tick every
  // console" the cheapest route to Pixel Paladin, while anime and movies needed
  // real searched titles. Capped so breadth of platforms counts once.
  if (s.gaming.consoles.length) c += Math.min(s.gaming.consoles.length, 2);
  if (s.gaming.topGames.length) c += s.gaming.topGames.length;
  if (s.gaming.replayGame) c++;
  if (s.gaming.favoriteCharacter) c++;
  return c;
}

function countAnime(s) {
  let c = 0;
  if (s.anime.watches === true) c++;
  if (s.anime.topAnime.length) c += s.anime.topAnime.length;
  if (s.anime.favoriteCharacterData) c++;
  if (s.anime.waifuHusbandoData) c++;
  return c;
}

function countMovies(s) {
  let c = 0;
  if (s.movies.topMovies.length) c += s.movies.topMovies.length;
  if (s.movies.starWars === true) c++;
  if (s.movies.marvel === true) c++;
  return c;
}

function countWildcards(s) {
  return Object.values(s.wildcards).filter(w => w.value && !w.skip).length;
}

// `goldSaintMode` is a framing, not an answer, so it is not counted — otherwise
// pressing "I have no idea what this is" would score the same as naming a saint.
function countLegends(s) {
  const l = s.legends;
  if (!l) return 0;
  return [
    l.goldSaint, l.gundam, l.dbForm, l.tfFaction, l.retroDepth,
    l.firstMachine, l.openingTheme, l.saturdayHero, l.arcadeGame, l.meetingChampion,
  ].filter(Boolean).length;
}

/**
 * First matching class wins, so RPG_CLASSES is ordered most specific first and
 * 'Balanced Adventurer' matches unconditionally last.
 */
export function getRPGClass(s) {
  const hit = Object.entries(RPG_CLASSES).find(([, def]) => def.match(s));
  return hit ? hit[0] : 'Balanced Adventurer';
}

export function getSectionFill(s, key) {
  switch (key) {
    case 'identity': {
      let f = 0, t = 3;
      if (s.identity.name) f++;
      if (s.identity.handles.length) f++;
      if (s.identity.description) f++;
      return f / t;
    }
    case 'gaming': {
      let f = 0, t = 4;
      if (s.gaming.consoles.length) f++;
      if (s.gaming.topGames.length) f++;
      if (s.gaming.replayGame) f++;
      if (s.gaming.favoriteCharacter) f++;
      return f / t;
    }
    case 'anime': {
      if (s.anime.watches === false) return 1;
      if (s.anime.watches === null) return 0;
      let f = 1, t = 5;
      if (s.anime.topAnime.length) f++;
      if (s.anime.favoriteCharacterData) f++;
      if (s.anime.waifuHusbandoData || s.anime.waifuHusbandoSkip) f++;
      if (s.anime.subDub) f++;
      return f / t;
    }
    case 'movies': {
      let f = 0, t = 4;
      if (s.movies.topMovies.length) f++;
      if (s.movies.starWars !== null) f++;
      if (s.movies.marvel !== null) f++;
      if (s.movies.favoriteQuote) f++;
      return f / t;
    }
    case 'hobbies': {
      let f = 0, t = 2;
      if (s.hobbies.selected.length) f++;
      if (s.hobbies.custom || s.hobbies.creative) f++;
      return f / t;
    }
    case 'wildcards': {
      const filled = Object.values(s.wildcards).filter(w => w.value || w.skip).length;
      const hasGame = (s.intro.truth1 && s.intro.truth2 && s.intro.lie) ? 1 : 0;
      return Math.min((filled + hasGame) / 7, 1);
    }
    case 'legends': {
      // "Completely lost here" is a full answer to the section, not an empty one:
      // a ring that stays at 10% for someone who honestly said they don't know
      // this stuff reads as a chore they failed rather than a question they
      // answered. Ten questions otherwise, scored out of six so the ring can fill
      // without demanding every one of them.
      const l = s.legends;
      if (l.retroDepth === 'lost') return 1;
      return Math.min(countLegends(s) / 6, 1);
    }
    case 'extras': {
      let f = 0, t = 2;
      f = s.extras.memes.filter(m => m.url || m.note).length;
      return Math.min(f / t, 1);
    }
    case 'intro': {
      let f = 0, t = 5;
      if (s.intro.jobTitle) f++;
      if (s.intro.careerHighlight) f++;
      if (s.intro.motto || s.intro.unknownFact || s.intro.currentlyLearning) f++;
      if (s.intro.freeTimeChoice) f++;
      if (s.intro.city || s.intro.yearsExperience) f++;
      return Math.min(f / t, 1);
    }
    default: return 0;
  }
}
