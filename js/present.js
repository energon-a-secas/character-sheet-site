import { FREE_TIME_OPTIONS, getRPGClass } from './data.js';
import { getTwoTruths } from './card/model.js';
import { showToast } from './utils.js';

export function generateScript(s) {
  const name = s.identity.name || 'Unknown';
  const city = s.intro?.city || '';
  const country = s.identity.country || '';
  const location = [city, country].filter(Boolean).join(', ');
  const jobTitle = s.intro?.jobTitle || '';
  const yearsExp = s.intro?.yearsExperience || '';
  const prevCompany = s.intro?.prevCompany || '';
  const careerHighlight = s.intro?.careerHighlight || '';
  const motto = s.intro?.motto || '';
  const unknownFact = s.intro?.unknownFact || '';
  const currentlyLearning = s.intro?.currentlyLearning || '';
  const rpgClass = getRPGClass(s);

  const freeTimeId = s.intro?.freeTimeChoice || '';
  const freeTimeCustom = s.intro?.freeTimeCustom || '';
  const freeTimeOption = FREE_TIME_OPTIONS.find(o => o.id === freeTimeId);
  const freeTimeLabel = freeTimeId === 'custom' ? freeTimeCustom : (freeTimeOption?.label || '');

  const hobbies = [...s.hobbies.selected.slice(0, 6)];
  if (s.hobbies.custom) hobbies.push(s.hobbies.custom);

  const topGames = s.gaming.topGames.slice(0, 3);
  const topAnime = s.anime.topAnime.slice(0, 3);
  const topMovies = s.movies.topMovies.slice(0, 3);

  const hotTakes = Object.values(s.wildcards || {})
    .filter(w => w.value && !w.skip)
    .slice(0, 3)
    .map(w => w.value);

  const truth1 = s.intro?.truth1 || '';
  const truth2 = s.intro?.truth2 || '';
  const lie = s.intro?.lie || '';
  const hasGame = truth1 && truth2 && lie;

  const lines = [];

  lines.push(`# ${name} — Presenter Script`);
  lines.push('');
  lines.push('> Copy this script to your notes app. Read naturally — don\'t read it word for word.');
  lines.push('');
  lines.push('---');
  lines.push('');

  // --- Intro ---
  lines.push('## 👋 Introduction');
  lines.push('');
  const jobPart = [jobTitle, yearsExp ? `${yearsExp} years of experience` : ''].filter(Boolean).join(', ');
  const introParts = [`This is **${name}**`];
  if (jobPart) introParts.push(jobPart);
  if (location) introParts.push(`based in ${location}`);
  if (prevCompany) introParts.push(`previously at ${prevCompany}`);
  lines.push(introParts.join(' — ') + '.');
  lines.push('');
  lines.push(`*RPG class: **${rpgClass}***`);
  lines.push('');

  // --- Career ---
  if (careerHighlight || motto) {
    lines.push('## 💼 Career');
    lines.push('');
    if (careerHighlight) {
      lines.push(`**Career highlight:** "${careerHighlight}"`);
      lines.push('');
    }
    if (motto) {
      lines.push(`**Work motto:** "${motto}"`);
      lines.push('');
    }
  }

  // --- Personal ---
  if (unknownFact || currentlyLearning) {
    lines.push('## 🔍 Personal Side');
    lines.push('');
    if (unknownFact) {
      lines.push(`**Something most people don't know:** "${unknownFact}"`);
      lines.push('');
    }
    if (currentlyLearning) {
      lines.push(`**Currently learning:** ${currentlyLearning}`);
      lines.push('');
    }
  }

  // --- Free time & hobbies ---
  if (freeTimeLabel || hobbies.length) {
    lines.push('## 🎮 Free Time');
    lines.push('');
    if (freeTimeLabel) {
      lines.push(`Outside of work, ${name} is all about **${freeTimeLabel}**.`);
      lines.push('');
    }
    if (hobbies.length) {
      lines.push(`Also into: ${hobbies.map(h => `**${h}**`).join(', ')}.`);
      lines.push('');
    }
  }

  // --- Top picks ---
  const hasPicks = topGames.length || topAnime.length || topMovies.length;
  if (hasPicks) {
    lines.push('## 🏆 Top Picks');
    lines.push('');
    if (topGames.length) {
      lines.push(`**Games:** ${topGames.map(g => g.name).join(', ')}`);
    }
    if (topAnime.length) {
      lines.push(`**Anime:** ${topAnime.map(a => a.name).join(', ')}`);
    }
    if (topMovies.length) {
      lines.push(`**Movies/Series:** ${topMovies.map(m => m.name).join(', ')}`);
    }
    lines.push('');
  }

  // --- Hot takes ---
  if (hotTakes.length) {
    lines.push('## 🔥 Hot Takes');
    lines.push('');
    lines.push('*Read these out loud and watch the room react:*');
    lines.push('');
    hotTakes.forEach(t => lines.push(`- "${t}"`));
    lines.push('');
  }

  // --- Two truths one lie ---
  if (hasGame) {
    lines.push('## 🎲 Two Truths, One Lie');
    lines.push('');
    lines.push('*Ask the group to guess which one is false:*');
    lines.push('');
    // Same seeded order as the card and the deck, so a presenter reading this
    // script can point at the card. Math.random() here gave a different order on
    // every copy, and the answer was tagged inline next to the statement — where
    // anyone glancing at the presenter's screen could read it.
    const stmts = getTwoTruths(s);
    stmts.forEach((st, i) => {
      lines.push(`**${String.fromCharCode(65 + i)}.** ${st.text}`);
    });
    lines.push('');
    const answer = stmts.findIndex(st => st.isLie);
    if (answer >= 0) {
      lines.push(`<details><summary>Answer (click to reveal)</summary>\n\n**${String.fromCharCode(65 + answer)}** is the lie.\n\n</details>`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(`*Generated by [Character Sheet](https://charactersheet.neorgon.com/)*`);

  return lines.join('\n');
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function generatePresentationHTML(s) {
  return buildHTML(s);
}

export function downloadPresentation(s) {
  const html = buildHTML(s);
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (s.identity.name || 'character').toLowerCase().replace(/\s+/g, '-');
  a.download = `${name}-intro.html`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast('Presentation ready — open the downloaded file!');
}

function buildHTML(s) {
  const name = s.identity.name || 'Unknown';
  const city = s.intro?.city || '';
  const country = s.identity.country || '';
  const location = [city, country].filter(Boolean).join(', ');
  const jobTitle = s.intro?.jobTitle || '';
  const yearsExp = s.intro?.yearsExperience || '';
  const prevCompany = s.intro?.prevCompany || '';
  const rpgClass = getRPGClass(s);

  const freeTimeId = s.intro?.freeTimeChoice || '';
  const freeTimeCustom = s.intro?.freeTimeCustom || '';
  const freeTimeOption = FREE_TIME_OPTIONS.find(o => o.id === freeTimeId);
  const freeTimeLabel = freeTimeId === 'custom' ? freeTimeCustom : (freeTimeOption?.label || '');

  const hobbies = [...s.hobbies.selected.slice(0, 8)];
  if (s.hobbies.custom) hobbies.push(s.hobbies.custom);

  const truth1 = s.intro?.truth1 || '';
  const truth2 = s.intro?.truth2 || '';
  const lie = s.intro?.lie || '';
  const hasGame = truth1 && truth2 && lie;

  const topGames = s.gaming.topGames.slice(0, 3);
  const topAnime = s.anime.topAnime.slice(0, 3);
  const topMovies = s.movies.topMovies.slice(0, 3);
  const hasPicks = topGames.length || topAnime.length || topMovies.length;

  const slides = [];

  // Slide 1: Identity
  slides.push(buildSlide1(name, jobTitle, yearsExp, prevCompany, location, rpgClass));

  // Slide 2: Free time + hobbies
  if (freeTimeLabel || hobbies.length) {
    slides.push(buildSlide2(name, freeTimeLabel, hobbies));
  }

  // Slide 3: Two Truths One Lie
  if (hasGame) {
    slides.push(buildSlide3(getTwoTruths(s)));
  }

  // Slide 4: Top picks
  if (hasPicks) {
    slides.push(buildSlide4(topGames, topAnime, topMovies));
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hi, I'm ${esc(name)}</title>
<style>
${getCSS()}
</style>
</head>
<body>
<div class="deck" id="deck">
${slides.map((content, i) => `<div class="slide${i === 0 ? ' active' : ''}" id="slide-${i}">${content}</div>`).join('\n')}
</div>
<div class="controls">
  <button class="ctrl-btn" id="prev-btn" onclick="go(-1)" disabled>&#8592;</button>
  <div class="slide-dots" id="slide-dots">
    ${slides.map((_, i) => `<div class="dot${i === 0 ? ' active' : ''}" onclick="goTo(${i})"></div>`).join('')}
  </div>
  <button class="ctrl-btn" id="next-btn" onclick="go(1)">&#8594;</button>
</div>
<div class="slide-counter" id="counter">1 / ${slides.length}</div>
<script>
${getJS(slides.length)}
</script>
</body>
</html>`;
}

function buildSlide1(name, jobTitle, yearsExp, prevCompany, location, rpgClass) {
  // yearsExperience is free text ("9 years", "since forever") — appending "yrs"
  // produced "9 years yrs". And the separator is joined *after* escaping, since
  // esc() would otherwise turn the entity into visible "&middot;".
  const jobParts = [jobTitle, yearsExp].filter(Boolean).map(esc);
  return `<div class="slide-inner slide-identity">
  <div class="greeting">Hi, I'm</div>
  <div class="big-name">${esc(name)}</div>
  ${jobParts.length ? `<div class="job-line">${jobParts.join(' &middot; ')}</div>` : ''}
  ${prevCompany ? `<div class="prev-line">Previously at <strong>${esc(prevCompany)}</strong></div>` : ''}
  ${location ? `<div class="location-line">&#128205; ${esc(location)}</div>` : ''}
  <div class="rpg-badge">${esc(rpgClass)}</div>
</div>`;
}

function buildSlide2(name, freeTimeLabel, hobbies) {
  return `<div class="slide-inner slide-freetime">
  <div class="slide-heading">In my free time&hellip;</div>
  ${freeTimeLabel ? `<div class="freetime-main">${esc(freeTimeLabel)}</div>` : ''}
  ${hobbies.length ? `
  <div class="also-label">Also into</div>
  <div class="hobby-pills">
    ${hobbies.map(h => `<span class="hobby-pill">${esc(h)}</span>`).join('')}
  </div>` : ''}
</div>`;
}

/**
 * `stmts` comes from getTwoTruths — the same seeded shuffle the card uses, so the
 * deck and the card list the statements in the same order. `Math.random()` here
 * previously reordered them on every regeneration, which meant the deck and the
 * card disagreed and re-downloading changed the answer's position.
 *
 * The lie is marked with `data-lie` rather than being recoverable from the
 * onclick string, which is what revealAll() used to parse.
 */
function buildSlide3(stmts) {
  return `<div class="slide-inner slide-game">
  <div class="game-title">Two Truths, One Lie</div>
  <div class="game-sub">Can you guess which one is false?</div>
  <div class="game-cards" id="game-cards">
    ${stmts.map((s, i) => `
    <div class="game-card" id="gc-${i}" data-lie="${s.isLie ? '1' : '0'}" onclick="guess(${i})">
      <div class="gc-letter">${String.fromCharCode(65 + i)}</div>
      <div class="gc-text">${esc(s.text)}</div>
      <div class="gc-reveal" id="gcr-${i}"></div>
    </div>`).join('')}
  </div>
  <div class="game-hint" id="game-hint">Tap a card to vote</div>
  <button class="reveal-btn" id="reveal-btn" onclick="revealAll()" style="display:none">Reveal the lie &#8594;</button>
</div>`;
}

function buildSlide4(games, anime, movies) {
  const sections = [];
  if (games.length) sections.push({ label: '&#127918; Games', items: games });
  if (anime.length) sections.push({ label: '&#127918; Anime', items: anime });
  if (movies.length) sections.push({ label: '&#127909; Movies & Series', items: movies });

  return `<div class="slide-inner slide-picks">
  <div class="slide-heading">My Top Picks</div>
  <div class="picks-grid">
    ${sections.map(sec => `
    <div class="picks-col">
      <div class="picks-label">${sec.label}</div>
      ${sec.items.map((item, i) => `<div class="pick-row"><span class="pick-num">${i + 1}</span>${esc(item.name)}</div>`).join('')}
    </div>`).join('')}
  </div>
</div>`;
}

function getCSS() {
  return `
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #040714;
  color: #f9f9f9;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
}

.deck {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.slide {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  opacity: 0;
  pointer-events: none;
  transform: translateX(40px);
  transition: opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1);
}

.slide.active {
  opacity: 1;
  pointer-events: all;
  transform: translateX(0);
}

.slide.exit-left {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-inner {
  max-width: 700px;
  width: 100%;
  text-align: center;
}

/* ── Slide 1: Identity ── */
.slide-identity { animation: none; }

.greeting {
  font-size: clamp(1rem, 3vw, 1.4rem);
  color: rgba(255,255,255,0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.big-name {
  font-size: clamp(3rem, 10vw, 6rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -2px;
  background: linear-gradient(135deg, #f9f9f9 30%, rgba(255,255,255,0.6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
}

.job-line {
  font-size: clamp(1rem, 2.5vw, 1.4rem);
  color: #818cf8;
  font-weight: 600;
  margin-bottom: 10px;
}

.prev-line {
  font-size: clamp(0.8rem, 1.8vw, 1rem);
  color: rgba(255,255,255,0.5);
  margin-bottom: 8px;
}

.location-line {
  font-size: clamp(0.85rem, 1.8vw, 1.05rem);
  color: rgba(255,255,255,0.55);
  margin-bottom: 24px;
}

.rpg-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 22px;
  border: 1px solid rgba(129,140,248,0.4);
  border-radius: 24px;
  background: rgba(129,140,248,0.1);
  color: #818cf8;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.rpg-badge::before { content: '⚔'; font-style: normal; }

/* ── Slide 2: Free time ── */
.slide-heading {
  font-size: clamp(1.6rem, 5vw, 3rem);
  font-weight: 800;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #22d3ee, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.freetime-main {
  font-size: clamp(1.2rem, 3.5vw, 2rem);
  font-weight: 600;
  color: #f9f9f9;
  margin-bottom: 32px;
}

.also-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.35);
  margin-bottom: 14px;
}

.hobby-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.hobby-pill {
  padding: 8px 16px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  font-size: 0.85rem;
  color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.04);
}

/* ── Slide 3: Two Truths One Lie ── */
.game-title {
  font-size: clamp(1.6rem, 5vw, 2.8rem);
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.game-sub {
  font-size: 0.9rem;
  color: rgba(255,255,255,0.45);
  margin-bottom: 32px;
  letter-spacing: 0.5px;
}

.game-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.game-card {
  position: relative;
  padding: 20px 16px 16px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  background: rgba(255,255,255,0.03);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  overflow: hidden;
}

.game-card:hover {
  border-color: rgba(167,139,250,0.5);
  background: rgba(167,139,250,0.07);
  transform: translateY(-2px);
}

.game-card.voted {
  border-color: rgba(167,139,250,0.4);
  background: rgba(167,139,250,0.1);
}

.game-card.correct { border-color: #34d399; background: rgba(52,211,153,0.1); }
.game-card.wrong   { border-color: #f43f5e; background: rgba(244,63,94,0.1); }
.game-card.is-lie  { border-color: #f43f5e; background: rgba(244,63,94,0.08); }

.gc-letter {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.3);
  margin-bottom: 10px;
}

.gc-text {
  font-size: clamp(0.8rem, 1.5vw, 0.95rem);
  line-height: 1.5;
  color: #f9f9f9;
}

.gc-reveal {
  font-size: 0.8rem;
  margin-top: 10px;
  min-height: 18px;
  font-weight: 600;
}

.game-hint {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.3);
  margin-bottom: 12px;
}

.reveal-btn {
  padding: 10px 28px;
  background: linear-gradient(135deg, #a78bfa, #818cf8);
  border: none;
  border-radius: 8px;
  color: #040714;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reveal-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(167,139,250,0.4);
}

/* ── Slide 4: Top picks ── */
.picks-grid {
  display: flex;
  gap: 40px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
  text-align: left;
}

.picks-col { min-width: 160px; }

.picks-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255,255,255,0.35);
  margin-bottom: 14px;
}

.pick-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.95rem;
  margin-bottom: 10px;
  color: #f9f9f9;
}

.pick-num {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.3);
  font-weight: 600;
  min-width: 16px;
}

/* ── Controls ── */
.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 14px 20px;
  background: rgba(255,255,255,0.02);
  border-top: 1px solid rgba(255,255,255,0.05);
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.7);
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.18s ease;
}

.ctrl-btn:hover:not(:disabled) {
  border-color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.08);
  color: #fff;
}

.ctrl-btn:disabled { opacity: 0.25; cursor: default; }

.slide-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dot.active {
  background: rgba(255,255,255,0.8);
  transform: scale(1.4);
}

.slide-counter {
  position: absolute;
  bottom: 14px;
  right: 20px;
  font-size: 0.7rem;
  color: rgba(255,255,255,0.2);
}

@media (max-width: 600px) {
  .game-cards { grid-template-columns: 1fr; }
  .picks-grid { flex-direction: column; gap: 24px; }
  .big-name { letter-spacing: -1px; }
}
  `.trim();
}

function getJS(totalSlides) {
  return `
let current = 0;
const total = ${totalSlides};
let voted = false;
let revealed = false;

function go(dir) {
  goTo(current + dir);
}

function goTo(idx) {
  if (idx < 0 || idx >= total) return;
  const old = document.getElementById('slide-' + current);
  old.classList.add('exit-left');
  old.classList.remove('active');
  setTimeout(() => old.classList.remove('exit-left'), 450);

  current = idx;
  const next = document.getElementById('slide-' + current);
  next.classList.add('active');

  document.getElementById('prev-btn').disabled = current === 0;
  document.getElementById('next-btn').disabled = current === total - 1;
  document.getElementById('counter').textContent = (current + 1) + ' / ' + total;

  document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === current));
}

function guess(idx) {
  if (revealed) return;
  document.querySelectorAll('.game-card').forEach(c => c.classList.remove('voted'));
  const card = document.getElementById('gc-' + idx);
  card.classList.add('voted');
  voted = true;

  const hint = document.getElementById('game-hint');
  hint.textContent = card.dataset.lie === '1' ? '🎯 You guessed it — reveal to confirm!' : '🤔 Hmm... are you sure? Reveal to find out!';
  document.getElementById('reveal-btn').style.display = 'inline-flex';
}

function revealAll() {
  if (revealed) return;
  revealed = true;
  document.getElementById('reveal-btn').style.display = 'none';

  const cards = document.querySelectorAll('.game-card');
  cards.forEach((card, i) => {
    const isLie = card.dataset.lie === '1';
    const revealEl = document.getElementById('gcr-' + i);
    if (isLie) {
      card.classList.add('is-lie');
      revealEl.textContent = '✗ The lie!';
      revealEl.style.color = '#f43f5e';
    } else {
      card.classList.add('correct');
      revealEl.textContent = '✓ True';
      revealEl.style.color = '#34d399';
    }
  });

  const votedCard = document.querySelector('.game-card.voted');
  if (votedCard) {
    const wasLie = votedCard.dataset.lie === '1';
    document.getElementById('game-hint').textContent = wasLie ? '🎉 You got it! The lie has been revealed.' : '😈 Fooled! Now you know the truth.';
  } else {
    document.getElementById('game-hint').textContent = 'The lie has been revealed!';
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') go(1);
  if (e.key === 'ArrowLeft') go(-1);
});
  `.trim();
}
