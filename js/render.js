import { state } from './state.js';
import {
  SECTIONS, CONSOLES, PLATFORMS, HOBBY_OPTIONS, WILDCARDS, FREE_TIME_OPTIONS,
  ANIME_GENRES, MOVIE_GENRES, GOLD_SAINTS, GUNDAMS, DB_FORMS, TF_FACTIONS,
  RETRO_DEPTH, goldSaintById, getSectionFill,
} from './data.js';
import { classifyMediaUrl } from './media-embed.js';
import { escHtml, $ } from './utils.js';
import { IconPerson, IconAnime, IconGame, IconMovie, IconPin } from './icons.js';

let lastRenderedSection = -1;
let lastNavigationDirection = 1; // 1 = forward, -1 = backward
const lastSectionFills = {}; // track per-section fill to detect full completion

export function render() {
  if (state.showBuilder) {
    import('./builder.js').then(({ renderBuilder }) => {
      $('section-label').textContent = 'Build Card';
      $('xp-text').textContent = 'Final';
      $('xp-fill').style.width = '100%';
      document.documentElement.style.setProperty('--section-glow', 'var(--accent-bright)');
      $('btn-next').textContent = 'Generate my card';
      $('btn-prev').style.visibility = 'visible';
      renderBuilder();
      renderMediaShelf();
      updateArrows(state);
      updateSheetsBarVisibility();
    });
    return;
  }

  // Determine navigation direction for slide animation
  if (lastRenderedSection !== -1 && state.currentSection !== lastRenderedSection) {
    lastNavigationDirection = state.currentSection > lastRenderedSection ? 1 : -1;
  }

  renderProgressBar();
  renderSection(state.currentSection !== lastRenderedSection);
  renderNav();
  renderMediaShelf();
  updateArrows(state);
  updateSheetsBarVisibility();
  lastRenderedSection = state.currentSection;
}

function updateSheetsBarVisibility() {
  const sheetsBar = document.getElementById('sheetsBar');
  if (sheetsBar) {
    sheetsBar.hidden = !state._user;
  }
}

function updateArrows(s) {
  const left = document.getElementById('arrowLeft');
  const right = document.getElementById('arrowRight');
  if (!left || !right) return;
  const hideLeft = s.currentSection === 0 && !s.showBuilder;
  const hideRight = s.showBuilder;
  left.style.opacity = hideLeft ? '0' : '1';
  left.style.pointerEvents = hideLeft ? 'none' : 'auto';
  right.style.opacity = hideRight ? '0' : '1';
  right.style.pointerEvents = hideRight ? 'none' : 'auto';
}

export function renderProgressBar() {
  const sec = SECTIONS[state.currentSection];
  const pct = ((state.currentSection + 1) / SECTIONS.length) * 100;
  $('section-label').textContent = sec.title;
  $('xp-text').textContent = `${state.currentSection + 1} / ${SECTIONS.length}`;
  $('xp-fill').style.width = pct + '%';
  document.documentElement.style.setProperty('--section-glow', `var(${sec.glow})`);
  renderSectionDots();
}

export function renderSectionDots() {
  const container = $('section-dots');
  if (!container) return;
  const newlyFull = [];
  container.innerHTML = SECTIONS.map((sec, i) => {
    const fill = getSectionFill(state, sec.key);
    const wasFull = lastSectionFills[sec.key] >= 1;
    const isFull = fill >= 1;
    if (isFull && !wasFull) newlyFull.push(i);
    lastSectionFills[sec.key] = fill;
    const active = i === state.currentSection;
    const fillClass = isFull ? ' dot-full' : fill > 0 ? ' dot-partial' : '';
    return `<button type="button" class="section-dot${active ? ' dot-active' : ''}${fillClass}" data-dot="${i}" title="${sec.title}" aria-label="${sec.title}, section ${i + 1} of ${SECTIONS.length}" style="--dot-glow: var(${sec.glow})">
      <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke-width="2" stroke="currentColor" opacity="0.3"/>${fill > 0 ? `<circle cx="10" cy="10" r="8" fill="none" stroke-width="2" stroke="currentColor" stroke-dasharray="${50.3}" stroke-dashoffset="${50.3 * (1 - fill)}" class="dot-fill-ring"/>` : ''}</svg>
    </button>`;
  }).join('');
  // Trigger ping animation on newly-completed dots
  if (newlyFull.length) {
    const btns = container.querySelectorAll('.section-dot');
    newlyFull.forEach(i => {
      const btn = btns[i];
      if (!btn) return;
      btn.classList.add('dot-ping');
      btn.addEventListener('animationend', () => btn.classList.remove('dot-ping'), { once: true });
    });
  }
}

export function renderNav() {
  const isFirst = state.currentSection === 0;
  const isLast = state.currentSection === SECTIONS.length - 1;
  $('btn-prev').style.visibility = isFirst ? 'hidden' : 'visible';
  $('btn-next').textContent = isLast ? 'Generate my card' : 'Next';
}

export function renderSection(animate) {
  const sec = SECTIONS[state.currentSection];
  const container = $('section-container');
  let animClass = '';
  if (animate) {
    animClass = lastNavigationDirection >= 0 ? ' section-enter-right' : ' section-enter-left';
  }
  renderSectionDots();
  let html = `<div class="section-card${animClass}">
    <div class="section-title">${escHtml(sec.title)}</div>
    <div class="section-flavor">${escHtml(sec.flavor)}</div>`;

  switch (sec.key) {
    case 'identity':  html += renderIdentity(); break;
    case 'gaming':    html += renderGaming(); break;
    case 'anime':     html += renderAnime(); break;
    case 'legends':   html += renderLegends(); break;
    case 'movies':    html += renderMovies(); break;
    case 'hobbies':   html += renderHobbies(); break;
    case 'wildcards': html += renderWildcards(); break;
    case 'extras':    html += renderExtras(); break;
    case 'intro':     html += renderIntro(); break;
  }

  html += '<div id="section-comment" class="section-comment" hidden></div>';
  html += '</div>';
  if (sec.key === 'intro') {
    html += `<div class="skip-intro-row"><button class="skip-intro-btn" onclick="skipIntro()">Skip, jump to the fun stuff →</button></div>`;
  }
  container.innerHTML = html;
}

function renderIdentity() {
  const d = state.identity;
  let html = `
    <div class="field-group">
      <label class="field-label">What should we call you?</label>
      <input class="field-input" type="text" value="${escHtml(d.name)}" data-field="identity.name" placeholder="Your name or what you go by" maxlength="50">
    </div>
    <div class="field-group">
      <label class="field-label">Where in the world are you?</label>
      <div class="field-hint">Search for your city to auto-detect timezone</div>
      <div class="search-wrapper" data-search-type="city" data-state-key="identity.city" data-max="1">
        <input class="field-input search-input" type="text" value="${escHtml(d.city)}" placeholder="Search for your city..." maxlength="100" autocomplete="off">
        <div class="search-results"></div>
      </div>
      ${d.timezone ? `<div class="timezone-display">${IconPin} ${escHtml(d.city)}${d.country ? ', ' + escHtml(d.country) : ''} <span class="timezone-badge">${escHtml(d.timezone)}</span></div>` : ''}
    </div>
    <div class="field-group">
      <label class="field-label">When are you most human?</label>
      <div class="field-hint">Serious or silly: e.g. &quot;after coffee&quot; or &quot;probably sleeping&quot;</div>
      <input class="field-input" type="text" value="${escHtml(d.bestTimeToPresent)}" data-field="identity.bestTimeToPresent" placeholder="e.g. When my coffee kicks in (UTC-3)" maxlength="120">
    </div>
    <div class="field-group">
      <label class="field-label">Where can folks find you?</label>
      <div class="field-hint">Pick platforms and drop your handle, for anyone who wants to connect</div>
      <div class="platform-grid">
        ${PLATFORMS.map(p => {
          const existing = d.handles.find(h => h.platform === p.id);
          return `<div class="platform-entry${existing ? ' active' : ''}">
            <button class="platform-pill${existing ? ' active' : ''}" data-platform="${p.id}">${escHtml(p.label)}</button>
            ${existing ? `<input class="platform-handle" type="text" value="${escHtml(existing.handle)}" data-platform-handle="${p.id}" placeholder="Your ${escHtml(p.label)}" maxlength="60">` : ''}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">A line or two for whoever's presenting</label>
      <div class="field-hint">Helps tailor the vibe, short bio, what you do, what you're into.</div>
      <textarea class="field-input" data-field="identity.description" placeholder="e.g. Backend dev, coffee addict, always has a book" maxlength="300">${escHtml(d.description)}</textarea>
    </div>`;
  return html;
}

function renderGaming() {
  const d = state.gaming;
  let html = `
    <div class="field-group">
      <label class="field-label">Where do you game?</label>
      <div class="field-hint">Pick all that apply</div>
      <div class="console-grid">
        ${CONSOLES.map(c => `
          <div class="console-option${d.consoles.includes(c.id) ? ' selected' : ''}" data-console="${c.id}">
            ${c.icon.startsWith('http') 
              ? `<img src="${c.icon}" class="console-icon-img" alt="${escHtml(c.label)}" onerror="this.style.display='none';">` 
              : c.icon.startsWith('<svg') 
                ? `<span class="console-icon-svg">${c.icon}</span>`
                : `<span class="console-icon">${c.icon}</span>`}
            ${escHtml(c.label)}
          </div>`).join('')}
      </div>
    </div>`;

  html += renderSearchField('Top 3 games that define you', 'game', 'gaming.topGames', d.topGames, 3, 'Search games...');

  if (d.topGames.length) {
    html += `<div class="media-cards">${d.topGames.map((g, i) => renderMediaCard(g, 'gaming.topGames', i)).join('')}</div>`;
  }

  html += renderSearchField('One game you\'d wipe from memory just to experience again?', 'game', 'gaming.replayGame', d.replayGame ? [d.replayGame] : [], 1, 'Search games...');

  html += `
    <div class="field-group">
      <label class="field-label">Favorite game character?</label>
      <input class="field-input" type="text" value="${escHtml(d.favoriteCharacter)}" data-field="gaming.favoriteCharacter" placeholder="Master Chief, Tifa, Link..." maxlength="60">
    </div>
    <div class="field-group">
      <label class="field-label">Worst game you've ever played?</label>
      <div class="field-hint">The one you wish you could un-play</div>
      <input class="field-input" type="text" value="${escHtml(d.worstGame)}" data-field="gaming.worstGame" placeholder="That game that broke your heart..." maxlength="100">
    </div>`;

  return html;
}

function renderAnime() {
  const d = state.anime;
  let html = `
    <div class="field-group">
      <label class="field-label">Do you watch anime?</label>
      <div class="toggle-row">
        <button class="toggle-btn${d.watches === true ? ' active' : ''}" data-toggle="anime.watches" data-val="true">Yes</button>
        <button class="toggle-btn${d.watches === false ? ' active' : ''}" data-toggle="anime.watches" data-val="false">Nah</button>
      </div>
    </div>`;

  if (d.watches === true) {
    html += '<div class="sub-section">';
    
    html += `
      <div class="field-group">
        <label class="field-label">What genres do you enjoy?</label>
        <div class="field-hint">Pick your favorite anime genres</div>
        <div class="hobby-grid">
          ${ANIME_GENRES.map(g => `<button class="hobby-tag${d.genres.includes(g) ? ' active' : ''}" data-anime-genre="${escHtml(g)}">${escHtml(g)}</button>`).join('')}
        </div>
      </div>`;

    if (d.genres.length > 0) {
      html += `
        <div class="field-group">
          <label class="field-label">Favorite ${d.genres.join(', ')} anime?</label>
          <input class="field-input" type="text" value="${escHtml(d.favoriteFromGenre)}" data-field="anime.favoriteFromGenre" placeholder="Your favorite from these genres" maxlength="100">
        </div>`;
    }
    
    html += renderSearchField('Top 3 anime', 'anime', 'anime.topAnime', d.topAnime, 3, 'Search anime...');

    if (d.topAnime.length) {
      html += `<div class="media-cards">${d.topAnime.map((a, i) => renderMediaCard(a, 'anime.topAnime', i)).join('')}</div>`;
    }

    html += renderSearchField('Favorite anime character?', 'character', 'anime.favoriteCharacterData', d.favoriteCharacterData ? [d.favoriteCharacterData] : [], 1, 'Search anime characters...');

    html += renderSearchField('Waifu or husbando?', 'character', 'anime.waifuHusbandoData', d.waifuHusbandoData ? [d.waifuHusbandoData] : [], 1, 'Search anime characters...');
    html += `
      <div class="escape-row" style="margin-top:calc(var(--space-2) * -1); margin-bottom:var(--space-6)">
        <button class="escape-btn${d.waifuHusbandoSkip === 'cant' ? ' active' : ''}" data-escape="anime.waifuHusbandoSkip" data-val="cant">Can't think of it right now</button>
        <button class="escape-btn${d.waifuHusbandoSkip === 'skip' ? ' active' : ''}" data-escape="anime.waifuHusbandoSkip" data-val="skip">Prefer not to say</button>
      </div>
      <div class="field-group">
        <label class="field-label">Sub or dub?</label>
        <div class="quick-choice">
          <button class="choice-pill${d.subDub === 'sub' ? ' active' : ''}" data-choice="anime.subDub" data-val="sub">Sub</button>
          <button class="choice-pill${d.subDub === 'dub' ? ' active' : ''}" data-choice="anime.subDub" data-val="dub">Dub</button>
          <button class="choice-pill${d.subDub === 'both' ? ' active' : ''}" data-choice="anime.subDub" data-val="both">Both</button>
          <button class="choice-pill${d.subDub === 'depends' ? ' active' : ''}" data-choice="anime.subDub" data-val="depends">Depends</button>
        </div>
      </div>`;

    html += renderSearchField('Comfort rewatch anime?', 'anime', 'anime.comfortRewatch', d.comfortRewatch ? [d.comfortRewatch] : [], 1, 'Search anime...');
    
    html += `
      <div class="field-group">
        <label class="field-label">Worst anime you've ever watched?</label>
        <div class="field-hint">The one that made you question your taste</div>
        <input class="field-input" type="text" value="${escHtml(d.worstAnime)}" data-field="anime.worstAnime" placeholder="That anime you regret starting..." maxlength="100">
      </div>`;
    
    html += '</div>';
  }

  return html;
}

/**
 * The Gold Saint question, in whichever framing the person asked for.
 *
 * `legends.goldSaintMode` chooses the labels, not the answer — the twelve chips
 * write the same `legends.goldSaint` field either way, so switching framing keeps
 * a pick that was already made. In `lost` mode the chips are hidden rather than
 * cleared: a mistaken tap on "never seen it" should not delete an answer, and the
 * card already ignores `goldSaint` while the mode says `lost`.
 */
function renderGoldSaint(d) {
  const mode = d.goldSaintMode;
  const picked = goldSaintById(d.goldSaint);

  const label = mode === 'zodiac'
    ? 'What\'s your zodiac sign?'
    : 'Favourite Gold Saint?';
  const hint = mode === 'zodiac'
    ? 'The twelve Gold Saints guard the twelve houses of the zodiac. One each. Pick your sign and we\'ll tell you whose armour you\'d be wearing.'
    : 'Saint Seiya / Knights of the Zodiac: the twelve of the Sanctuary.';

  let chips = '';
  if (mode !== 'lost') {
    chips = `<div class="saint-grid">
      ${GOLD_SAINTS.map(g => {
        const active = d.goldSaint === g.id ? ' active' : '';
        const title = mode === 'zodiac' ? g.sign : g.saint;
        const sub = mode === 'zodiac' ? g.dates : g.sign;
        return `<button class="saint-chip${active}" data-choice="legends.goldSaint" data-val="${g.id}">
          <span class="saint-symbol" aria-hidden="true">${g.symbol}</span>
          <span class="saint-name">${escHtml(title)}</span>
          <span class="saint-sub">${escHtml(sub)}</span>
        </button>`;
      }).join('')}
    </div>`;
  }

  let reveal = '';
  if (mode === 'zodiac' && picked) {
    reveal = `<div class="saint-reveal">
      <span class="saint-reveal-symbol" aria-hidden="true">${picked.symbol}</span>
      <div>
        <strong>${escHtml(picked.saint)} of ${escHtml(picked.sign)}</strong>
        <div class="field-hint">That's your Gold Saint. You didn't need to know the show after all.</div>
      </div>
    </div>`;
  }

  const lostNote = mode === 'lost'
    ? '<div class="field-hint saint-lost">Fair. It was a Japanese show about teenagers in zodiac armour punching each other at the speed of light. Moving on.</div>'
    : '';

  return `
    <div class="field-group">
      <label class="field-label">${escHtml(label)}</label>
      <div class="field-hint">${escHtml(hint)}</div>
      ${chips}
      ${reveal}
      ${lostNote}
      <div class="escape-row">
        <button class="escape-btn${mode === 'zodiac' ? ' active' : ''}" data-escape="legends.goldSaintMode" data-val="zodiac">I don't know this one, just ask my sign</button>
        <button class="escape-btn${mode === 'lost' ? ' active' : ''}" data-escape="legends.goldSaintMode" data-val="lost">No idea what any of this is</button>
      </div>
    </div>`;
}

function renderLegends() {
  const d = state.legends;

  const pillRow = (label, hint, field, options) => `
    <div class="field-group">
      <label class="field-label">${escHtml(label)}</label>
      ${hint ? `<div class="field-hint">${escHtml(hint)}</div>` : ''}
      <div class="quick-choice">
        ${options.map(o => `<button class="choice-pill${d[field.split('.')[1]] === o.id ? ' active' : ''}" data-choice="${field}" data-val="${o.id}">${escHtml(o.label)}</button>`).join('')}
      </div>
    </div>`;

  const textRow = (label, hint, field, placeholder, max = 100) => `
    <div class="field-group">
      <label class="field-label">${escHtml(label)}</label>
      ${hint ? `<div class="field-hint">${escHtml(hint)}</div>` : ''}
      <input class="field-input" type="text" value="${escHtml(d[field.split('.')[1]])}" data-field="${field}" placeholder="${escHtml(placeholder)}" maxlength="${max}">
    </div>`;

  let html = pillRow(
    'How deep does the retro go?',
    'Sets expectations for everything below: "completely lost" is a real answer.',
    'legends.retroDepth', RETRO_DEPTH,
  );

  html += renderGoldSaint(d);

  html += `
    <div class="field-group">
      <label class="field-label">Favourite Gundam?</label>
      <div class="field-hint">Pick the mobile suit. Choose carefully. One of these is not a Gundam.</div>
      <div class="gundam-grid">
        ${GUNDAMS.map(g => `
          <button class="gundam-chip${d.gundam === g.id ? ' active' : ''}${g.impostor ? ' gundam-chip--impostor' : ''}" data-choice="legends.gundam" data-val="${g.id}">
            <span class="gundam-name">${escHtml(g.name)}</span>
            <span class="gundam-from">${escHtml(g.from)}</span>
          </button>`).join('')}
      </div>
    </div>`;

  html += pillRow('What power-up are you running on today?', 'Dragon Ball, but for Mondays.', 'legends.dbForm', DB_FORMS);
  html += pillRow('Autobot or Decepticon?', '', 'legends.tfFaction', TF_FACTIONS);

  html += textRow('First console or computer you ever touched', 'The one that started it: borrowed cousins\' consoles count.', 'legends.firstMachine', 'Family Game, Sega Genesis, a beige 486...', 80);
  html += textRow('An opening theme you still know by heart', 'Bonus points if you know it in a dubbed language.', 'legends.openingTheme', 'Cha-La Head-Cha-La, Pegasus Fantasy...', 100);
  html += textRow('Your Saturday-morning hero', 'Cartoon, tokusatsu, or whatever was on where you grew up.', 'legends.saturdayHero', 'He-Man, Sailor Moon, El Chapulín Colorado...', 80);
  html += textRow('The arcade game that ate your coins', '', 'legends.arcadeGame', 'Metal Slug, Street Fighter II, Marvel vs Capcom...', 80);
  html += textRow('Who would you send into a bad meeting?', 'Any hero, mech, or cartoon character. They fight on your behalf.', 'legends.meetingChampion', 'Optimus Prime, obviously', 80);

  return html;
}

function renderMovies() {
  const d = state.movies;
  let html = `
    <div class="field-hint section-hint" style="margin-bottom:var(--space-4)">Presenters: your picks here are perfect for references and icebreakers.</div>`;

  html += `
    <div class="field-group">
      <label class="field-label">What genres do you enjoy?</label>
      <div class="field-hint">Pick your favorite movie/series genres</div>
      <div class="hobby-grid">
        ${MOVIE_GENRES.map(g => `<button class="hobby-tag${d.genres.includes(g) ? ' active' : ''}" data-movie-genre="${escHtml(g)}">${escHtml(g)}</button>`).join('')}
      </div>
    </div>`;

  if (d.genres.length > 0) {
    html += `
      <div class="field-group">
        <label class="field-label">Favorite ${d.genres.join(', ')} movie/series?</label>
        <input class="field-input" type="text" value="${escHtml(d.favoriteFromGenre)}" data-field="movies.favoriteFromGenre" placeholder="Your favorite from these genres" maxlength="100">
      </div>`;
  }

  html += renderSearchField('Top 3 movies or series', 'movie', 'movies.topMovies', d.topMovies, 3, 'Search movies and series...');

  if (d.topMovies.length) {
    html += `<div class="media-cards">${d.topMovies.map((m, i) => renderMediaCard(m, 'movies.topMovies', i)).join('')}</div>`;
  }

  html += `
    <div class="field-group">
      <label class="field-label">Star Wars fan?</label>
      <div class="toggle-row">
        <button class="toggle-btn${d.starWars === true ? ' active' : ''}" data-toggle="movies.starWars" data-val="true">Yes</button>
        <button class="toggle-btn${d.starWars === false ? ' active' : ''}" data-toggle="movies.starWars" data-val="false">Nah</button>
      </div>
    </div>`;

  if (d.starWars === true) {
    html += `<div class="sub-section">
      <div class="sub-section-title">Star Wars</div>
      <div class="field-group">
        <label class="field-label">Favorite trilogy?</label>
        <div class="quick-choice">
          <button class="choice-pill${d.starWarsTrilogy === 'original' ? ' active' : ''}" data-choice="movies.starWarsTrilogy" data-val="original">Original</button>
          <button class="choice-pill${d.starWarsTrilogy === 'prequel' ? ' active' : ''}" data-choice="movies.starWarsTrilogy" data-val="prequel">Prequel</button>
          <button class="choice-pill${d.starWarsTrilogy === 'sequel' ? ' active' : ''}" data-choice="movies.starWarsTrilogy" data-val="sequel">Sequel</button>
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Light side or dark side?</label>
        <div class="quick-choice">
          <button class="choice-pill${d.starWarsSide === 'light' ? ' active' : ''}" data-choice="movies.starWarsSide" data-val="light">Light Side</button>
          <button class="choice-pill${d.starWarsSide === 'dark' ? ' active' : ''}" data-choice="movies.starWarsSide" data-val="dark">Dark Side</button>
          <button class="choice-pill${d.starWarsSide === 'grey' ? ' active' : ''}" data-choice="movies.starWarsSide" data-val="grey">Grey Jedi</button>
        </div>
      </div>
    </div>`;
  }

  html += `
    <div class="field-group">
      <label class="field-label">Marvel fan?</label>
      <div class="toggle-row">
        <button class="toggle-btn${d.marvel === true ? ' active' : ''}" data-toggle="movies.marvel" data-val="true">Yes</button>
        <button class="toggle-btn${d.marvel === false ? ' active' : ''}" data-toggle="movies.marvel" data-val="false">Nah</button>
      </div>
    </div>`;

  if (d.marvel === true) {
    html += `<div class="sub-section">
      <div class="sub-section-title">Marvel</div>
      <div class="field-group">
        <label class="field-label">Favorite hero?</label>
        <input class="field-input" type="text" value="${escHtml(d.marvelHero)}" data-field="movies.marvelHero" placeholder="Iron Man, Spider-Man, Deadpool..." maxlength="60">
      </div>
    </div>`;
  }

  html += `
    <div class="field-group">
      <label class="field-label">DC fan?</label>
      <div class="toggle-row">
        <button class="toggle-btn${d.dc === true ? ' active' : ''}" data-toggle="movies.dc" data-val="true">Yes</button>
        <button class="toggle-btn${d.dc === false ? ' active' : ''}" data-toggle="movies.dc" data-val="false">Nah</button>
      </div>
    </div>`;

  if (d.dc === true) {
    html += `<div class="sub-section">
      <div class="sub-section-title">DC Comics</div>
      <div class="field-group">
        <label class="field-label">Favorite hero?</label>
        <input class="field-input" type="text" value="${escHtml(d.dcHero)}" data-field="movies.dcHero" placeholder="Batman, Superman, Wonder Woman..." maxlength="60">
      </div>
    </div>`;
  }

  html += renderSearchField('Comfort rewatch?', 'movie', 'movies.comfortRewatch', d.comfortRewatch ? [d.comfortRewatch] : [], 1, 'Search movies and series...');

  html += `
    <div class="field-group">
      <label class="field-label">Favorite quote?</label>
      <input class="field-input" type="text" value="${escHtml(d.favoriteQuote)}" data-field="movies.favoriteQuote" placeholder="Yippee-ki-yay..." maxlength="150">
      <input class="field-input" type="text" value="${escHtml(d.favoriteQuoteSource)}" data-field="movies.favoriteQuoteSource" placeholder="From which movie or series?" maxlength="60" style="margin-top:var(--space-2)">
    </div>
    <div class="field-group">
      <label class="field-label">Worst movie or series you've ever watched?</label>
      <div class="field-hint">The one you wish you could unsee</div>
      <input class="field-input" type="text" value="${escHtml(d.worstMovie)}" data-field="movies.worstMovie" placeholder="That disappointment you'll never forgive..." maxlength="100">
    </div>`;

  return html;
}

function renderHobbies() {
  const d = state.hobbies;
  let html = `
    <div class="field-group">
      <label class="field-label">What do you do for fun?</label>
      <div class="field-hint">Presenters: these make great conversation starters.</div>
      <div class="hobby-grid">
        ${HOBBY_OPTIONS.map(h => `<button class="hobby-tag${d.selected.includes(h) ? ' active' : ''}" data-hobby="${escHtml(h)}">${escHtml(h)}</button>`).join('')}
      </div>
    </div>
    <div class="field-group">
      <label class="field-label">Something else?</label>
      <input class="field-input" type="text" value="${escHtml(d.custom)}" data-field="hobbies.custom" placeholder="Add your own hobby" maxlength="60">
    </div>
    <div class="field-group">
      <label class="field-label">Any creative hobbies?</label>
      <input class="field-input" type="text" value="${escHtml(d.creative)}" data-field="hobbies.creative" placeholder="Painting, music production, woodworking..." maxlength="100">
    </div>`;
  return html;
}

function renderWildcards() {
  const d = state.wildcards;
  const i = state.intro;
  const wildcardHtml = WILDCARDS.map(w => {
    const val = d[w.key];
    if (!val) return '';
    const isSkipped = val.skip !== '';
    return `
    <div class="field-group">
      <label class="field-label">${escHtml(w.label)}</label>
      <textarea class="field-input" data-wildcard="${w.key}" placeholder="Go on, we won't judge" maxlength="200"${isSkipped ? ' disabled' : ''}>${escHtml(val.value)}</textarea>
      <div class="escape-row">
        <button class="escape-btn${val.skip === 'cant' ? ' active' : ''}" data-escape-wc="${w.key}" data-val="cant">Can't think of it right now</button>
        <button class="escape-btn${val.skip === 'skip' ? ' active' : ''}" data-escape-wc="${w.key}" data-val="skip">Prefer not to say</button>
      </div>
    </div>`;
  }).join('');

  const truthLieHtml = `
    <div class="story-group" style="margin-top:var(--space-6)">
      <div class="story-group-label">&#x1F3B2; Two Truths, One Lie</div>
      <div class="field-hint" style="margin-bottom:var(--space-4)">Write two things that are true and one sneaky lie. The crowd guesses which is which.</div>
      <div class="truth-lie-section">
        <div class="truth-card">
          <div class="statement-badge">&#x2713; Truth</div>
          <textarea class="field-input" data-field="intro.truth1" placeholder="Something true about you..." maxlength="120">${escHtml(i.truth1)}</textarea>
        </div>
        <div class="truth-card">
          <div class="statement-badge">&#x2713; Truth</div>
          <textarea class="field-input" data-field="intro.truth2" placeholder="Another true thing..." maxlength="120">${escHtml(i.truth2)}</textarea>
        </div>
        <div class="lie-card">
          <div class="statement-badge">&#x2717; Lie</div>
          <textarea class="field-input" data-field="intro.lie" placeholder="And the sneaky lie..." maxlength="120">${escHtml(i.lie)}</textarea>
        </div>
      </div>
    </div>`;

  return wildcardHtml + truthLieHtml;
}

/**
 * The preview under a meme URL box.
 *
 * Exported because `onInput` swaps it in place on every keystroke: a full
 * `renderSection` would rebuild the input the person is typing into and take the
 * caret with it.
 */
export function memePreviewHtml(url) {
  const media = classifyMediaUrl(url);
  if (!media) {
    return (url || '').trim()
      ? '<div class="meme-preview meme-preview--empty">Not a link yet, needs to start with http:// or https://</div>'
      : '';
  }
  if (media.kind === 'link') {
    return `<div class="meme-preview meme-preview--link">
      <span class="meme-kind">Link</span>
      <span class="meme-host">${escHtml(media.label)}</span>
    </div>`;
  }
  return `<div class="meme-preview">
    <img class="meme-thumb" src="${escHtml(media.thumb)}" alt="" loading="lazy"
         onerror="this.closest('.meme-preview').classList.add('meme-preview--broken')">
    <span class="meme-kind">${escHtml(media.label)}</span>
    <span class="meme-broken-note">Couldn't load that image. The link still works on your card.</span>
  </div>`;
}

function renderExtras() {
  const memes = state.extras.memes;
  const slots = memes.map((m, i) => `
    <div class="field-group meme-slot">
      <label class="field-label">${i === 0
        ? 'A meme or reference that lives in your head rent-free'
        : 'One more, if the first one didn\'t cover it'}</label>
      <div class="field-hint">${i === 0
        ? 'YouTube link or a direct image URL shows a preview. Anything else just links.'
        : 'Optional, some people are a two-meme situation.'}</div>
      <input class="field-input" type="url" value="${escHtml(m.url)}" data-field="extras.memes.${i}.url" data-preview="meme-preview-${i}" placeholder="https://youtu.be/... or https://.../meme.jpg" maxlength="300">
      <div class="meme-preview-slot" id="meme-preview-${i}">${memePreviewHtml(m.url)}</div>
      <input class="field-input" type="text" value="${escHtml(m.note)}" data-field="extras.memes.${i}.note" placeholder="What is it / why it matters" maxlength="120" style="margin-top:var(--space-2)">
    </div>`).join('');

  return slots;
}

function renderIntro() {
  const d = state.intro;

  let html = `
    <div class="story-group">
      <div class="story-group-label">&#x1F9D1;&#x200D;&#x1F4BC; Career</div>
      <div class="field-group">
        <label class="field-label">What do you do for work?</label>
        <input class="field-input" type="text" value="${escHtml(d.jobTitle)}" data-field="intro.jobTitle" placeholder="Software Engineer, Designer, PM..." maxlength="80">
      </div>
      <div class="intro-row">
        <div class="field-group">
          <label class="field-label">Years of experience?</label>
          <input class="field-input" type="text" value="${escHtml(d.yearsExperience)}" data-field="intro.yearsExperience" placeholder="5+ years, since forever..." maxlength="30">
        </div>
        <div class="field-group">
          <label class="field-label">Previously at?</label>
          <input class="field-input" type="text" value="${escHtml(d.prevCompany)}" data-field="intro.prevCompany" placeholder="Company you came from" maxlength="60">
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Your proudest career moment or achievement</label>
        <div class="field-hint">The thing you'd mention if someone asked what you're most proud of</div>
        <input class="field-input" type="text" value="${escHtml(d.careerHighlight)}" data-field="intro.careerHighlight" placeholder="Shipped X, led Y, built Z from scratch..." maxlength="120">
      </div>
    </div>

    <div class="story-group">
      <div class="story-group-label">&#x1F9E0; Personal</div>
      <div class="field-group">
        <label class="field-label">Your personal motto or life philosophy</label>
        <div class="field-hint">The sentence you'd put on a mug</div>
        <input class="field-input" type="text" value="${escHtml(d.motto)}" data-field="intro.motto" placeholder="Work hard, stay humble. Or just vibes." maxlength="120">
      </div>
      <div class="field-group">
        <label class="field-label">One thing most people don't know about you</label>
        <div class="field-hint">The detail that makes people go "wait, really?"</div>
        <input class="field-input" type="text" value="${escHtml(d.unknownFact)}" data-field="intro.unknownFact" placeholder="I was a competitive chess player / I speak 4 languages..." maxlength="120">
      </div>
      <div class="field-group">
        <label class="field-label">What you're learning or exploring right now</label>
        <div class="field-hint">Could be professional or completely random</div>
        <input class="field-input" type="text" value="${escHtml(d.currentlyLearning)}" data-field="intro.currentlyLearning" placeholder="Rust, ceramics, how to not overthink things..." maxlength="120">
      </div>
    </div>

    <div class="story-group">
      <div class="story-group-label">&#x26A1; Free Time</div>
      <div class="field-group">
        <label class="field-label">In my free time I...</label>
        <div class="field-hint">Pick one (or pick the one that makes people ask questions)</div>
        <div class="freetime-grid">
          ${FREE_TIME_OPTIONS.map(o => `<button type="button" class="freetime-pill${d.freeTimeChoice === o.id ? ' active' : ''}" data-choice="intro.freeTimeChoice" data-val="${escHtml(o.id)}">${escHtml(o.label)}</button>`).join('')}
        </div>
        ${d.freeTimeChoice === 'custom' ? `
        <input class="field-input" type="text" value="${escHtml(d.freeTimeCustom)}" data-field="intro.freeTimeCustom" placeholder="Tell us what you actually do..." maxlength="80" style="margin-top:var(--space-3)">` : ''}
      </div>
    </div>`;

  return html;
}

function renderMediaCard(item, stateKey, idx) {
  return `<div class="media-card">
    ${item.image ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.name)}" loading="lazy">` : '<div class="media-card-placeholder"></div>'}
    <div class="media-card-info">
      <div class="media-card-name">${escHtml(item.name)}</div>
      ${item.year ? `<div class="media-card-meta">${escHtml(item.year)}</div>` : ''}
    </div>
    <span class="media-card-remove" data-remove="${stateKey}" data-idx="${idx}">&times;</span>
  </div>`;
}

function renderSearchField(label, type, stateKey, selected, max, placeholder) {
  const fieldId = stateKey.replace(/\./g, '-');
  const atMax = selected && selected.length >= max;

  let tags = '';
  if (type !== 'game' && type !== 'anime' && type !== 'movie') {
    tags = (selected || []).map((item, i) => {
      const typeIcon = type === 'character' ? IconPerson : IconAnime;
      return `
      <span class="selected-tag">
        ${item.image ? `<img src="${escHtml(item.image)}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">` : ''}
        <span class="selected-tag-icon" style="display:${item.image ? 'none' : 'inline-flex'}; align-items:center">${typeIcon}</span>
        ${escHtml(item.name)}
        <span class="tag-remove" data-remove="${stateKey}" data-idx="${i}">&times;</span>
      </span>`;
    }).join('');
  }

  return `
    <div class="field-group">
      ${label ? `<label class="field-label">${escHtml(label)}${max > 1 ? ` (${selected ? selected.length : 0}/${max})` : ''}</label>` : ''}
      <div class="search-wrapper" data-search-type="${type}" data-state-key="${stateKey}" data-max="${max}">
        <input class="field-input search-input" type="text" placeholder="${escHtml(placeholder)}" id="search-${fieldId}"${atMax ? ' disabled' : ''}>
        <div class="search-results" id="results-${fieldId}"></div>
      </div>
      ${tags ? `<div class="selected-tags">${tags}</div>` : ''}
    </div>`;
}

export function renderMediaShelf() {
  const shelf = $('media-shelf');
  const allMedia = [
    ...state.gaming.topGames.map(g => ({ ...g, type: 'game' })),
    ...(state.gaming.replayGame ? [{ ...state.gaming.replayGame, type: 'game' }] : []),
    ...state.anime.topAnime.map(a => ({ ...a, type: 'anime' })),
    ...(state.anime.comfortRewatch ? [{ ...state.anime.comfortRewatch, type: 'anime' }] : []),
    ...state.movies.topMovies.map(m => ({ ...m, type: 'movie' })),
    ...(state.movies.comfortRewatch ? [{ ...state.movies.comfortRewatch, type: 'movie' }] : []),
  ];

  if (!allMedia.length) {
    shelf.style.display = 'none';
    return;
  }

  shelf.style.display = '';
  shelf.innerHTML = `
    <div class="shelf-label">Your picks</div>
    <div class="shelf-scroll">
      ${allMedia.map(m => {
        const typeIcon = m.type === 'game' ? IconGame : m.type === 'anime' ? IconAnime : IconMovie;
        const imgHtml = m.image
          ? `<img src="${escHtml(m.image)}" alt="${escHtml(m.name)}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">`
          : '';
        return `
        <div class="shelf-item shelf-item--${m.type}">
          ${imgHtml}
          <div class="shelf-item-fallback" style="display:${m.image ? 'none' : 'flex'}">
            <span class="shelf-item-icon">${typeIcon}</span>
          </div>
          <div class="shelf-item-name">${escHtml(m.name)}</div>
        </div>`;
      }).join('')}
    </div>`;
}
