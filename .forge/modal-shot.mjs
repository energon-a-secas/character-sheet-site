// Screenshots the card modal as a user sees it: preview, controls, actions, share.
// Run: node .forge/modal-shot.mjs [layout] [theme]
import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { SHEET } from './sheet-fixture.mjs';

const layout = process.argv[2] || 'slack';
const theme = process.argv[3] || 'default';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1500, height: 1150 } });
await page.addInitScript((sheet) => {
  try { localStorage.setItem('player-card', JSON.stringify({ ...sheet, showBuilder: true })); } catch {}
}, SHEET);
await page.goto('http://localhost:8814/index.html');
await page.waitForSelector('#section-container .section-card');
await page.click('#btn-next');
await page.waitForSelector('#export-card .cc-name');
await page.click(`[data-card-layout="${layout}"]`);
await page.click(`[data-card-theme="${theme}"]`);
await page.waitForTimeout(400);
const out = `.forge/modal-${layout}-${theme}.png`;
await page.locator('.card-modal-content').screenshot({ path: out });
console.log(out);
await browser.close();
