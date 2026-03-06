export const SECTIONS = [
  { key: 'identity',  title: 'Identity',        glow: '--glow-identity',  flavor: 'Every adventurer needs a name.' },
  { key: 'gaming',    title: 'Gaming',           glow: '--glow-gaming',    flavor: 'What worlds have you conquered?' },
  { key: 'anime',     title: 'Anime',            glow: '--glow-anime',     flavor: 'The culture check.' },
  { key: 'movies',    title: 'Movies & Series',  glow: '--glow-movies',    flavor: 'What stories shaped you?' },
  { key: 'hobbies',   title: 'Hobbies',          glow: '--glow-hobbies',   flavor: 'Life beyond the screen.' },
  { key: 'wildcards', title: 'Wildcards',        glow: '--glow-wildcards', flavor: 'The real personality check.' },
  { key: 'extras',    title: 'Extras',           glow: '--glow-extras',    flavor: 'The finishing touches.' },
];

export const CONSOLES = [
  { id: 'pc',          label: 'PC',          icon: '\u{1F5A5}' },
  { id: 'playstation', label: 'PlayStation', icon: '\u{1F3AE}' },
  { id: 'xbox',        label: 'Xbox',        icon: '\u{1F579}' },
  { id: 'nintendo',    label: 'Nintendo',    icon: '\u{1F344}' },
  { id: 'mobile',      label: 'Mobile',      icon: '\u{1F4F1}' },
  { id: 'retro',       label: 'Retro',       icon: '\u{1F47E}' },
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

export const WILDCARDS = [
  { key: 'weirdThing',     label: 'Something people find weird about you but it really isn\'t' },
  { key: 'lifeHack',       label: 'Best life hack you\'ve discovered' },
  { key: 'hillToDieOn',    label: 'A hill you\'ll die on' },
  { key: 'guiltyPleasure', label: 'Guilty pleasure nobody knows about' },
  { key: 'threeApps',      label: 'If you could only keep 3 apps on your phone' },
  { key: 'breakfastSTier', label: 'Breakfast food tier list \u2014 what\'s S-tier?' },
];

export const RPG_CLASSES = {
  'Digital Ronin':       { match: (s) => countAnime(s) >= 2 && countGaming(s) >= 2 },
  'Screen Sage':         { match: (s) => countMovies(s) >= 2 && countAnime(s) >= 2 },
  'Pixel Paladin':       { match: (s) => countGaming(s) >= 3 },
  'Cultural Explorer':   { match: (s) => countMovies(s) >= 2 && s.hobbies.selected.length >= 3 },
  'Creative Wanderer':   { match: (s) => s.hobbies.selected.length >= 4 },
  'Otaku Guardian':      { match: (s) => countAnime(s) >= 3 },
  'Cinephile Knight':    { match: (s) => countMovies(s) >= 3 },
  'Wildcard Rogue':      { match: (s) => countWildcards(s) >= 4 },
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
  for (const [name, def] of Object.entries(RPG_CLASSES)) {
    if (def.match(s)) return name;
  }
  return 'Balanced Adventurer';
}
