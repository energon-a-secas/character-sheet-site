// Drives the real app end to end: fill a sheet, open the card modal, exercise every
// control and every export button.
//
// The unit-level fit-check renders the card in isolation; this checks the wiring —
// that the buttons are bound, that the element the modal previews is the element the
// export reads, and that switching a preset re-renders rather than silently keeping
// the old one.
//
// Run: node .forge/app-check.mjs   (needs `make serve` on 8814)

import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { SHEET } from './sheet-fixture.mjs';

const ORIGIN = 'http://localhost:8814';
const IGNORE = [/frame-ancestors/i]; // also present on the untouched page

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

// Seed localStorage before the app boots so it loads a complete sheet.
// Guarded because addInitScript runs in *every* frame, including the sandboxed
// intro-slide preview iframe, where touching localStorage throws.
await page.addInitScript((sheet) => {
  try {
    localStorage.setItem('player-card', JSON.stringify({ ...sheet, showBuilder: true }));
  } catch { /* sandboxed subframe */ }
}, SHEET);

await page.goto(`${ORIGIN}/index.html`);
await page.waitForSelector('#section-container .section-card');

const steps = [];
const record = (name, ok, detail = '') => steps.push({ name, ok, detail });

// ── Open the card modal via the real button ───────────────────────────────────
await page.click('#btn-next');
await page.waitForSelector('#export-card .cc-name', { timeout: 8000 });

record('modal opens', await page.isVisible('#card-modal.open'));
record('card renders name', (await page.textContent('#export-card .cc-name')) === 'Ada Rivera');

// ── Controls exist and are driven from the presets module ─────────────────────
const counts = await page.evaluate(() => ({
  layouts: document.querySelectorAll('[data-card-layout]').length,
  themes: document.querySelectorAll('[data-card-theme]').length,
  scales: document.querySelectorAll('[data-card-scale]').length,
}));
record('5 size chips', counts.layouts === 5, `got ${counts.layouts}`);
record('7 theme chips', counts.themes === 7, `got ${counts.themes}`);
record('3 scale chips', counts.scales === 3, `got ${counts.scales}`);

// ── Switching a size re-renders at the new preset ─────────────────────────────
for (const [layout, w, h] of [['slack', 1600, 900], ['social', 1080, 1080], ['compact', 600, 800], ['vertical', 800, null]]) {
  await page.click(`[data-card-layout="${layout}"]`);
  const box = await page.evaluate(() => {
    const c = document.getElementById('export-card');
    return { w: c.offsetWidth, h: c.offsetHeight, scale: c.style.transform };
  });
  const ok = box.w === w && (h === null ? box.h >= 1000 : box.h === h);
  record(`size ${layout} → ${w}×${h ?? '≥1000'}`, ok, `got ${box.w}×${box.h}`);
  // The preview must be a transform: layout width has to stay at the preset value,
  // because that is what the exporter reads.
  record(`  ${layout} previewed by transform`, box.scale.startsWith('scale') || box.w <= 800, box.scale);
}

// ── Theme switch writes the tokens onto the card ──────────────────────────────
await page.click('[data-card-theme="cyberpunk"]');
const accent = await page.evaluate(() =>
  document.getElementById('export-card').style.getPropertyValue('--c-accent').trim());
record('theme switch writes tokens', accent === '#00f0ff', accent);
await page.click('[data-card-theme="default"]');

// ── Scale selection changes the exported pixel size ──────────────────────────
await page.click('[data-card-layout="slack"]');
for (const s of [1, 3]) {
  await page.click(`[data-card-scale="${s}"]`);
  const size = await page.evaluate(async (scale) => {
    const { cardToPngBlob } = await import(location.origin + '/js/card/export.js');
    const blob = await cardToPngBlob(document.getElementById('export-card'), scale);
    const bmp = await createImageBitmap(blob);
    return `${bmp.width}x${bmp.height}`;
  }, s);
  record(`scale ${s}× exports ${1600 * s}x${900 * s}`, size === `${1600 * s}x${900 * s}`, size);
}

// ── The drop note is surfaced in the UI, not just on the card ────────────────
const drop = await page.evaluate(() => {
  const n = document.getElementById('card-drop-note');
  return { hidden: n.hidden, text: n.textContent };
});
record('drop note shown for slack', !drop.hidden && /could not fit/.test(drop.text), drop.text);

await page.click('[data-card-layout="vertical"]');
const noDrop = await page.evaluate(() => document.getElementById('card-drop-note').hidden);
record('drop note hidden for portrait', noDrop);

// ── Share link + QR ──────────────────────────────────────────────────────────
const share = await page.evaluate(() => ({
  url: document.getElementById('share-url').value,
  qrHidden: document.getElementById('share-qr').hidden,
  note: document.getElementById('share-qr-note').textContent,
}));
record('share link built', /card\.html#s=[A-Za-z0-9_-]+$/.test(share.url), `${share.url.length} chars`);
record('QR falls back to link when dense', share.qrHidden && /Share the link/.test(share.note), share.note);

// The link must not contain the answer — the UI says so, so it has to be true.
const linkHasAnswer = await page.evaluate(async (url) => {
  const { decodeSheet } = await import(location.origin + '/js/share/link.js');
  const decoded = await decodeSheet(url.match(/#s=(.+)$/)[1]);
  return JSON.stringify(decoded).includes('"lie"');
}, share.url);
record('share link omits the lie', !linkHasAnswer);

// ── Every action button is wired ─────────────────────────────────────────────
// Downloads and clipboard are stubbed: the point is that the handler runs and the
// export path produces bytes, not that Chrome saves a file.
const actions = await page.evaluate(async () => {
  const out = {};
  const origWrite = navigator.clipboard.write;
  const origText = navigator.clipboard.writeText;
  let clipboardCalls = 0;
  navigator.clipboard.write = async () => { clipboardCalls++; };
  navigator.clipboard.writeText = async () => { clipboardCalls++; };
  const origPrint = window.print;
  let printed = 0;
  window.print = () => { printed++; };
  const clicks = [];
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { clicks.push(this.download); };

  const press = async (action) => {
    document.querySelector(`[data-card-action="${action}"]`).click();
    await new Promise(r => setTimeout(r, 900));
  };

  for (const a of ['png', 'copy', 'pdf', 'script', 'copy-link']) await press(a);

  out.downloads = clicks;
  out.clipboardCalls = clipboardCalls;
  out.printed = printed;
  out.printRootEmpty = (document.getElementById('card-print-root')?.children.length ?? 0);
  out.layoutAfterPdf = document.getElementById('export-card').dataset.layout;

  navigator.clipboard.write = origWrite;
  navigator.clipboard.writeText = origText;
  window.print = origPrint;
  HTMLAnchorElement.prototype.click = origClick;
  return out;
});

record('PNG button downloads a file', actions.downloads.some(d => /-card@\d x?/.test(d) || /-card@/.test(d)), JSON.stringify(actions.downloads));
record('copy image + script + link hit clipboard', actions.clipboardCalls >= 3, `${actions.clipboardCalls} calls`);
record('PDF button prints', actions.printed === 1, `${actions.printed}`);
record('PDF switches to a4', actions.layoutAfterPdf === 'a4', actions.layoutAfterPdf);

// ── Deck + script agree with the card on the two-truths order ────────────────
// Regression: both used Math.random(), so the card, the deck and the presenter
// script each listed the statements differently, and the script printed the answer
// inline next to the lie.
const truths = await page.evaluate(async () => {
  const { state } = await import(location.origin + '/js/state.js');
  const { getTwoTruths } = await import(location.origin + '/js/card/model.js');
  const { generatePresentationHTML, generateScript } = await import(location.origin + '/js/present.js');

  const model = getTwoTruths(state).map(t => t.text);
  const cardOrder = [...document.querySelectorAll('#export-card .cc-truth-list li')].map(li => li.textContent.trim());

  const deck = generatePresentationHTML(state);
  const deckOrder = [...deck.matchAll(/<div class="gc-text">([^<]+)</g)].map(m => m[1]);
  const deckAgain = [...generatePresentationHTML(state).matchAll(/<div class="gc-text">([^<]+)</g)].map(m => m[1]);

  const script = generateScript(state);
  const scriptOrder = [...script.matchAll(/^\*\*[A-C]\.\*\* (.+)$/gm)].map(m => m[1].trim());

  return {
    model, cardOrder, deckOrder, deckAgain, scriptOrder,
    deckLeaksAnswer: /data-lie="1"[^>]*>[\s\S]{0,40}gc-letter/.test(deck) === false && /this is the lie/.test(deck),
    scriptLeaksInline: /this is the lie/.test(script),
    scriptHasFoldedAnswer: /<details>[\s\S]*is the lie/.test(script),
  };
});

const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
record('card matches the model order', same(truths.cardOrder, truths.model), truths.cardOrder.join(' | '));
record('deck matches the card order', same(truths.deckOrder, truths.model), truths.deckOrder.join(' | '));
record('deck order is stable across renders', same(truths.deckOrder, truths.deckAgain));
record('script matches the card order', same(truths.scriptOrder, truths.model), truths.scriptOrder.join(' | '));
record('script does not tag the lie inline', !truths.scriptLeaksInline);
record('script folds the answer away', truths.scriptHasFoldedAnswer);

// Intro slide 1: yearsExperience is free text, and the separator must not be escaped.
const slide1 = await page.evaluate(async () => {
  const { state } = await import(location.origin + '/js/state.js');
  const { generatePresentationHTML } = await import(location.origin + '/js/present.js');
  const html = generatePresentationHTML(state);
  return (html.match(/<div class="job-line">([^<]*)</) || [])[1] || '';
});
record('intro slide job line clean', slide1 === 'Platform Engineer &middot; 9 years', JSON.stringify(slide1));

// The print root must not be visible on the page between prints.
const printRoot = await page.evaluate(() => {
  const r = document.getElementById('card-print-root');
  if (!r) return { exists: false };
  return { exists: true, display: getComputedStyle(r).display, height: r.offsetHeight };
});
record('print root hidden on screen', !printRoot.exists || printRoot.display === 'none',
  JSON.stringify(printRoot));

// ── Report ───────────────────────────────────────────────────────────────────
for (const s of steps) console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.name}${s.detail ? `  (${s.detail})` : ''}`);
console.log(`\nconsole errors: ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);

const failed = steps.filter(s => !s.ok).length + errors.length;
console.log(`\n${failed ? 'FAIL' : 'PASS'} — ${steps.filter(s => !s.ok).length} step(s), ${errors.length} console error(s)`);

await browser.close();
process.exit(failed ? 1 : 0);
