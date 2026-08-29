import { state, save, resetState, convex, api, deepMerge } from './state.js';
import { getComment, showComment, clearComment } from './comments.js';
import { SECTIONS } from './data.js';
import { render, renderSection, renderProgressBar, renderNav, renderMediaShelf, renderSectionDots, memePreviewHtml } from './render.js';
import { renderBuilder } from './builder.js';
import { getMediaOptions } from './card/media.js';
import { searchGames, searchAnime, searchAnimeCharacters, searchMovies, searchCities } from './api.js';
import {
  openCardPanel, drawCard, handleCardControl,
  exportPng, exportCopy, exportShare, exportPdf, copyShareLink, openShareLink,
} from './card/panel.js';
import { downloadPresentation, generatePresentationHTML, generateScript } from './present.js';
import { debounce, $, showToast, scrollTop } from './utils.js';

const debouncedSearch = debounce(handleSearch, 350);

// Track intro slide blob URL so it can be revoked on next open
let _introBlobUrl = null;

function tryComment(field) {
  const text = getComment(field, state);
  if (text) showComment(text);
}

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
    // A field that drives a preview updates only that node. Calling renderSection
    // here would rebuild the input mid-keystroke and take the caret with it.
    if (el.dataset.preview) {
      const target = $(el.dataset.preview);
      if (target) target.innerHTML = memePreviewHtml(el.value);
    }
    tryComment(el.dataset.field);
    return;
  }

  if (el.dataset.wildcard) {
    state.wildcards[el.dataset.wildcard].value = el.value;
    save(state);
    tryComment('wildcards.' + el.dataset.wildcard);
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
    tryComment('gaming.consoles');
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
    tryComment(btn.dataset.toggle);
    return;
  }

  if (el.dataset.choice || el.closest('[data-choice]')) {
    const btn = el.closest('[data-choice]') || el;
    const key = btn.dataset.choice;
    const current = getNestedValue(state, key);
    setNestedValue(state, key, current === btn.dataset.val ? '' : btn.dataset.val);
    save(state);
    renderSection(false);
    tryComment(key);
    return;
  }

  if (el.dataset.hobby) {
    const hobby = el.dataset.hobby;
    const idx = state.hobbies.selected.indexOf(hobby);
    if (idx >= 0) state.hobbies.selected.splice(idx, 1);
    else state.hobbies.selected.push(hobby);
    save(state);
    renderSection(false);
    tryComment('hobbies.selected');
    return;
  }

  if (el.dataset.animeGenre) {
    const g = el.dataset.animeGenre;
    const idx = state.anime.genres.indexOf(g);
    if (idx >= 0) state.anime.genres.splice(idx, 1);
    else state.anime.genres.push(g);
    save(state);
    renderSection(false);
    return;
  }

  if (el.dataset.movieGenre) {
    const g = el.dataset.movieGenre;
    const idx = state.movies.genres.indexOf(g);
    if (idx >= 0) state.movies.genres.splice(idx, 1);
    else state.movies.genres.push(g);
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
    const all = getMediaOptions(state);
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

  // Theme / size / scale chips in the card modal. Namespaced `data-card-*`: a bare
  // `data-theme` selector matched <html data-theme="…">, which the header's visitor
  // theme sets, so any unhandled click reassigned the card theme.
  if (handleCardControl(el)) return;

  if (el.closest('[data-card-action]')) {
    onCardAction(el.closest('[data-card-action]').dataset.cardAction);
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
    scrollTop();
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
  // Plain arrow keys navigate sections (also still works with Alt for backwards compat)
  if ((e.key === 'ArrowRight') && !isInputFocused()) {
    e.preventDefault();
    window.nextSection();
  }
  if ((e.key === 'ArrowLeft') && !isInputFocused()) {
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
  else if (type === 'city') results = await searchCities(query);

  if (!results.length) {
    resultsEl.innerHTML = '<div class="search-loading">No results found</div>';
    return;
  }

  resultsEl.innerHTML = results.map(r => {
    let meta = '';
    if (type === 'city') {
      meta = `${r.country || ''}${r.region ? ` \u00B7 ${r.region}` : ''}${r.timezone ? ` \u00B7 ${r.timezone}` : ''}`;
    } else {
      meta = `${r.year || ''}${r.type ? ` \u00B7 ${r.type}` : ''}${r.platforms ? ` \u00B7 ${r.platforms}` : ''}${r.episodes ? ` \u00B7 ${r.episodes}` : ''}${r.nicknames ? ` \u00B7 ${r.nicknames}` : ''}`;
    }
    return `
      <div class="search-result-item" data-result='${JSON.stringify(r).replace(/'/g, '&#39;')}'>
        ${type === 'city' ? '<div class="search-result-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>' : r.image ? `<img class="search-result-img" src="${r.image}" alt="" loading="lazy">` : '<div class="search-result-img"></div>'}
        <div class="search-result-info">
          <div class="search-result-title">${r.name}</div>
          <div class="search-result-meta">${meta}</div>
        </div>
      </div>`;
  }).join('');
}

function handleResultSelect(itemEl) {
  const wrapper = itemEl.closest('.search-wrapper');
  const stateKey = wrapper.dataset.stateKey;
  const type = wrapper.dataset.searchType;
  const max = parseInt(wrapper.dataset.max, 10);
  const result = JSON.parse(itemEl.dataset.result);
  const resultsEl = wrapper.querySelector('.search-results');
  const input = wrapper.querySelector('.search-input');

  // Special handling for city selection
  if (type === 'city') {
    state.identity.city = result.name;
    state.identity.country = result.country;
    state.identity.timezone = result.timezone;
    input.value = result.name;
    resultsEl.classList.remove('open');
    save(state);
    renderSection(false);
    return;
  }

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
  tryComment(stateKey);
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

// ── Auth helpers ────────────────────────────────────────────────────────────

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  const title = document.getElementById('authModalTitle');
  if (title) title.textContent = state._user ? 'Account' : 'Sign in';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-modal-open');
  if (state._user) void refreshLegacyLinkSection();
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-modal-open');
}

function updateAuthUI() {
  const toggle = document.getElementById('authToggle');
  const userInfo = document.getElementById('authUserInfo');
  const authGate = document.getElementById('authGate');
  const title = document.getElementById('authModalTitle');
  if (!toggle) return;

  if (title) {
    title.textContent = state._user ? 'Account' : 'Sign in';
  }

  if (state._user) {
    toggle.classList.add('logged-in');
    toggle.setAttribute('aria-label', `Account: ${state._user.label}`);
    if (authGate) authGate.hidden = true;
    userInfo.hidden = false;
    const du = document.getElementById('authDisplayUser');
    if (du) du.textContent = state._user.label;
    document.getElementById('sheetsBar').hidden = false;
  } else {
    toggle.classList.remove('logged-in');
    toggle.setAttribute('aria-label', 'Account');
    if (authGate) authGate.hidden = false;
    userInfo.hidden = true;
    document.getElementById('sheetsBar').hidden = true;
  }
}

async function loadUserSheets() {
  if (!state._user) return;
  try {
    const sheets = await convex.query(api.sheets.list, {});
    const select = document.getElementById('sheetSelect');
    if (!select) return;
    select.innerHTML = '<option value="">select a sheet,</option>';
    sheets.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s._id;
      opt.textContent = s.name;
      if (s._id === state._sheetId) opt.selected = true;
      select.appendChild(opt);
    });
  } catch { /* Convex not configured yet */ }
}

async function refreshLegacyLinkSection() {
  const section = document.getElementById('legacyLinkSection');
  const msg = document.getElementById('legacyLinkMessage');
  if (!section) return;
  if (!state._user) {
    section.hidden = true;
    return;
  }
  try {
    const link = await convex.query(api.migration.myAccountLink, {});
    section.hidden = !!link;
    if (msg) {
      msg.hidden = true;
      msg.textContent = '';
      msg.classList.remove('legacy-link-message--err');
    }
  } catch {
    section.hidden = true;
  }
}

async function onLegacyLinkClick() {
  const userEl = document.getElementById('legacyLinkUser');
  const passEl = document.getElementById('legacyLinkPassword');
  const msg = document.getElementById('legacyLinkMessage');
  const section = document.getElementById('legacyLinkSection');
  const username = userEl?.value?.trim() || '';
  const password = passEl?.value || '';
  if (!username || !password) {
    if (msg) {
      msg.textContent = 'Enter legacy username and password.';
      msg.classList.add('legacy-link-message--err');
      msg.hidden = false;
    }
    return;
  }
  try {
    const res = await convex.mutation(api.migration.linkLegacyAccount, { username, password });
    if (res.ok) {
      if (msg) {
        msg.textContent = `Linked legacy user @${res.legacyUsername}.`;
        msg.classList.remove('legacy-link-message--err');
        msg.hidden = false;
      }
      if (userEl) userEl.value = '';
      if (passEl) passEl.value = '';
      if (section) section.hidden = true;
      showToast('Legacy account linked');
    } else if (msg) {
      msg.textContent = res.error || 'Link failed';
      msg.classList.add('legacy-link-message--err');
      msg.hidden = false;
    }
  } catch {
    if (msg) {
      msg.textContent = 'Link failed. Try again.';
      msg.classList.add('legacy-link-message--err');
      msg.hidden = false;
    }
  }
}

/** Clerk + Convex JWT via vendored neorgon-auth-client. */
export async function initCharacterSheetAuth() {
  const pk = document.querySelector('meta[name="clerk-publishable-key"]')?.content?.trim();
  if (!pk) {
    console.warn('Character Sheet: add <meta name="clerk-publishable-key" content="pk_…"> for cloud saves.');
    updateAuthUI();
    return null;
  }
  try {
    const { initNeorgonClerkConvex, neorgonDisplayLabel } = await import('./vendor/neorgon-auth.js');
    const clerk = await initNeorgonClerkConvex({
      convex,
      publishableKey: pk,
      signInHost: '#neorgon-signin-mount',
      userButtonHost: '#neorgon-user-mount',
      signInProps: {
        appearance: {
          layout: {
            // Hides the "Development mode" footer on test keys (pk_test_). Production: use pk_live_.
            unsafe_disableDevelopmentModeWarnings: true,
          },
          variables: {
            colorPrimary: '#0063e5',
            colorTextOnPrimaryBackground: '#ffffff',
            borderRadius: '10px',
          },
        },
        localization: {
          formFieldInputPlaceholder__emailAddress_username: 'Email address or username',
          formFieldLabel__emailAddress_username: 'Email or username',
        },
      },
      onSession: ({ clerk, hasSession }) => {
        if (hasSession) {
          state._user = { label: neorgonDisplayLabel(clerk) };
          closeAuthModal();
        } else {
          state._user = null;
          state._sheetId = null;
          state._sheetName = null;
        }
        updateAuthUI();
        if (hasSession) void loadUserSheets();
        void refreshLegacyLinkSection();
      },
    });
    return clerk;
  } catch (e) {
    console.warn('Character Sheet: Clerk init failed', e);
    updateAuthUI();
    return null;
  }
}

function getSheetData(s) {
  // Return only the form data (not auth/session fields)
  const { _user, _sheetId, _sheetName, ...rest } = s;
  return rest;
}

function deepMergeIntoState(data) {
  // Merge loaded sheet data into state without overwriting auth/session fields
  const { _user, _sheetId, _sheetName, ...safeData } = data;
  deepMerge(state, safeData);
}

// ── Auth event listeners ──────────────────────────────────────────────────────

document.getElementById('authToggle').addEventListener('click', () => {
  const modal = document.getElementById('authModal');
  if (modal?.classList.contains('open')) closeAuthModal();
  else openAuthModal();
});

document.getElementById('authModalClose')?.addEventListener('click', closeAuthModal);
document.getElementById('authModalBackdrop')?.addEventListener('click', closeAuthModal);

document.getElementById('legacyLinkBtn')?.addEventListener('click', () => { void onLegacyLinkClick(); });

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('authModal')?.classList.contains('open')) {
    e.preventDefault();
    closeAuthModal();
  }
});

// ── Sheet window functions ───────────────────────────────────────────────────

window.loadSheet = async function(sheetId) {
  if (!sheetId || !state._user) return;
  try {
    const sheets = await convex.query(api.sheets.list, {});
    const sheet = sheets.find(s => s._id === sheetId);
    if (!sheet) return;
    const data = JSON.parse(sheet.data);
    state._sheetId = sheetId;
    state._sheetName = sheet.name;
    deepMergeIntoState(data);
    state.currentSection = 0;
    state.showBuilder = false;
    save(state);
    render();
    showToast(`Loaded: ${sheet.name}`);
  } catch { showToast('Failed to load sheet'); }
};

window.createNewSheet = async function() {
  if (!state._user) { showToast('Log in to save'); return; }
  const name = prompt('Sheet name:', 'My Character Sheet');
  if (!name) return;
  try {
    const data = JSON.stringify(getSheetData(state));
    const sheetId = await convex.mutation(api.sheets.save, {
      name,
      data,
    });
    state._sheetId = sheetId;
    state._sheetName = name;
    await loadUserSheets();
    showToast(`Created: ${name}`);
  } catch { showToast('Failed to create sheet'); }
};

window.saveCurrentSheet = async function() {
  if (!state._user) { showToast('Log in to save'); return; }
  if (!state._sheetId) { await window.createNewSheet(); return; }
  try {
    const data = JSON.stringify(getSheetData(state));
    await convex.mutation(api.sheets.save, {
      sheetId: state._sheetId,
      name: state._sheetName,
      data,
    });
    showToast('Saved!');
  } catch { showToast('Failed to save sheet'); }
};

window.deleteCurrentSheet = async function() {
  if (!state._user || !state._sheetId) return;
  if (!confirm(`Delete "${state._sheetName}"?`)) return;
  try {
    await convex.mutation(api.sheets.remove, { sheetId: state._sheetId });
    state._sheetId = null;
    state._sheetName = null;
    await loadUserSheets();
    showToast('Sheet deleted');
  } catch { showToast('Failed to delete sheet'); }
};

// ── Navigation / card functions ─────────────────────────────────────────────

window.startOver = function() {
  const hasData = state.identity.name || state.gaming.topGames.length || state.anime.topAnime.length || state.movies.topMovies.length || state.hobbies.selected.length;
  if (!hasData || confirm('Start over? Your answers will be cleared: you can always roll the dice again.')) {
    resetState(state);
    render();
    scrollTop();
    showToast('Fresh start!');
  }
};

function spawnConfetti() {
  // 60 elements animating across the viewport is exactly what this query is for.
  // CSS alone cannot suppress it: the animation is the element's reason to exist.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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

function playRevealSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.25, ctx.currentTime);
    master.connect(ctx.destination);

    const notes = [
      { freq: 523.25, delay: 0,    dur: 0.18, type: 'square',   vol: 0.6 },
      { freq: 659.25, delay: 0,    dur: 0.18, type: 'square',   vol: 0.5 },
      { freq: 783.99, delay: 0.06, dur: 0.22, type: 'square',   vol: 0.55 },
      { freq: 1046.5, delay: 0.12, dur: 0.35, type: 'square',   vol: 0.4 },
      { freq: 1318.5, delay: 0.12, dur: 0.35, type: 'triangle', vol: 0.25 },
      { freq: 2093,   delay: 0.14, dur: 0.3,  type: 'sine',     vol: 0.12 },
    ];

    notes.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, ctx.currentTime + n.delay);
      gain.gain.setValueAtTime(0, ctx.currentTime + n.delay);
      gain.gain.linearRampToValueAtTime(n.vol, ctx.currentTime + n.delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.delay + n.dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start(ctx.currentTime + n.delay);
      osc.stop(ctx.currentTime + n.delay + n.dur + 0.05);
    });

    setTimeout(() => ctx.close(), 1500);
  } catch { /* no audio support */ }
}

window.skipIntro = function() {
  // Jump from Your Story (index 1) directly to Gaming (index 2)
  state.currentSection = 2;
  save(state);
  render();
};

function populateIntroIframe() {
  const frame = document.getElementById('intro-preview-frame');
  if (!frame) return;
  // Revoke previous blob URL to avoid memory leak
  if (_introBlobUrl) {
    URL.revokeObjectURL(_introBlobUrl);
    _introBlobUrl = null;
  }
  const html = generatePresentationHTML(state);
  const blob = new Blob([html], { type: 'text/html' });
  _introBlobUrl = URL.createObjectURL(blob);
  frame.src = _introBlobUrl;
}

window.nextSection = async function() {
  if (state.showBuilder) {
    populateIntroIframe();
    await openCardPanel();
    spawnConfetti();
    playRevealSound();
    return;
  }

  clearComment();
  if (state.currentSection < SECTIONS.length - 1) {
    state.currentSection++;
    save(state);
    render();
    scrollTop();
  } else {
    state.showBuilder = true;
    save(state);
    $('section-label').textContent = 'Build Card';
    $('xp-text').textContent = 'Final';
    $('xp-fill').style.width = '100%';
    document.documentElement.style.setProperty('--section-glow', 'var(--accent-bright)');
    $('btn-next').textContent = 'Generate my card';
    $('btn-prev').style.visibility = 'visible';
    renderBuilder();
    scrollTop();
  }
};

window.prevSection = function() {
  clearComment();
  if (state.showBuilder) {
    state.showBuilder = false;
    save(state);
    render();
    scrollTop();
    return;
  }

  if (state.currentSection > 0) {
    state.currentSection--;
    save(state);
    render();
    scrollTop();
  }
};

window.closeCardModal = function() {
  $('card-modal').classList.remove('open');
};

function onCardAction(action) {
  switch (action) {
    case 'png': exportPng(); break;
    case 'copy': exportCopy(); break;
    case 'share': exportShare(); break;
    case 'pdf': exportPdf(); break;
    case 'script': window.copyScript(); break;
    case 'copy-link': copyShareLink(); break;
    case 'open-link': openShareLink(); break;
  }
}

window.generatePresentation = function() {
  downloadPresentation(state);
};

window.copyScript = async function() {
  const md = generateScript(state);
  try {
    await navigator.clipboard.writeText(md);
    showToast('Presenter script copied to clipboard!');
  } catch {
    // Fallback for browsers that block clipboard
    const ta = document.createElement('textarea');
    ta.value = md;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Presenter script copied!');
  }
};
