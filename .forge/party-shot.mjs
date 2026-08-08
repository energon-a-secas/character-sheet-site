// Screenshots the party board with the four-person fixture loaded.
//
// The analyzer is checked numerically by party-check.mjs; this exists for the part
// no assertion covers — whether the board is readable, whether the overlap grid
// communicates anything at a glance, and whether long names break the roster.
//
// Run: node .forge/party-shot.mjs   (needs `make serve` on 8814)

import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { ROSTER } from './party-fixture.mjs';

const width = Number(process.argv[2]) || 1400;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });

await page.goto('http://localhost:8814/party.html');
await page.waitForSelector('#party-add');
const url = await page.evaluate(async (r) => {
  const { buildRosterUrl } = await import(location.origin + '/js/share/link.js');
  return buildRosterUrl(r);
}, ROSTER);

await page.goto('about:blank');
await page.goto(url);
await page.waitForFunction(() => document.querySelectorAll('.party-member').length === 4, { timeout: 8000 });
await page.waitForTimeout(300);

const out = `.forge/party-${width}.png`;
await page.screenshot({ path: out, fullPage: true });
console.log(`wrote ${out}`);
await browser.close();
