import { state, save } from './state.js';
import { getRPGClass } from './data.js';
import { escHtml, $ } from './utils.js';
import { calculateCompletionStats, getPersonalityInsights } from './stats.js';
import { IconPerson, IconAnime, IconGame, IconMovie } from './icons.js';
import { getAvatarOptions, getMediaOptions } from './card/media.js';

export function renderBuilder() {
  const container = $('section-container');
  const avatars = getAvatarOptions(state);
  const media = getMediaOptions(state);
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
          const typeIcon = a.type === 'character' ? IconPerson : a.type === 'anime' ? IconAnime : a.type === 'game' ? IconGame : IconMovie;
          return `
          <div class="avatar-option${cfg.avatarId === a.id ? ' selected' : ''}" data-avatar="${a.id}">
            <img src="${escHtml(a.image)}" alt="${escHtml(a.label)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-option-fallback" style="display:none">
              <span class="avatar-option-icon">${typeIcon}</span>
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
          const typeIcon = m.type === 'game' ? IconGame : m.type === 'anime' ? IconAnime : IconMovie;
          return `
          <label class="highlight-item${cfg.highlightedMedia.includes(m.id) ? ' selected' : ''}">
            <input type="checkbox" data-highlight="${m.id}" ${cfg.highlightedMedia.includes(m.id) ? 'checked' : ''} hidden>
            <img src="${escHtml(m.image)}" alt="${escHtml(m.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="highlight-item-fallback" style="display:none">
              <span class="highlight-item-icon">${typeIcon}</span>
            </div>
            <div class="highlight-item-name">${escHtml(m.name)}</div>
          </label>`;
        }).join('')}
      </div>
    </div>

    <div class="field-group">
      <label class="field-label">Options</label>
      <div class="field-hint">Theme, size and export scale are chosen on the next screen, with the card in front of you.</div>
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

    <div class="builder-present-row">
      <button class="btn btn-present" onclick="generatePresentation()">&#9654; Generate Intro Slide</button>
      <div class="builder-present-hint">Downloads a standalone HTML presentation with your story &amp; the Two Truths One Lie game</div>
    </div>
  </div>`;

  container.innerHTML = html;
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
