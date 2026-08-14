// Writes the *real* PNG export for a preset — the actual deliverable.
//
// Not the same as screenshotting the element: a page screenshot is clipped by the
// reader page's 1240px container, while cardToPngBlob rasterises a detached clone.
// The wide presets can only be judged from this path.
//
// Run: node .forge/export-shot.mjs <layout> [theme] [scale]

import { writeFileSync } from 'node:fs';
import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { SHEET } from './sheet-fixture.mjs';

const layout = process.argv[2] || 'slack';
const theme = process.argv[3] || 'default';
const scale = Number(process.argv[4] || 1);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1800, height: 1300 } });
await page.goto('http://localhost:8814/card.html');

const b64 = await page.evaluate(async ([sheetIn, layout, theme, scale]) => {
  const base = location.origin + '/js/';
  const { hydrateSheet } = await import(base + 'sheet.js');
  const { buildCardModel, collectImageUrls } = await import(base + 'card/model.js');
  const { renderCard } = await import(base + 'card/render.js');
  const { cardToPngBlob, inlineImages } = await import(base + 'card/export.js');

  const sheet = hydrateSheet(sheetIn);
  document.getElementById('reader-status').hidden = true;
  document.getElementById('reader-card-wrap').hidden = false;
  const card = document.getElementById('reader-card');
  const model = buildCardModel(sheet);
  // Inline first. Passing an empty map renders every image as an empty frame,
  // which is precisely the failure this script exists to catch — a shot with no
  // pictures in it cannot tell you whether the picture path works.
  const images = await inlineImages(collectImageUrls(model));
  renderCard(card, model, { ...sheet.cardConfig, theme, layout }, images);

  const blob = await cardToPngBlob(card, scale);
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (const byte of buf) bin += String.fromCharCode(byte);
  return btoa(bin);
}, [SHEET, layout, theme, scale]);

const out = `.forge/export-${layout}-${theme}@${scale}x.png`;
writeFileSync(out, Buffer.from(b64, 'base64'));
console.log(out);
await browser.close();
