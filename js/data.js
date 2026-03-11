export const SECTIONS = [
  { key: 'identity',  title: 'Identity',           glow: '--glow-identity',  flavor: 'Who you are — and how you want to be introduced.' },
  { key: 'intro',     title: 'Your Story',         glow: '--glow-intro',     flavor: 'The 30-second intro — your job, your vibe, your city.' },
  { key: 'gaming',    title: 'Gaming',             glow: '--glow-gaming',    flavor: 'What worlds have you conquered? Presenters: safe small-talk territory.' },
  { key: 'anime',     title: 'Anime',              glow: '--glow-anime',     flavor: 'The culture check — sub or dub, we\'re not judging.' },
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
  { id: 'dad-stuff',          label: '👨‍👧 Dad stuff' },
  { id: 'mom-stuff',          label: '👩‍👧 Mom stuff' },
  { id: 'gardening',          label: '🌱 Gardening' },
  { id: 'existential-crisis', label: '🌀 Existential crisis' },
  { id: 'doomscrolling',      label: '📱 Doomscrolling' },
  { id: 'gaming',             label: '🎮 Gaming (obviously)' },
  { id: 'cooking',            label: '🍳 Cooking' },
  { id: 'running',            label: '🏃 Running (from responsibilities)' },
  { id: 'reading',            label: '📚 Reading (not meetings)' },
  { id: 'overthinking',       label: '🤔 Overthinking everything' },
  { id: 'napping',            label: '😴 Napping professionally' },
  { id: 'binge-watching',     label: '📺 Binge-watching' },
  { id: 'gym',                label: '💪 Going to the gym' },
  { id: 'cat-content',        label: '🐱 Watching cat videos' },
  { id: 'traveling',          label: '✈️ Traveling' },
  { id: 'side-projects',      label: '🔧 Side projects' },
  { id: 'custom',             label: '✏️ Something else...' },
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
  'Digital Ronin':       { match: (s) => countAnime(s) >= 2 && countGaming(s) >= 2 },
  'Screen Sage':         { match: (s) => countMovies(s) >= 2 && countAnime(s) >= 2 },
  'Cultural Explorer':   { match: (s) => countMovies(s) >= 2 && s.hobbies.selected.length >= 3 },
  'Balanced Adventurer': { match: () => true },
};

function countGaming(s) {
  let c = 0;
  if (s.gaming.consoles.length) c += s.gaming.consoles.length;
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

export function getRPGClass(s) {
  // Calculate scores for each class
  const scores = [];
  for (const [name, def] of Object.entries(RPG_CLASSES)) {
    if (def.match(s)) {
      scores.push(name);
      break; // Return first match
    }
  }
  return scores[0] || 'Balanced Adventurer';
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
    case 'extras': {
      let f = 0, t = 1;
      if (s.extras.memeLink || s.extras.memeNote) f++;
      return f / t;
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
