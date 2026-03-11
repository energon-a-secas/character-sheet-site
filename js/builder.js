import { state, save } from './state.js';
import { getRPGClass } from './data.js';
import { escHtml, $ } from './utils.js';
import { CARD_THEMES, CARD_LAYOUTS } from './themes.js';
import { calculateCompletionStats, getPersonalityInsights } from './stats.js';

export function getAllAvatarOptions(s) {
  const options = [];

  if (s.anime.favoriteCharacterData) {
    options.push({
      id: 'anime-char-fav',
      label: s.anime.favoriteCharacterData.name,
      image: s.anime.favoriteCharacterData.imageLarge || s.anime.favoriteCharacterData.image,
      type: 'character',
    });
  }

  if (s.anime.waifuHusbandoData && !s.anime.waifuHusbandoSkip) {
    options.push({
      id: 'anime-char-waifu',
      label: s.anime.waifuHusbandoData.name,
      image: s.anime.waifuHusbandoData.imageLarge || s.anime.waifuHusbandoData.image,
      type: 'character',
    });
  }

  s.anime.topAnime.forEach((a, i) => {
    if (a.imageLarge || a.image) {
      options.push({ id: `anime-${i}`, label: a.name, image: a.imageLarge || a.image, type: 'anime' });
    }
  });

  s.gaming.topGames.forEach((g, i) => {
    if (g.image) {
      options.push({ id: `game-${i}`, label: g.name, image: g.image, type: 'game' });
    }
  });

  if (s.gaming.replayGame && s.gaming.replayGame.image) {
    options.push({ id: 'game-replay', label: s.gaming.replayGame.name, image: s.gaming.replayGame.image, type: 'game' });
  }

  s.movies.topMovies.forEach((m, i) => {
    if (m.image) {
      options.push({ id: `movie-${i}`, label: m.name, image: m.image, type: 'movie' });
    }
  });

  if (s.movies.comfortRewatch && s.movies.comfortRewatch.image) {
    options.push({ id: 'movie-comfort', label: s.movies.comfortRewatch.name, image: s.movies.comfortRewatch.image, type: 'movie' });
  }

  return options;
}

export function getAllHighlightableMedia(s) {
  const media = [];

  s.gaming.topGames.forEach((g, i) => {
    media.push({ id: `game-${i}`, name: g.name, image: g.image, type: 'game' });
  });
  if (s.gaming.replayGame) {
    media.push({ id: 'game-replay', name: s.gaming.replayGame.name, image: s.gaming.replayGame.image, type: 'game' });
  }
  s.anime.topAnime.forEach((a, i) => {
    media.push({ id: `anime-${i}`, name: a.name, image: a.image || a.imageLarge, type: 'anime' });
  });
  if (s.anime.comfortRewatch) {
    media.push({ id: 'anime-comfort', name: s.anime.comfortRewatch.name, image: s.anime.comfortRewatch.image, type: 'anime' });
  }
  s.movies.topMovies.forEach((m, i) => {
    media.push({ id: `movie-${i}`, name: m.name, image: m.image, type: 'movie' });
  });
  if (s.movies.comfortRewatch) {
    media.push({ id: 'movie-comfort', name: s.movies.comfortRewatch.name, image: s.movies.comfortRewatch.image, type: 'movie' });
  }

  return media.filter(m => m.image);
}

export function renderBuilder() {
  const container = $('section-container');
  const avatars = getAllAvatarOptions(state);
  const media = getAllHighlightableMedia(state);
  const cfg = state.cardConfig;
  const rpgClass = getRPGClass(state);
  const stats = calculateCompletionStats();
  const insights = getPersonalityInsights();

  if (!cfg.avatarId && avatars.length) {
    cfg.avatarId = avatars[0].id;
  }
  if (!cfg.highlightedMedia.length && media.length) {
    cfg.highlightedMedia = media.map(m => m.id);
  }

  let html = `<div class="section-card section-entering" style="border-top-color: var(--accent-bright); --section-glow: var(--accent-bright)">
    <div class="section-title" style="color: var(--accent-bright)">Build Your Card</div>
    <div class="section-flavor">Pick your avatar, choose your highlights, then roll for initiative.</div>

    <div class="builder-preview">
      <div class="builder-preview-name">${escHtml(state.identity.name || 'Unknown Adventurer')}</div>
      <div class="builder-preview-class">${escHtml(rpgClass)}</div>
    </div>

    ${renderStatsPanel(stats, insights)}

    <div class="field-group">
      <label class="field-label">Choose your avatar</label>
      <div class="field-hint">This image will be featured on your card</div>
      <div class="avatar-grid">
        ${avatars.length ? avatars.map(a => {
          const typeEmoji = a.type === 'character' ? '👤' : a.type === 'anime' ? '🎌' : a.type === 'game' ? '🎮' : '🎬';
          return `
          <div class="avatar-option${cfg.avatarId === a.id ? ' selected' : ''}" data-avatar="${a.id}">
            <img src="${escHtml(a.image)}" alt="${escHtml(a.label)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-option-fallback" style="display:none">
              <span class="avatar-option-emoji">${typeEmoji}</span>
            </div>
            <div class="avatar-option-label">${escHtml(a.label)}</div>
            <div class="avatar-option-type">${escHtml(a.type)}</div>
          </div>`;
        }).join('') : '<div class="builder-empty">No media selected in previous sections</div>'}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Favorite Media</label>
      <div class="field-hint">Pick which media to feature on your card</div>
      <div class="highlight-actions">
        <button class="highlight-select-all" data-select-media="all">${cfg.highlightedMedia.length === media.length ? 'Deselect All' : 'Select All'}</button>
      </div>
      <div class="highlight-grid">
        ${media.map(m => {
          const typeEmoji = m.type === 'game' ? '🎮' : m.type === 'anime' ? '🎌' : '🎬';
          return `
          <label class="highlight-item${cfg.highlightedMedia.includes(m.id) ? ' selected' : ''}">
            <input type="checkbox" data-highlight="${m.id}" ${cfg.highlightedMedia.includes(m.id) ? 'checked' : ''} hidden>
            <img src="${escHtml(m.image)}" alt="${escHtml(m.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="highlight-item-fallback" style="display:none">
              <span class="highlight-item-emoji">${typeEmoji}</span>
            </div>
            <div class="highlight-item-name">${escHtml(m.name)}</div>
          </label>`;
        }).join('')}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Card Theme</label>
      <div class="field-hint">Choose your visual style</div>
      <div class="theme-grid">
        ${Object.values(CARD_THEMES).map(t => `
          <button class="theme-option${cfg.theme === t.id ? ' selected' : ''}" data-theme="${t.id}" style="--theme-accent: ${t.accent}; --theme-bg: ${t.bg[0]}">
            <div class="theme-preview" style="background: linear-gradient(135deg, ${t.bg[0]}, ${t.bg[1]}); border-color: ${t.border}">
              <div class="theme-preview-text" style="color: ${t.textPrimary}">${t.name.charAt(0)}</div>
            </div>
            <div class="theme-option-name">${escHtml(t.name)}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Card Layout</label>
      <div class="field-hint">Choose your card dimensions</div>
      <div class="layout-grid">
        ${Object.values(CARD_LAYOUTS).map(l => `
          <button class="layout-option${cfg.layout === l.id ? ' selected' : ''}" data-layout="${l.id}">
            <div class="layout-preview ${l.id}">
              <div class="layout-preview-box"></div>
            </div>
            <div class="layout-option-name">${escHtml(l.name)}</div>
            <div class="layout-option-desc">${escHtml(l.description)}</div>
          </button>`).join('')}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Options</label>
      <div class="builder-toggles">
        <label class="builder-toggle">
          <input type="checkbox" data-builder-opt="showSocials" ${cfg.showSocials ? 'checked' : ''}>
          <span>Show social handles</span>
        </label>
        <label class="builder-toggle">
          <input type="checkbox" data-builder-opt="showCollection" ${cfg.showCollection ? 'checked' : ''}>
          <span>Show favorite media</span>
        </label>
        <label class="builder-toggle">
          <input type="checkbox" data-builder-opt="highQuality" ${cfg.highQuality ? 'checked' : ''}>
          <span>High quality export (larger file size)</span>
        </label>
      </div>
    </div>

    <div class="builder-present-row">
      <button class="btn btn-present" onclick="generatePresentation()">&#9654; Generate Intro Slide</button>
      <div class="builder-present-hint">Downloads a standalone HTML presentation with your story &amp; the Two Truths One Lie game</div>
    </div>
  </div>`;

  container.innerHTML = html;
}

export function getSelectedAvatar() {
  const avatars = getAllAvatarOptions(state);
  return avatars.find(a => a.id === state.cardConfig.avatarId) || avatars[0] || null;
}

export function getHighlightedMedia() {
  const all = getAllHighlightableMedia(state);
  return all.filter(m => state.cardConfig.highlightedMedia.includes(m.id));
}

function renderStatsPanel(stats, insights) {
  const name = state.identity.name || 'friend';
  const intro = `Hi! I'm ${name}. This card is how I like to be presented and introduced. Feel free to use it as icebreaker material, meeting prep, or just to get to know me better. Hope it helps us connect!`;
  
  return `
    <div class="stats-panel">
      <div class="stats-header">
        <div class="stats-completion">
          <div class="stats-completion-circle">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <path class="circle" stroke-dasharray="${stats.overall}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
              <text x="18" y="20.35" class="percentage">${stats.overall}%</text>
            </svg>
          </div>
          <div class="stats-completion-text">
            <div class="stats-completion-label">Profile Complete</div>
            <div class="stats-completion-detail">${stats.filledFields} of ${stats.totalFields} fields</div>
          </div>
        </div>
      </div>

      <div class="stats-intro">
        <p>${escHtml(intro)}</p>
      </div>

      ${stats.achievements.length > 0 ? `
        <div class="stats-achievements">
          <div class="stats-subtitle">Achievements Unlocked</div>
          <div class="achievement-list">
            ${stats.achievements.map(a => `
              <div class="achievement-badge" title="${escHtml(a.description)}">
                <span class="achievement-icon">${a.icon}</span>
                <span class="achievement-name">${escHtml(a.name)}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

      ${insights.length > 0 ? `
        <div class="stats-insights">
          <div class="stats-subtitle">Personality Insights</div>
          <div class="insight-list">
            ${insights.slice(0, 4).map(i => `
              <div class="insight-item">
                <span class="insight-emoji">${i.emoji}</span>
                <span class="insight-text">${escHtml(i.text)}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}
    </div>`;
}
