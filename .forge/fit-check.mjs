// Verifies the fixed-size card presets in a real browser engine.
//
// Two things jsdom cannot answer, both of which shipped as bugs: whether a preset
// renders at its declared height, and whether fitCard notices content that has
// overflowed. The multi-column presets overflow sideways, so the second question
// is not the same as "is the card taller than it should be".
//
// Run: node .forge/fit-check.mjs   (needs `make serve` on 8814)

import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { SHEET } from './sheet-fixture.mjs';

const ORIGIN = 'http://localhost:8814';


// channel:'chrome' uses the installed Google Chrome. Playwright's own bundled
// headless shell is not downloaded on this machine, and this check does not need it.
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1800, height: 1200 } });

const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

await page.goto(`${ORIGIN}/card.html`);

const result = await page.evaluate(async (sheetIn) => {
  const base = location.origin + '/js/';
  const { hydrateSheet } = await import(base + 'sheet.js');
  const { buildCardModel } = await import(base + 'card/model.js');
  const { renderCard } = await import(base + 'card/render.js');
  const { cardToPngBlob } = await import(base + 'card/export.js');
  const { CARD_THEMES, CARD_LAYOUTS } = await import(base + 'card/presets.js');

  const sheet = hydrateSheet(sheetIn);
  const model = buildCardModel(sheet);
  const card = document.getElementById('reader-card');
  document.getElementById('reader-status').hidden = true;
  document.getElementById('reader-card-wrap').hidden = false;

  const sizes = [];
  // vertical interleaved: it leaves minHeight behind, which is what was clamping
  // every shorter fixed preset to 1000px.
  for (const layout of ['vertical', 'slack', 'vertical', 'social', 'vertical', 'a4', 'vertical', 'compact']) {
    const { dropped } = renderCard(card, model, { ...sheet.cardConfig, layout }, new Map());
    const preset = CARD_LAYOUTS[layout];
    const body = card.querySelector('.cc-body');
    const cardRect = card.getBoundingClientRect();
    // A block whose right edge passes the card's content box is clipped by
    // overflow:hidden — invisible in the export, and silent without this check.
    const clipped = [...body.children].filter((b) => {
      const r = b.getBoundingClientRect();
      return Math.round(r.x - cardRect.x + r.width) > card.clientWidth - 44 + 1;
    }).map((b) => b.dataset.block);

    const blob = await cardToPngBlob(card, 1);
    const bmp = blob && await createImageBitmap(blob);

    sizes.push({
      layout,
      h: card.offsetHeight,
      wantH: preset.height ?? `>=${preset.minHeight}`,
      sizeOk: preset.height ? card.offsetHeight === preset.height : card.offsetHeight >= preset.minHeight,
      png: bmp ? `${bmp.width}x${bmp.height}` : 'null',
      dropped: dropped.join(',') || '-',
      note: card.querySelector('.cc-dropped')?.textContent ?? null,
      clipped: clipped.join(',') || '-',
      bodyOverflowX: body.scrollWidth > body.clientWidth + 1,
    });
  }

  // Every theme × layout renders without throwing, and nothing is clipped.
  const matrix = [];
  for (const layout of Object.keys(CARD_LAYOUTS)) {
    for (const theme of Object.keys(CARD_THEMES)) {
      try {
        renderCard(card, model, { ...sheet.cardConfig, theme, layout }, new Map());
        const body = card.querySelector('.cc-body');
        const cardRect = card.getBoundingClientRect();
        const clipped = [...body.children].filter((b) => {
          const r = b.getBoundingClientRect();
          return Math.round(r.x - cardRect.x + r.width) > card.clientWidth - 44 + 1;
        }).length;
        matrix.push({ layout, theme, clipped, err: null });
      } catch (e) {
        matrix.push({ layout, theme, clipped: null, err: String(e) });
      }
    }
  }
  return { totalBlocks: model.blocks.length, sizes, matrix };
}, SHEET);

console.log(`model blocks: ${result.totalBlocks}\n`);
console.log('layout    height  want    ok     png         clipped  dropped');
for (const r of result.sizes) {
  console.log(
    `${r.layout.padEnd(9)} ${String(r.h).padEnd(7)} ${String(r.wantH).padEnd(7)} ` +
    `${(r.sizeOk ? 'PASS' : 'FAIL').padEnd(6)} ${r.png.padEnd(11)} ${r.clipped.padEnd(8)} ${r.dropped}`
  );
}

const sizeFails = result.sizes.filter((r) => !r.sizeOk);
const clipFails = result.sizes.filter((r) => r.clipped !== '-');
const silent = result.sizes.filter((r) => r.dropped !== '-' && !r.note);
const matrixErrs = result.matrix.filter((m) => m.err);
const matrixClips = result.matrix.filter((m) => m.clipped > 0);

console.log(`\nmatrix: ${result.matrix.length} theme×layout combos, ${matrixErrs.length} threw, ${matrixClips.length} clipped`);
for (const m of [...matrixErrs, ...matrixClips]) console.log(`  ${m.layout}/${m.theme}: ${m.err ?? m.clipped + ' clipped'}`);
console.log(`console errors: ${consoleErrors.length}`);
for (const e of consoleErrors) console.log(`  ${e}`);

const failed = sizeFails.length || clipFails.length || silent.length || matrixErrs.length || matrixClips.length;
console.log(`\n${failed ? 'FAIL' : 'PASS'}, size ${sizeFails.length}, clipped ${clipFails.length}, silent-drop ${silent.length}`);

await browser.close();
process.exit(failed ? 1 : 0);
