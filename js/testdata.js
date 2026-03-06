import { state, save } from './state.js';
import { HOBBY_OPTIONS } from './data.js';
import { render } from './render.js';

const NAMES = [
  'Kira Blackwood', 'Zane Mercer', 'Luna Vex', 'Dax Renegade', 'Nova Sterling',
  'Riku Ashborn', 'Sable Cross', 'Jett Phantom', 'Aria Nightfall', 'Echo Drifter',
];

const DESCRIPTIONS = [
  'Part-time pixel pusher, full-time snack enthusiast. I code by day and raid by night.',
  'If I could live in a fantasy world, I probably would. Until then, games and caffeine.',
  'Chronic overthinker. Ask me about my opinions on fictional characters.',
  'I peak at 2 AM. That applies to both gaming and existential dread.',
  'According to my screen time, I practically live online. No regrets.',
];

const GAMES = [
  { id: 3498,  name: 'Grand Theft Auto V',           image: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg', year: '2013' },
  { id: 3328,  name: 'The Witcher 3: Wild Hunt',     image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6571c2.jpg', year: '2015' },
  { id: 5286,  name: 'Tomb Raider (2013)',            image: 'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg', year: '2013' },
  { id: 4200,  name: 'Portal 2',                     image: 'https://media.rawg.io/media/games/328/3283617cb7d75d67257fc58339188571.jpg', year: '2011' },
  { id: 28,    name: 'Red Dead Redemption 2',         image: 'https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg', year: '2018' },
  { id: 3439,  name: 'Life is Strange',               image: 'https://media.rawg.io/media/games/562/562553814dd54e001a541e4f97b4571f.jpg', year: '2015' },
  { id: 58175, name: 'God of War (2018)',             image: 'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg', year: '2018' },
  { id: 802,   name: 'Borderlands 2',                image: 'https://media.rawg.io/media/games/49c/49c3dfa4ce2f6f140cc4825868571a57.jpg', year: '2012' },
  { id: 4291,  name: 'Counter-Strike: GO',           image: 'https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg', year: '2012' },
  { id: 13536, name: 'Portal',                       image: 'https://media.rawg.io/media/games/7fa/7fa0b586293c5861ee32b557f7256a5e.jpg', year: '2007' },
  { id: 5679,  name: 'The Elder Scrolls V: Skyrim',  image: 'https://media.rawg.io/media/games/7cf/7cfc9220b401b7a300e409e539c9afd5.jpg', year: '2011' },
  { id: 4062,  name: 'BioShock Infinite',            image: 'https://media.rawg.io/media/games/fc1/fc1307a2571c1f55e8a03e3b90e74994.jpg', year: '2013' },
];

const ANIME_LIST = [
  { id: 1535,  name: 'Death Note',                  image: 'https://cdn.myanimelist.net/images/anime/9/9453t.jpg',   imageLarge: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',   year: '2006', episodes: '37 eps' },
  { id: 16498, name: 'Attack on Titan',             image: 'https://cdn.myanimelist.net/images/anime/10/47347t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/10/47347l.jpg', year: '2013', episodes: '25 eps' },
  { id: 11061, name: 'Hunter x Hunter (2011)',      image: 'https://cdn.myanimelist.net/images/anime/1337/99013t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/1337/99013l.jpg', year: '2011', episodes: '148 eps' },
  { id: 21,    name: 'One Punch Man',               image: 'https://cdn.myanimelist.net/images/anime/12/76049t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/12/76049l.jpg', year: '2015', episodes: '12 eps' },
  { id: 1,     name: 'Cowboy Bebop',                image: 'https://cdn.myanimelist.net/images/anime/4/19644t.jpg',  imageLarge: 'https://cdn.myanimelist.net/images/anime/4/19644l.jpg',  year: '1998', episodes: '26 eps' },
  { id: 5114,  name: 'Fullmetal Alchemist: Brotherhood', image: 'https://cdn.myanimelist.net/images/anime/1208/94745t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/1208/94745l.jpg', year: '2009', episodes: '64 eps' },
  { id: 40748, name: 'Jujutsu Kaisen',              image: 'https://cdn.myanimelist.net/images/anime/1171/109222t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/1171/109222l.jpg', year: '2020', episodes: '24 eps' },
  { id: 9253,  name: 'Steins;Gate',                 image: 'https://cdn.myanimelist.net/images/anime/5/73199t.jpg', imageLarge: 'https://cdn.myanimelist.net/images/anime/5/73199l.jpg', year: '2011', episodes: '24 eps' },
];

const ANIME_CHARACTERS = [
  { id: 71,    name: 'Spike Spiegel',   image: 'https://cdn.myanimelist.net/images/characters/4/50197.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/4/50197.jpg' },
  { id: 417,   name: 'Lelouch Lamperouge', image: 'https://cdn.myanimelist.net/images/characters/8/406163.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/8/406163.jpg' },
  { id: 40,    name: 'Kakashi Hatake',  image: 'https://cdn.myanimelist.net/images/characters/7/284129.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/7/284129.jpg' },
  { id: 45627, name: 'Makima',          image: 'https://cdn.myanimelist.net/images/characters/3/492407.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/3/492407.jpg' },
  { id: 64167, name: 'Gojo Satoru',     image: 'https://cdn.myanimelist.net/images/characters/15/422168.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/15/422168.jpg' },
  { id: 121,   name: 'Levi Ackerman',   image: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg', imageLarge: 'https://cdn.myanimelist.net/images/characters/2/241413.jpg' },
];

const MOVIES = [
  { id: 550,    name: 'Fight Club',                image: 'https://image.tmdb.org/t/p/w185/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', year: '1999', type: 'Movie' },
  { id: 680,    name: 'Pulp Fiction',              image: 'https://image.tmdb.org/t/p/w185/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', year: '1994', type: 'Movie' },
  { id: 603,    name: 'The Matrix',                image: 'https://image.tmdb.org/t/p/w185/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', year: '1999', type: 'Movie' },
  { id: 278,    name: 'The Shawshank Redemption',  image: 'https://image.tmdb.org/t/p/w185/9cjIGRiQhkiSTEDvjbLMjL1BWMK.jpg', year: '1994', type: 'Movie' },
  { id: 155,    name: 'The Dark Knight',           image: 'https://image.tmdb.org/t/p/w185/qJ2tW6WMUDux911BTUgMe1nNaD.jpg',  year: '2008', type: 'Movie' },
  { id: 27205,  name: 'Inception',                 image: 'https://image.tmdb.org/t/p/w185/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg', year: '2010', type: 'Movie' },
  { id: 1396,   name: 'Breaking Bad',              image: 'https://image.tmdb.org/t/p/w185/ztkUQFLlC19CCMYHW73FFK0RVS.jpg',  year: '2008', type: 'Series' },
  { id: 1399,   name: 'Game of Thrones',           image: 'https://image.tmdb.org/t/p/w185/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', year: '2011', type: 'Series' },
  { id: 100088, name: 'The Last of Us',            image: 'https://image.tmdb.org/t/p/w185/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg', year: '2023', type: 'Series' },
  { id: 76479,  name: 'The Boys',                  image: 'https://image.tmdb.org/t/p/w185/stTEycfG9Ng4pkC6GKpFkCbfOlT.jpg', year: '2019', type: 'Series' },
];

const HANDLES_POOL = [
  { platform: 'discord', handle: 'shadowmercer#1337' },
  { platform: 'steam', handle: 'xN0va_' },
  { platform: 'psn', handle: 'DarkPixel99' },
  { platform: 'twitter', handle: '@thereal_dax' },
  { platform: 'instagram', handle: '@lunav.jpg' },
  { platform: 'twitch', handle: 'riku_streams' },
  { platform: 'github', handle: 'echo-dev' },
  { platform: 'youtube', handle: '@JettPhantomPlays' },
];

const WILDCARD_ANSWERS = {
  weirdThing: [
    'I eat cereal without milk. It\'s just crunchy snack time.',
    'I genuinely enjoy reading terms of service. Some of them are wild.',
    'I talk to my plants. They\'re great listeners.',
  ],
  lifeHack: [
    'Freeze leftover coffee into ice cubes. Iced coffee that doesn\'t get watered down.',
    'Put your phone on airplane mode when charging. 2x speed.',
    'If you can\'t decide between two things, flip a coin. Your gut reaction to the result tells you everything.',
  ],
  hillToDieOn: [
    'Pineapple on pizza is elite. I will not be taking questions.',
    'Tabs are superior to spaces. Fight me.',
    'The Star Wars prequels are underrated masterpieces.',
  ],
  guiltyPleasure: [
    'I unironically listen to 2000s pop hits on repeat.',
    'I watch cooking competition shows with zero intention of ever cooking.',
    'I re-read the same manga I\'ve already read 5 times.',
  ],
  threeApps: [
    'Spotify, Discord, and Chrome. That\'s the holy trinity.',
    'YouTube, WhatsApp, and a good note-taking app.',
    'Reddit, Spotify, and camera. I\'m a simple person.',
  ],
  breakfastSTier: [
    'Chilaquiles. Nothing else even comes close.',
    'A good croissant with coffee. That\'s peak morning.',
    'Pancakes with bacon. The sweet and salty combo is unbeatable.',
  ],
};

const CHARACTERS = [
  'Master Chief', 'Tifa Lockhart', 'Link', 'Geralt of Rivia', 'Kratos',
  'Solid Snake', 'Arthur Morgan', 'Lara Croft', 'Joel Miller', 'Commander Shepard',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function randomFill() {
  state.currentSection = 0;
  state.showBuilder = false;

  state.identity.name = pick(NAMES);
  state.identity.handles = pickN(HANDLES_POOL, 2 + Math.floor(Math.random() * 3));
  state.identity.description = pick(DESCRIPTIONS);

  state.gaming.consoles = pickN(['pc', 'playstation', 'xbox', 'nintendo', 'mobile', 'retro'], 2 + Math.floor(Math.random() * 2));
  state.gaming.topGames = pickN(GAMES, 3);
  state.gaming.replayGame = pick(GAMES.filter(g => !state.gaming.topGames.includes(g)));
  state.gaming.favoriteCharacter = pick(CHARACTERS);

  state.anime.watches = true;
  state.anime.topAnime = pickN(ANIME_LIST, 3);
  state.anime.favoriteCharacterData = pick(ANIME_CHARACTERS);
  state.anime.waifuHusbandoData = pick(ANIME_CHARACTERS.filter(c => c.id !== state.anime.favoriteCharacterData.id));
  state.anime.waifuHusbandoSkip = '';
  state.anime.subDub = pick(['sub', 'dub', 'both', 'depends']);
  state.anime.comfortRewatch = pick(ANIME_LIST.filter(a => !state.anime.topAnime.includes(a)));

  state.movies.topMovies = pickN(MOVIES, 3);
  state.movies.starWars = Math.random() > 0.3;
  state.movies.starWarsTrilogy = pick(['original', 'prequel', 'sequel']);
  state.movies.starWarsSide = pick(['light', 'dark', 'grey']);
  state.movies.marvel = Math.random() > 0.3;
  state.movies.marvelHero = pick(['Iron Man', 'Spider-Man', 'Deadpool', 'Thor', 'Black Panther', 'Wolverine']);
  state.movies.comfortRewatch = pick(MOVIES.filter(m => !state.movies.topMovies.includes(m)));
  state.movies.favoriteQuote = pick([
    'Why so serious?',
    'I am Iron Man.',
    'Here\'s looking at you, kid.',
    'You talking to me?',
    'May the Force be with you.',
    'I\'ll be back.',
  ]);
  state.movies.favoriteQuoteSource = pick(['The Dark Knight', 'Avengers: Endgame', 'Casablanca', 'Taxi Driver', 'Star Wars', 'The Terminator']);

  state.hobbies.selected = pickN(HOBBY_OPTIONS, 3 + Math.floor(Math.random() * 4));
  state.hobbies.custom = pick(['', '', 'Lock picking', 'Speedcubing', 'Latte art']);
  state.hobbies.creative = pick(['', 'Music production', 'Pixel art', 'Writing short stories', '3D modeling']);

  for (const key of Object.keys(state.wildcards)) {
    const skip = Math.random() > 0.85;
    state.wildcards[key] = {
      value: skip ? '' : pick(WILDCARD_ANSWERS[key]),
      skip: skip ? 'skip' : '',
    };
  }

  state.extras.memeLink = '';
  state.extras.memeNote = '';

  state.cardConfig = { avatarId: '', highlightedMedia: [], showSocials: true, showCollection: true };

  save(state);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
