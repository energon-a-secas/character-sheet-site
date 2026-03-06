import { state, save } from './state.js';
import { getRPGClass } from './data.js';
import { escHtml, $ } from './utils.js';

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

  if (!cfg.avatarId && avatars.length) {
    cfg.avatarId = avatars[0].id;
  }
  if (!cfg.highlightedMedia.length && media.length) {
    cfg.highlightedMedia = media.map(m => m.id);
  }

  let html = `<div class="section-card section-entering" style="border-top-color: var(--accent-bright); --section-glow: var(--accent-bright)">
    <div class="section-title" style="color: var(--accent-bright)">Build Your Card</div>
    <div class="section-flavor">Pick your avatar, choose your highlights, then generate.</div>

    <div class="builder-preview">
      <div class="builder-preview-name">${escHtml(state.identity.name || 'Unknown Adventurer')}</div>
      <div class="builder-preview-class">${escHtml(rpgClass)}</div>
    </div>

    <div class="field-group">
      <label class="field-label">Choose your avatar</label>
      <div class="field-hint">This image will be featured on your card</div>
      <div class="avatar-grid">
        ${avatars.length ? avatars.map(a => `
          <div class="avatar-option${cfg.avatarId === a.id ? ' selected' : ''}" data-avatar="${a.id}">
            <img src="${escHtml(a.image)}" alt="${escHtml(a.label)}" loading="lazy">
            <div class="avatar-option-label">${escHtml(a.label)}</div>
            <div class="avatar-option-type">${escHtml(a.type)}</div>
          </div>`).join('') : '<div class="builder-empty">No media selected in previous sections</div>'}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Favorite Media</label>
      <div class="field-hint">Pick which media to feature on your card</div>
      <div class="highlight-actions">
        <button class="highlight-select-all" data-select-media="all">${cfg.highlightedMedia.length === media.length ? 'Deselect All' : 'Select All'}</button>
      </div>
      <div class="highlight-grid">
        ${media.map(m => `
          <label class="highlight-item${cfg.highlightedMedia.includes(m.id) ? ' selected' : ''}">
            <input type="checkbox" data-highlight="${m.id}" ${cfg.highlightedMedia.includes(m.id) ? 'checked' : ''} hidden>
            <img src="${escHtml(m.image)}" alt="${escHtml(m.name)}" loading="lazy">
            <div class="highlight-item-name">${escHtml(m.name)}</div>
          </label>`).join('')}
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
      </div>
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
