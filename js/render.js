import { state } from './state.js';
import { SECTIONS, CONSOLES, PLATFORMS, HOBBY_OPTIONS, WILDCARDS, FREE_TIME_OPTIONS, getSectionFill } from './data.js';
import { escHtml, $ } from './utils.js';

let lastRenderedSection = -1;
let lastNavigationDirection = 1; // 1 = forward, -1 = backward

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
  lastRenderedSection = state.currentSection;
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
  container.innerHTML = SECTIONS.map((sec, i) => {
    const fill = getSectionFill(state, sec.key);
    const active = i === state.currentSection;
    const fillClass = fill >= 1 ? ' dot-full' : fill > 0 ? ' dot-partial' : '';
    return `<button type="button" class="section-dot${active ? ' dot-active' : ''}${fillClass}" data-dot="${i}" title="${sec.title}" aria-label="${sec.title}, section ${i + 1} of ${SECTIONS.length}" style="--dot-glow: var(${sec.glow})">
      <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke-width="2" stroke="currentColor" opacity="0.3"/>${fill > 0 ? `<circle cx="10" cy="10" r="8" fill="none" stroke-width="2" stroke="currentColor" stroke-dasharray="${50.3}" stroke-dashoffset="${50.3 * (1 - fill)}" class="dot-fill-ring"/>` : ''}</svg>
    </button>`;
  }).join('');
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
    case 'movies':    html += renderMovies(); break;
    case 'hobbies':   html += renderHobbies(); break;
    case 'wildcards': html += renderWildcards(); break;
    case 'extras':    html += renderExtras(); break;
    case 'intro':     html += renderIntro(); break;
  }

  html += '</div>';
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
      <div class="field-hint">So nobody schedules 8am your time by accident.</div>
      <input class="field-input" type="text" value="${escHtml(d.country)}" data-field="identity.country" placeholder="e.g. Chile, Germany, Remote" maxlength="60">
    </div>
    <div class="field-group">
      <label class="field-label">When are you most human?</label>
      <div class="field-hint">Serious or silly — e.g. &quot;after coffee&quot; or &quot;probably sleeping&quot;</div>
      <input class="field-input" type="text" value="${escHtml(d.bestTimeToPresent)}" data-field="identity.bestTimeToPresent" placeholder="e.g. When my coffee kicks in (UTC-3)" maxlength="120">
    </div>
    <div class="field-group">
      <label class="field-label">Where can folks find you?</label>
      <div class="field-hint">Pick platforms and drop your handle — for anyone who wants to connect</div>
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
      <div class="field-hint">Helps tailor the vibe — short bio, what you do, what you're into.</div>
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
            <span class="console-icon">${c.icon}</span>
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
    html += '</div>';
  }

  return html;
}

function renderMovies() {
  const d = state.movies;
  let html = `
    <div class="field-hint section-hint" style="margin-bottom:var(--space-4)">Presenters: your picks here are perfect for references and icebreakers.</div>`;

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

  html += renderSearchField('Comfort rewatch?', 'movie', 'movies.comfortRewatch', d.comfortRewatch ? [d.comfortRewatch] : [], 1, 'Search movies and series...');

  html += `
    <div class="field-group">
      <label class="field-label">Favorite quote?</label>
      <input class="field-input" type="text" value="${escHtml(d.favoriteQuote)}" data-field="movies.favoriteQuote" placeholder="Yippee-ki-yay..." maxlength="150">
      <input class="field-input" type="text" value="${escHtml(d.favoriteQuoteSource)}" data-field="movies.favoriteQuoteSource" placeholder="From which movie or series?" maxlength="60" style="margin-top:var(--space-2)">
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
  return WILDCARDS.map(w => {
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
}

function renderExtras() {
  const d = state.extras;
  return `
    <div class="field-group">
      <label class="field-label">A meme or reference that lives in your head rent-free</label>
      <div class="field-hint">So presenters get your vibe — link or describe.</div>
      <input class="field-input" type="url" value="${escHtml(d.memeLink)}" data-field="extras.memeLink" placeholder="Paste a link to a meme, video, or vibe" maxlength="300">
      <input class="field-input" type="text" value="${escHtml(d.memeNote)}" data-field="extras.memeNote" placeholder="What is it / why it matters" maxlength="120" style="margin-top:var(--space-2)">
    </div>`;
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
        <label class="field-label">Which city?</label>
        <div class="field-hint">More specific than your country — helps with timezone context</div>
        <input class="field-input" type="text" value="${escHtml(d.city)}" data-field="intro.city" placeholder="Santiago, Berlin, Remote..." maxlength="60">
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
      <div class="story-group-label">&#x26A1; Fun Facts</div>
      <div class="field-group">
        <label class="field-label">In my free time I...</label>
        <div class="field-hint">Pick one (or pick the one that makes people ask questions)</div>
        <div class="freetime-grid">
          ${FREE_TIME_OPTIONS.map(o => `<button type="button" class="freetime-pill${d.freeTimeChoice === o.id ? ' active' : ''}" data-choice="intro.freeTimeChoice" data-val="${escHtml(o.id)}">${escHtml(o.label)}</button>`).join('')}
        </div>
        ${d.freeTimeChoice === 'custom' ? `
        <input class="field-input" type="text" value="${escHtml(d.freeTimeCustom)}" data-field="intro.freeTimeCustom" placeholder="Tell us what you actually do..." maxlength="80" style="margin-top:var(--space-3)">` : ''}
      </div>
      <div class="field-group">
        <label class="field-label">Two Truths, One Lie</label>
        <div class="field-hint">Write two things that are true about you and one sneaky lie — we'll shuffle them on the slide.</div>
        <div class="truth-lie-section">
          <div class="truth-card">
            <div class="statement-badge">&#x2713; Truth</div>
            <textarea class="field-input" data-field="intro.truth1" placeholder="Something true about you..." maxlength="120">${escHtml(d.truth1)}</textarea>
          </div>
          <div class="truth-card">
            <div class="statement-badge">&#x2713; Truth</div>
            <textarea class="field-input" data-field="intro.truth2" placeholder="Another true thing..." maxlength="120">${escHtml(d.truth2)}</textarea>
          </div>
          <div class="lie-card">
            <div class="statement-badge">&#x2717; Lie</div>
            <textarea class="field-input" data-field="intro.lie" placeholder="And the sneaky lie..." maxlength="120">${escHtml(d.lie)}</textarea>
          </div>
        </div>
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
    tags = (selected || []).map((item, i) => `
      <span class="selected-tag">
        ${item.image ? `<img src="${escHtml(item.image)}" alt="">` : ''}
        ${escHtml(item.name)}
        <span class="tag-remove" data-remove="${stateKey}" data-idx="${i}">&times;</span>
      </span>`).join('');
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
  ].filter(m => m.image);

  if (!allMedia.length) {
    shelf.style.display = 'none';
    return;
  }

  shelf.style.display = '';
  shelf.innerHTML = `
    <div class="shelf-label">Your picks</div>
    <div class="shelf-scroll">
      ${allMedia.map(m => `
        <div class="shelf-item shelf-item--${m.type}">
          <img src="${escHtml(m.image)}" alt="${escHtml(m.name)}" loading="lazy">
          <div class="shelf-item-name">${escHtml(m.name)}</div>
        </div>`).join('')}
    </div>`;
}
