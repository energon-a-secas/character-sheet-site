import { state, save, resetState } from './state.js';
import { SECTIONS } from './data.js';
import { render, renderSection, renderProgressBar, renderNav, renderMediaShelf, renderSectionDots } from './render.js';
import { renderBuilder, getAllHighlightableMedia } from './builder.js';
import { searchGames, searchAnime, searchAnimeCharacters, searchMovies } from './api.js';
import { generateCard, exportPDF } from './card.js';
import { debounce, $, showToast } from './utils.js';

const debouncedSearch = debounce(handleSearch, 350);

export function bindEvents() {
  document.addEventListener('input', onInput);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeydown);
}

function onInput(e) {
  const el = e.target;

  if (el.dataset.field) {
    setNestedValue(state, el.dataset.field, el.value);
    save(state);
    return;
  }

  if (el.dataset.wildcard) {
    state.wildcards[el.dataset.wildcard].value = el.value;
    save(state);
    return;
  }

  if (el.dataset.platformHandle) {
    const platform = el.dataset.platformHandle;
    const entry = state.identity.handles.find(h => h.platform === platform);
    if (entry) entry.handle = el.value;
    save(state);
    return;
  }

  if (el.classList.contains('search-input')) {
    const wrapper = el.closest('.search-wrapper');
    debouncedSearch(wrapper, el.value.trim());
  }
}

function onClick(e) {
  const el = e.target;

  if (el.dataset.console || el.closest('[data-console]')) {
    const opt = el.closest('[data-console]');
    const id = opt.dataset.console;
    const idx = state.gaming.consoles.indexOf(id);
    if (idx >= 0) state.gaming.consoles.splice(idx, 1);
    else state.gaming.consoles.push(id);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.platform) {
    const pid = el.dataset.platform;
    const idx = state.identity.handles.findIndex(h => h.platform === pid);
    if (idx >= 0) {
      state.identity.handles.splice(idx, 1);
    } else {
      state.identity.handles.push({ platform: pid, handle: '' });
    }
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.toggle || el.closest('[data-toggle]')) {
    const btn = el.closest('[data-toggle]') || el;
    const val = btn.dataset.val === 'true';
    setNestedValue(state, btn.dataset.toggle, val);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.choice || el.closest('[data-choice]')) {
    const btn = el.closest('[data-choice]') || el;
    const key = btn.dataset.choice;
    const current = getNestedValue(state, key);
    setNestedValue(state, key, current === btn.dataset.val ? '' : btn.dataset.val);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.hobby) {
    const hobby = el.dataset.hobby;
    const idx = state.hobbies.selected.indexOf(hobby);
    if (idx >= 0) state.hobbies.selected.splice(idx, 1);
    else state.hobbies.selected.push(hobby);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.escape) {
    const field = el.dataset.escape;
    const current = getNestedValue(state, field);
    setNestedValue(state, field, current === el.dataset.val ? '' : el.dataset.val);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.escapeWc) {
    const key = el.dataset.escapeWc;
    const wc = state.wildcards[key];
    if (wc.skip === el.dataset.val) {
      wc.skip = '';
    } else {
      wc.skip = el.dataset.val;
      wc.value = '';
    }
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.remove || el.closest('[data-remove]')) {
    const tag = el.closest('[data-remove]') || el;
    const key = tag.dataset.remove;
    const idx = parseInt(tag.dataset.idx, 10);
    const arr = getNestedValue(state, key);
    if (Array.isArray(arr)) {
      arr.splice(idx, 1);
    } else {
      setNestedValue(state, key, null);
    }
    save(state);
    renderSection(false);
    renderMediaShelf();
    return;
  }

  if (el.classList.contains('search-result-item') || el.closest('.search-result-item')) {
    const item = el.closest('.search-result-item');
    handleResultSelect(item);
    return;
  }

  if (el.dataset.avatar || el.closest('[data-avatar]')) {
    const opt = el.closest('[data-avatar]');
    state.cardConfig.avatarId = opt.dataset.avatar;
    save(state);
    renderBuilder();
    return;
  }

  if (el.dataset.selectMedia) {
    const all = getAllHighlightableMedia(state);
    const allSelected = state.cardConfig.highlightedMedia.length === all.length;
    state.cardConfig.highlightedMedia = allSelected ? [] : all.map(m => m.id);
    save(state);
    renderBuilder();
    return;
  }

  if (el.dataset.highlight !== undefined) {
    const id = el.dataset.highlight;
    const idx = state.cardConfig.highlightedMedia.indexOf(id);
    if (idx >= 0) state.cardConfig.highlightedMedia.splice(idx, 1);
    else state.cardConfig.highlightedMedia.push(id);
    save(state);
    renderBuilder();
    return;
  }

  if (el.dataset.builderOpt) {
    state.cardConfig[el.dataset.builderOpt] = el.checked;
    save(state);
    return;
  }

  if (el.dataset.dot !== undefined || el.closest('[data-dot]')) {
    const dot = el.closest('[data-dot]') || el;
    const idx = parseInt(dot.dataset.dot, 10);
    if (state.showBuilder) {
      state.showBuilder = false;
    }
    state.currentSection = idx;
    save(state);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (!el.closest('.search-wrapper')) {
    document.querySelectorAll('.search-results.open').forEach(r => r.classList.remove('open'));
  }
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.search-results.open').forEach(r => r.classList.remove('open'));
    if ($('card-modal').classList.contains('open')) {
      window.closeCardModal();
    }
  }
  if (e.key === 'ArrowRight' && e.altKey && !isInputFocused()) {
    e.preventDefault();
    window.nextSection();
  }
  if (e.key === 'ArrowLeft' && e.altKey && !isInputFocused()) {
    e.preventDefault();
    window.prevSection();
  }
}

function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

async function handleSearch(wrapper, query) {
  const type = wrapper.dataset.searchType;
  const resultsEl = wrapper.querySelector('.search-results');

  if (!query || query.length < 2) {
    resultsEl.classList.remove('open');
    return;
  }

  resultsEl.innerHTML = '<div class="search-loading">Searching...</div>';
  resultsEl.classList.add('open');

  let results = [];
  if (type === 'game') results = await searchGames(query);
  else if (type === 'anime') results = await searchAnime(query);
  else if (type === 'character') results = await searchAnimeCharacters(query);
  else if (type === 'movie') results = await searchMovies(query);

  if (!results.length) {
    resultsEl.innerHTML = '<div class="search-loading">No results found</div>';
    return;
  }

  resultsEl.innerHTML = results.map(r => `
    <div class="search-result-item" data-result='${JSON.stringify(r).replace(/'/g, '&#39;')}'>
      ${r.image ? `<img class="search-result-img" src="${r.image}" alt="" loading="lazy">` : '<div class="search-result-img"></div>'}
      <div class="search-result-info">
        <div class="search-result-title">${r.name}</div>
        <div class="search-result-meta">${r.year || ''}${r.type ? ` \u00B7 ${r.type}` : ''}${r.platforms ? ` \u00B7 ${r.platforms}` : ''}${r.episodes ? ` \u00B7 ${r.episodes}` : ''}${r.nicknames ? ` \u00B7 ${r.nicknames}` : ''}</div>
      </div>
    </div>`).join('');
}

function handleResultSelect(itemEl) {
  const wrapper = itemEl.closest('.search-wrapper');
  const stateKey = wrapper.dataset.stateKey;
  const max = parseInt(wrapper.dataset.max, 10);
  const result = JSON.parse(itemEl.dataset.result);
  const resultsEl = wrapper.querySelector('.search-results');
  const input = wrapper.querySelector('.search-input');

  const current = getNestedValue(state, stateKey);

  if (max === 1) {
    setNestedValue(state, stateKey, result);
  } else if (Array.isArray(current)) {
    if (current.length >= max) {
      showToast(`Maximum ${max} selections`);
      resultsEl.classList.remove('open');
      return;
    }
    if (current.some(c => c.id === result.id)) {
      showToast('Already selected');
      resultsEl.classList.remove('open');
      return;
    }
    current.push(result);
  }

  input.value = '';
  resultsEl.classList.remove('open');
  save(state);
  renderSection(false);
  renderMediaShelf();
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let target = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
}

function getNestedValue(obj, path) {
  const parts = path.split('.');
  let target = obj;
  for (const p of parts) {
    target = target[p];
    if (target === undefined) return undefined;
  }
  return target;
}

window.startOver = function() {
  const hasData = state.identity.name || state.gaming.topGames.length || state.anime.topAnime.length || state.movies.topMovies.length || state.hobbies.selected.length;
  if (!hasData || confirm('Start fresh? All your answers will be cleared.')) {
    resetState(state);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Fresh start!');
  }
};

function spawnConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const colors = ['#a78bfa', '#34d399', '#f472b6', '#fbbf24', '#2dd4bf', '#818cf8', '#fb923c', '#f43f5e'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--x', `${(Math.random() - 0.5) * 100}vw`);
    piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--delay', `${Math.random() * 0.3}s`);
    piece.style.setProperty('--dur', `${1 + Math.random() * 1.2}s`);
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${20 + Math.random() * 60}%`;
    container.appendChild(piece);
  }
  setTimeout(() => container.remove(), 3000);
}

window.nextSection = async function() {
  if (state.showBuilder) {
    $('card-modal').classList.add('open');
    await generateCard(state);
    spawnConfetti();
    return;
  }

  if (state.currentSection < SECTIONS.length - 1) {
    state.currentSection++;
    save(state);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    state.showBuilder = true;
    save(state);
    $('section-label').textContent = 'Build Card';
    $('xp-text').textContent = 'Final';
    $('xp-fill').style.width = '100%';
    document.documentElement.style.setProperty('--section-glow', 'var(--accent-bright)');
    $('btn-next').textContent = 'Generate Card';
    $('btn-prev').style.visibility = 'visible';
    renderBuilder();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.prevSection = function() {
  if (state.showBuilder) {
    state.showBuilder = false;
    save(state);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (state.currentSection > 0) {
    state.currentSection--;
    save(state);
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.closeCardModal = function() {
  $('card-modal').classList.remove('open');
};

window.downloadCard = function() {
  const canvas = $('card-canvas');
  try {
    const link = document.createElement('a');
    const name = state.identity.name || 'character';
    link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Card downloaded!');
  } catch {
    showToast('Cannot export: images blocked by CORS');
  }
};

window.downloadPDF = function() {
  exportPDF(state);
};
