// Ironic narrator comments — appear at bottom of section card when filling specific fields.

const COMMENT_RULES = [
  // Anime
  {
    match: (f, s) => f === 'anime.watches' && s.anime.watches === false,
    messages: [
      "No anime. A bold stance. We respect it (barely).",
      "Anime? Not your thing. That's... fine.",
      "Section skipped. Character backstory: mysterious.",
    ],
  },
  {
    match: (f, s) => f === 'anime.subDub' && s.anime.subDub === 'dub',
    messages: [
      "Dub enjoyer spotted. No judgement. Well, a little.",
      "Living dangerously, I see.",
    ],
  },
  {
    match: (f, s) => f === 'anime.subDub' && s.anime.subDub === 'sub',
    messages: ["The correct answer. We can be friends."],
  },
  {
    match: (f, s) => f === 'anime.waifuHusbandoData' && s.anime.waifuHusbandoData,
    messages: [
      "Your dating sim arc begins here.",
      "Character attached. This is canon now.",
    ],
  },
  // Movies
  {
    match: (f, s) => f === 'movies.starWars' && s.movies.starWars === false,
    messages: ["Not a Star Wars fan. OK. Moving on quietly."],
  },
  {
    match: (f, s) => f === 'movies.marvel' && s.movies.marvel === false,
    messages: ["No Marvel either. You must be a blast at parties."],
  },
  {
    match: (f, s) => f === 'movies.starWarsSide' && s.movies.starWarsSide === 'dark',
    messages: ["Dark side, obviously. Expected."],
  },
  {
    match: (f, s) => f === 'movies.favoriteQuote' && s.movies.favoriteQuote,
    messages: [
      "Quote locked in. Deep.",
      "Very profound. Did you cross-stitch this?",
    ],
  },
  // Gaming
  {
    match: (f, s) => f === 'gaming.consoles' && s.gaming.consoles.length > 0 && s.gaming.consoles.every(c => c === 'mobile'),
    messages: ["Mobile only. Respect. Technically."],
  },
  {
    match: (f, s) => f === 'gaming.consoles' && s.gaming.consoles.includes('pc') && !s.gaming.consoles.some(c => ['playstation', 'xbox', 'nintendo'].includes(c)),
    messages: ["PC master race, but we won't say it out loud."],
  },
  {
    match: (f, s) => f === 'gaming.topGames' && s.gaming.topGames.length >= 3,
    messages: ["Three games. Hardest question on this whole form."],
  },
  // Hobbies
  {
    match: (f, s) => f === 'hobbies.selected' && s.hobbies.selected.includes('D&D / TTRPG'),
    messages: ["TTRPG detected. Your DM is reading this right now."],
  },
  {
    match: (f, s) => f === 'hobbies.selected' && s.hobbies.selected.includes('Fishing'),
    messages: ["Fishing. The most honest hobby."],
  },
  {
    match: (f, s) => f === 'hobbies.selected' && s.hobbies.selected.includes('Cosplay'),
    messages: ["Cosplay. Full send."],
  },
  {
    match: (f, s) => f === 'hobbies.selected' && s.hobbies.selected.includes('Coding'),
    messages: ["Coding as a hobby. You never log off, do you?"],
  },
  // Wildcards
  {
    match: (f, s) => f === 'wildcards.guiltyPleasure' && s.wildcards.guiltyPleasure && s.wildcards.guiltyPleasure.value,
    messages: ["Secret delivered. We promise not to tell. Probably."],
  },
  {
    match: (f, s) => f === 'wildcards.hillToDieOn' && s.wildcards.hillToDieOn && s.wildcards.hillToDieOn.value,
    messages: ["That hill has been chosen. Defend it."],
  },
  // Intro — Two Truths One Lie
  {
    match: (f, s) => ['intro.truth1', 'intro.truth2', 'intro.lie'].includes(f) && s.intro.truth1 && s.intro.truth2 && s.intro.lie,
    messages: ["Game loaded. One of those is definitely going to cause problems."],
  },
  // Intro — free time
  {
    match: (f, s) => f === 'intro.freeTimeChoice' && s.intro.freeTimeChoice === 'existential-crisis',
    messages: ["Existential crisis. Same, honestly. Same."],
  },
  {
    match: (f, s) => f === 'intro.freeTimeChoice' && s.intro.freeTimeChoice === 'doomscrolling',
    messages: ["Doomscrolling. Truly living the dream."],
  },
  {
    match: (f, s) => f === 'intro.freeTimeChoice' && s.intro.freeTimeChoice === 'napping',
    messages: ["Napping professionally. Career goals."],
  },
  // Intro — other fields
  {
    match: (f, s) => f === 'intro.motto' && s.intro.motto,
    messages: [
      "Motto entered. T-shirt printing in progress.",
      "Life philosophy locked. Very inspirational.",
    ],
  },
  {
    match: (f, s) => f === 'intro.careerHighlight' && s.intro.careerHighlight,
    messages: ["Career highlight noted. Mom would be proud."],
  },
  // Identity
  {
    match: (f, s) => f === 'identity.bestTimeToPresent' && s.identity.bestTimeToPresent && /\b[67]\s*am\b/i.test(s.identity.bestTimeToPresent),
    messages: ["6am? You ARE the 6am meeting."],
  },
  // Legends
  {
    match: (f, s) => f === 'legends.gundam' && s.legends.gundam === 'optimus',
    messages: [
      "That's a Transformer. Bold. Leaving it on your card.",
      "Optimus Prime is not a Gundam. We both know this. Noted anyway.",
      "Wrong franchise, right energy. Approved.",
    ],
  },
  {
    match: (f, s) => f === 'legends.goldSaintMode' && s.legends.goldSaintMode === 'zodiac',
    messages: [
      "Fine: birthday it is. We'll do the rest.",
      "Nobody has to know you answered the easy version.",
    ],
  },
  {
    match: (f, s) => f === 'legends.goldSaintMode' && s.legends.goldSaintMode === 'lost',
    messages: ["Completely fair. It was a very specific childhood."],
  },
  {
    match: (f, s) => f === 'legends.goldSaint' && s.legends.goldSaint === 'cancer',
    messages: ["Deathmask. Of all twelve. Interesting choice."],
  },
  {
    match: (f, s) => f === 'legends.dbForm' && s.legends.dbForm === 'krillin',
    messages: ["Krillin. The most honest answer on this page."],
  },
  {
    match: (f, s) => f === 'legends.tfFaction' && s.legends.tfFaction === 'decepticon',
    messages: ["Decepticon. HR has been notified."],
  },
  {
    match: (f, s) => f === 'legends.retroDepth' && s.legends.retroDepth === 'lost',
    messages: ["No shame. Skip ahead, none of this is on the test."],
  },
  // Extras
  {
    match: (f, s) => /^extras\.memes\.\d+\.url$/.test(f) && s.extras.memes.some(m => m.url),
    messages: ["Meme acquired. Cultural artifact preserved."],
  },
];

let _commentTimer = null;
let _currentComment = null;

export function getComment(field, state) {
  for (const rule of COMMENT_RULES) {
    if (rule.match(field, state)) {
      const msgs = rule.messages;
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
  }
  return null;
}

export function showComment(text) {
  const el = document.getElementById('section-comment');
  if (!el) return;

  if (_commentTimer) { clearTimeout(_commentTimer); _commentTimer = null; }
  if (_currentComment === text && !el.hidden) return;
  _currentComment = text;

  if (!el.hidden) {
    el.classList.add('comment-out');
    setTimeout(() => { el.classList.remove('comment-out'); _applyComment(el, text); }, 220);
  } else {
    _applyComment(el, text);
  }
}

function _applyComment(el, text) {
  el.textContent = text;
  el.hidden = false;
  el.classList.remove('comment-out');
  _commentTimer = setTimeout(() => {
    el.classList.add('comment-out');
    setTimeout(() => { el.hidden = true; _currentComment = null; }, 420);
    _commentTimer = null;
  }, 5000);
}

export function clearComment() {
  const el = document.getElementById('section-comment');
  if (!el || el.hidden) return;
  if (_commentTimer) { clearTimeout(_commentTimer); _commentTimer = null; }
  el.classList.add('comment-out');
  setTimeout(() => { el.hidden = true; _currentComment = null; }, 420);
}
