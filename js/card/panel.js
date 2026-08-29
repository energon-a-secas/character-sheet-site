// The card modal: a live card plus the controls that change it.
//
// Theme, layout and scale live here rather than in the builder step, because the
// only useful way to pick them is with the card in front of you. The builder still
// owns what goes *on* the card (avatar, which media); this owns how it looks and
// how it leaves.
//
// The element rendered here is the element exported — no second code path, so a
// preview that looks right cannot produce a PNG that doesn't. Preview fitting is a
// CSS transform, which layout ignores: `offsetWidth` stays at the preset's real
// pixel width, so the export is unaffected by how small the modal is.

import { state, save } from '../state.js';
import { $, escHtml, showToast } from '../utils.js';
import { CARD_THEMES, CARD_LAYOUTS, getLayout } from './presets.js';
import { buildCardModel, collectImageUrls } from './model.js';
import { renderCard } from './render.js';
import { inlineImages, downloadPng, copyPng, sharePng, printCard } from './export.js';
import { buildShareUrl } from '../share/link.js';
import { qrSvg, qrModuleCount } from '../share/qr.js';

// A QR bigger than this has modules too fine to scan off a screen or a slide at a
// sane size. The realistic dense sheet encodes to ~1600 chars, which lands well
// past it — so the honest default for a full sheet is the link, not a QR.
const QR_MODULE_LIMIT = 105;

const SCALES = [1, 2, 3];

// Inlined images are keyed by URL and cost a fetch each, so they survive
// re-renders; only reset when the modal is opened again.
let images = new Map();

/** Open the modal and render the card. */
export async function openCardPanel() {
  $('card-modal').classList.add('open');
  renderControls();

  const model = buildCardModel(state);
  const urls = collectImageUrls(model);
  if (urls.length) {
    setStatus('Loading artwork…');
    images = await inlineImages(urls);
  } else {
    images = new Map();
  }
  setStatus('');
  drawCard();
  refreshShare();
}

function setStatus(text) {
  const el = $('card-status');
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
}

/** Re-render the card from current state, then fit the preview to the stage. */
export function drawCard() {
  const card = $('export-card');
  if (!card) return;

  const { dropped } = renderCard(card, buildCardModel(state), state.cardConfig, images);
  fitPreview();

  const note = $('card-drop-note');
  if (note) {
    note.hidden = !dropped.length;
    note.textContent = dropped.length
      ? `This size could not fit ${dropped.length} section${dropped.length > 1 ? 's' : ''}: ${dropped.join(', ')}. Portrait fits everything.`
      : '';
  }
}

/**
 * Scale the card down to the stage width for display only.
 *
 * Transforms do not affect layout, so the stage would still reserve the card's
 * full untransformed height — hence setting the stage height explicitly.
 */
function fitPreview() {
  const stage = $('card-stage');
  const card = $('export-card');
  if (!stage || !card) return;

  const available = stage.clientWidth;
  const scale = Math.min(1, available / card.offsetWidth);
  card.style.transformOrigin = 'top left';
  card.style.transform = `scale(${scale})`;
  stage.style.height = `${card.offsetHeight * scale}px`;
}

function themeSwatch(theme) {
  const t = theme.tokens;
  return `<span class="theme-chip-swatch" style="background:linear-gradient(135deg,${t['--c-bg']},${t['--c-bg-2']});border-color:${t['--c-border']}">
    <span style="background:${t['--c-accent']}"></span>
    <span style="background:${t['--c-accent-2']}"></span>
  </span>`;
}

function renderControls() {
  const cfg = state.cardConfig;
  const host = $('card-controls');
  if (!host) return;

  host.innerHTML = `
    <div class="card-control">
      <div class="card-control-label">Size</div>
      <div class="layout-chips">
        ${Object.values(CARD_LAYOUTS).map(l => `
          <button type="button" class="layout-chip${cfg.layout === l.id ? ' selected' : ''}" data-card-layout="${l.id}">
            <span class="layout-chip-name">${escHtml(l.name)}</span>
            <span class="layout-chip-desc">${escHtml(l.description)}</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="card-control">
      <div class="card-control-label">Theme</div>
      <div class="theme-chips">
        ${Object.values(CARD_THEMES).map(t => `
          <button type="button" class="theme-chip${cfg.theme === t.id ? ' selected' : ''}" data-card-theme="${t.id}" title="${escHtml(t.name)}">
            ${themeSwatch(t)}
            <span class="theme-chip-name">${escHtml(t.name)}</span>
          </button>`).join('')}
      </div>
    </div>

    <div class="card-control">
      <div class="card-control-label">Export scale</div>
      <div class="scale-chips">
        ${SCALES.map(s => `
          <button type="button" class="scale-chip${cfg.scale === s ? ' selected' : ''}" data-card-scale="${s}">${s}×</button>`).join('')}
      </div>
      <div class="card-control-hint" id="scale-hint"></div>
    </div>`;

  updateScaleHint();
}

function updateScaleHint() {
  const hint = $('scale-hint');
  if (!hint) return;
  const layout = getLayout(state.cardConfig.layout);
  const card = $('export-card');
  const h = card?.offsetHeight || layout.height || layout.minHeight;
  const s = state.cardConfig.scale;
  hint.textContent = `PNG will be ${layout.width * s} × ${Math.round(h * s)} px`;
}

/** Selecting a layout, theme or scale. Returns true when it handled the click. */
export function handleCardControl(el) {
  const layout = el.closest('[data-card-layout]');
  const theme = el.closest('[data-card-theme]');
  const scale = el.closest('[data-card-scale]');

  if (layout) state.cardConfig.layout = layout.dataset.cardLayout;
  else if (theme) state.cardConfig.theme = theme.dataset.cardTheme;
  else if (scale) state.cardConfig.scale = Number(scale.dataset.cardScale);
  else return false;

  save(state);
  renderControls();
  drawCard();
  updateScaleHint();
  return true;
}

// ── Exports ─────────────────────────────────────────────────────────────────

const cardEl = () => $('export-card');
const name = () => state.identity.name || 'character';

export function exportPng() {
  return downloadPng(cardEl(), name(), state.cardConfig.scale);
}

export function exportCopy() {
  return copyPng(cardEl(), state.cardConfig.scale);
}

export function exportShare() {
  return sharePng(cardEl(), name(), state.cardConfig.scale);
}

/**
 * Print to PDF. The print stylesheet sizes the card to A4, so any other preset
 * would be printed at the wrong aspect — switch first rather than produce a
 * silently cropped page.
 */
export function exportPdf() {
  if (state.cardConfig.layout !== 'a4') {
    state.cardConfig.layout = 'a4';
    save(state);
    renderControls();
    drawCard();
    showToast('Switched to A4 for printing');
  }
  printCard(cardEl());
}

// ── Share link + QR ─────────────────────────────────────────────────────────

let shareUrl = '';

async function refreshShare() {
  const field = $('share-url');
  if (!field) return;
  shareUrl = await buildShareUrl(state);
  field.value = shareUrl;

  const qrBox = $('share-qr');
  const qrNote = $('share-qr-note');
  if (!qrBox) return;

  const modules = qrModuleCount(shareUrl);
  if (modules > QR_MODULE_LIMIT) {
    qrBox.innerHTML = '';
    qrBox.hidden = true;
    qrNote.textContent = `Too much on this sheet for a scannable QR (${shareUrl.length} characters). Share the link instead.`;
  } else {
    qrBox.innerHTML = qrSvg(shareUrl, 200);
    qrBox.hidden = false;
    qrNote.textContent = 'Point a phone camera at this to open the card.';
  }
}

export async function copyShareLink() {
  if (!shareUrl) await refreshShare();
  try {
    await navigator.clipboard.writeText(shareUrl);
    showToast('Link copied: the answer to your lie is not in it');
  } catch {
    $('share-url')?.select();
    showToast('Press ⌘C to copy the selected link');
  }
}

export function openShareLink() {
  if (shareUrl) window.open(shareUrl, '_blank', 'noopener');
}
