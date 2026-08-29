// Checks the party board: the analyzer's arithmetic and the page's wiring.
//
// The arithmetic half runs the real modules in the page context against a fixture
// with hand-computed answers (.forge/party-fixture.mjs). Overlap maths is exactly
// the kind of code that looks right and is off by an hour, and "shared interests"
// that nobody actually shares is worse output than none.
//
// The wiring half drives the page as a person does: paste links, import a file,
// remove someone, copy the summary.
//
// Run: node .forge/party-check.mjs   (needs `make serve` on 8814)

import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
import { ROSTER, ADA, KENJI, MARTA, SAM } from './party-fixture.mjs';

const ORIGIN = 'http://localhost:8814';
const IGNORE = [/frame-ancestors/i];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const steps = [];
const record = (name, ok, detail = '') => steps.push({ name, ok, detail });

await page.goto(`${ORIGIN}/party.html`);
await page.waitForSelector('#party-add');

// ── Analyzer, against hand-computed expectations ──────────────────────────────

const analysis = await page.evaluate(async (roster) => {
  const { hydrateSheet } = await import(location.origin + '/js/sheet.js');
  const { analyze, toMember, offsetMinutes } = await import(location.origin + '/js/party/analyze.js');
  const members = roster.map((s, i) => toMember(hydrateSheet(s), `m${i}`));
  return {
    result: analyze(members),
    offsets: members.map(m => [m.name, m.offsetMinutes]),
    names: members.map(m => m.name),
    tokyo: offsetMinutes('Asia/Tokyo'),
    kolkata: offsetMinutes('Asia/Kolkata'),
    utc: offsetMinutes('UTC'),
    bogus: offsetMinutes('Not/AZone'),
  };
}, ROSTER);

const { result } = analysis;

record('all four members built', analysis.names.join(',') === 'Ada,Kenji,Marta,Sam', analysis.names.join(','));
record('Tokyo is +540', analysis.tokyo === 540, `${analysis.tokyo}`);
// Half-hour zones are the reason for longOffset rather than shortOffset.
record('Kolkata is +330 (half-hour zone)', analysis.kolkata === 330, `${analysis.kolkata}`);
record('UTC is 0', analysis.utc === 0, `${analysis.utc}`);
record('bad zone is null, not a throw', analysis.bogus === null, `${analysis.bogus}`);

// Sam has no timezone: must be named as uncounted, and must not be in `placed`.
record('3 of 4 placed', result.overlap.placed === 3, `${result.overlap.placed}`);
record('Sam reported as unplaced', result.overlap.unknown.join(',') === 'Sam', result.overlap.unknown.join(','));

// Santiago (-4/-3) and Tokyo (+9) cannot both be in a 09:00–18:00 window, so the
// best possible is 2 of 3 — and it must be a real pair, not a phantom 3.
record('best overlap is 2 of 3', result.overlap.best === 2, `${result.overlap.best}`);
record('overlap window has 2 names', result.overlap.window?.names.length === 2,
  JSON.stringify(result.overlap.window?.names));
record('24 hour cells', result.overlap.hours.length === 24, `${result.overlap.hours.length}`);

// Verify one cell independently: at 12:00 UTC, Madrid is 13:00/14:00 (in window),
// Tokyo is 21:00 (out), Santiago is 08:00/09:00 (borderline by DST). So Marta must
// be available and Kenji must not.
const noon = result.overlap.hours[12].available;
record('12:00 UTC includes Marta', noon.includes('Marta'), noon.join(','));
record('12:00 UTC excludes Kenji', !noon.includes('Kenji'), noon.join(','));
// 00:00 UTC is 09:00 Tokyo — Kenji in, Marta (01:00/02:00) out.
const midnight = result.overlap.hours[0].available;
record('00:00 UTC includes Kenji', midnight.includes('Kenji'), midnight.join(','));
record('00:00 UTC excludes Marta', !midnight.includes('Marta'), midnight.join(','));

// Shared items, exact.
const byLabel = (needle) => result.ground.shared.find(r => r.label.toLowerCase() === needle);
const elden = byLabel('elden ring');
record('Elden Ring shared by 3', elden?.people.length === 3, JSON.stringify(elden?.people));
record('lowercase title folded into the same row',
  elden?.people.includes('Ada') && elden?.people.includes('Kenji') && elden?.people.includes('Marta'),
  JSON.stringify(elden?.people));

const hollow = byLabel('hollow knight');
record('Hollow Knight shared by Ada + Sam',
  hollow?.people.join(',') === 'Ada,Sam', JSON.stringify(hollow?.people));

const arrival = byLabel('arrival');
record('Arrival shared by Ada + Marta',
  arrival?.people.join(',') === 'Ada,Marta', JSON.stringify(arrival?.people));

const cooking = byLabel('cooking');
record('Cooking shared by 3', cooking?.people.length === 3, JSON.stringify(cooking?.people));

// Nothing with a single owner may appear in `shared` — that is the whole claim.
const oneOwner = result.ground.shared.filter(r => r.people.length < 2);
record('no single-owner rows in shared', oneOwner.length === 0, JSON.stringify(oneOwner.map(r => r.label)));

// "Reading" is Marta's alone → must not be shared, and must not be in solo either
// (solo is titles only, not hobbies).
record('Reading not in shared', !byLabel('reading'), '');
record('solo is titles only',
  result.ground.solo.every(r => ['games', 'anime', 'movies'].includes(r.category)),
  JSON.stringify(result.ground.solo.map(r => r.category)));

const solo = result.ground.solo.find(r => r.label === 'Outer Wilds');
record('Outer Wilds listed as solo (Kenji)', solo?.people.join(',') === 'Kenji', JSON.stringify(solo?.people));

// Platforms are a match but a weak one — they must sort below the titles.
const firstPlatform = result.ground.shared.findIndex(r => r.category === 'platforms');
const firstTitle = result.ground.shared.findIndex(r => r.category === 'games');
record('titles rank above platforms in shared order',
  firstTitle >= 0 && (firstPlatform === -1 || firstTitle < firstPlatform),
  `title@${firstTitle} platform@${firstPlatform}`);

// Composition covers everyone exactly once.
const classPeople = result.composition.flatMap(c => c.people);
record('composition covers all 4 once', classPeople.length === 4 && new Set(classPeople).size === 4,
  JSON.stringify(classPeople));

// The gap must be the real extreme pair, and must not be inflated past 12h.
// Names, not members: returning members embeds two whole sheets in the result.
record('widest gap is Ada↔Kenji', result.gap && [result.gap.a, result.gap.b].sort().join(',') === 'Ada,Kenji',
  result.gap ? `${result.gap.a}/${result.gap.b}` : 'none');
record('gap holds names, not member objects',
  result.gap && typeof result.gap.a === 'string', typeof result.gap?.a);
record('gap is ≤ 12h (wraps)', result.gap && result.gap.minutes <= 720, `${result.gap?.minutes} min`);

record('icebreakers reference real names',
  result.icebreakers.length > 0 && result.icebreakers.every(p => typeof p === 'string' && p.length > 10),
  `${result.icebreakers.length} prompts`);
// Every name mentioned in a prompt must be on the roster — a prompt naming
// somebody who is not there is the worst possible output for this page.
const strayName = result.icebreakers.some(p => /\b(Nobody but|listed) ([A-Z][a-z]+)\b/.test(p)
  && !analysis.names.some(n => p.includes(n)));
record('no prompt invents a person', !strayName, '');
// Pair grammar: these lines get read out loud, and "Ada and Sam all listed" reads
// as a typo. Ada+Sam share Hollow Knight, so a "both" prompt must exist.
const pairPrompt = result.icebreakers.find(p => /Hollow Knight/.test(p));
record('pair prompts say "both", not "all"', /\bboth listed\b/.test(pairPrompt || ''), pairPrompt || 'none');
const triplePrompt = result.icebreakers.find(p => /Elden Ring/.test(p));
record('three-person prompts still say "all"', /\ball listed\b/.test(triplePrompt || ''), triplePrompt || 'none');

// ── Two-truths answers must never reach this page's output ────────────────────
// Ada's and Kenji's sheets still carry truth1/truth2/lie (they came in as objects,
// not through a share link). Nothing the analyzer returns may contain them: the
// result is what `summaryText` serialises and a person pastes into a channel.
const serialised = JSON.stringify(result);
const leak = serialised.match(/"isLie"|"lie"/);
record('no answer field in the analysis output', !leak, leak ? leak[0] : '');
record('no raw sheet embedded in the analysis output',
  !serialised.includes('"truth1"') && !serialised.includes('"cardConfig"'), '');

// ── Roster link round-trips, and strips answers ───────────────────────────────
const roundTrip = await page.evaluate(async (roster) => {
  const { buildRosterUrl, decodeRoster } = await import(location.origin + '/js/share/link.js');
  const { encodeSheet } = await import(location.origin + '/js/share/link.js');
  const url = await buildRosterUrl(roster);
  const payload = url.match(/#r=(.+)$/)[1];
  const back = await decodeRoster(payload);
  // Compare against the sum of independent single-sheet payloads: one gzip window
  // over the whole roster should beat four separate ones.
  const separate = (await Promise.all(roster.map(encodeSheet))).reduce((n, p) => n + p.length, 0);
  return {
    urlLength: url.length,
    payloadLength: payload.length,
    separate,
    count: back.length,
    names: back.map(s => s.identity?.name),
    hasLie: JSON.stringify(back).includes('"lie"'),
    hasStatements: back.filter(s => Array.isArray(s.intro?.statements)).length,
  };
}, ROSTER);

record('roster round-trips all 4', roundTrip.count === 4 && roundTrip.names.join(',') === 'Ada,Kenji,Marta,Sam',
  JSON.stringify(roundTrip.names));
record('roster link contains no "lie" field', !roundTrip.hasLie, '');
record('the two sheets with answers became statements arrays', roundTrip.hasStatements === 2,
  `${roundTrip.hasStatements}`);
record('one gzip window beats separate payloads',
  roundTrip.payloadLength < roundTrip.separate,
  `roster ${roundTrip.payloadLength} vs separate ${roundTrip.separate}`);

// ── Wiring: the page as a person drives it ───────────────────────────────────

// Paste two real card links.
const links = await page.evaluate(async ([a, b]) => {
  const { buildShareUrl } = await import(location.origin + '/js/share/link.js');
  return [await buildShareUrl(a), await buildShareUrl(b)];
}, [ADA, KENJI]);

await page.fill('#party-input', links.join('\n'));
await page.click('#party-add');
await page.waitForSelector('.party-member', { timeout: 5000 });

record('two pasted links became two members',
  (await page.locator('.party-member').count()) === 2,
  `${await page.locator('.party-member').count()}`);
record('board replaced the empty state', await page.isHidden('#party-empty'));
record('textarea cleared after a successful add', (await page.inputValue('#party-input')) === '');
record('overlap grid rendered 24 cells',
  (await page.locator('.party-hour').count()) === 24,
  `${await page.locator('.party-hour').count()}`);

// A duplicate must be refused by name, not silently added.
await page.fill('#party-input', links[0]);
await page.click('#party-add');
await page.waitForTimeout(150);
record('duplicate refused', (await page.locator('.party-member').count()) === 2,
  `${await page.locator('.party-member').count()}`);
record('duplicate explained to the user', /already in the party/i.test(await page.textContent('#party-error')),
  await page.textContent('#party-error'));

// A truncated link — the failure mode Slack actually produces.
await page.fill('#party-input', `${ORIGIN}/card.html`);
await page.click('#party-add');
await page.waitForTimeout(150);
record('truncated link reported, not crashed',
  /cut off/i.test(await page.textContent('#party-error')), await page.textContent('#party-error'));

// Import the remaining two as a .json file.
await page.setInputFiles('#party-files', {
  name: 'roster.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify([MARTA, SAM])),
});
await page.waitForFunction(() => document.querySelectorAll('.party-member').length === 4, { timeout: 5000 });
record('json import added 2 more', (await page.locator('.party-member').count()) === 4);

// The board must now show the shared rows the analyzer computed.
const sharedText = await page.textContent('#party-shared');
record('board shows Elden Ring row', /Elden Ring/i.test(sharedText));
record('board names the three people who share it',
  /Ada/.test(sharedText) && /Kenji/.test(sharedText) && /Marta/.test(sharedText));
record('unplaced person named in the overlap note',
  /Sam/.test(await page.textContent('#party-overlap-note')),
  await page.textContent('#party-overlap-note'));

// Remove one and confirm the derived sections recompute rather than going stale.
const beforeRemove = await page.textContent('#party-shared');
await page.click('.party-member:nth-child(1) [data-remove-member]');
await page.waitForFunction(() => document.querySelectorAll('.party-member').length === 3, { timeout: 5000 });
const afterRemove = await page.textContent('#party-shared');
record('removing a member recomputes the board', beforeRemove !== afterRemove);
record('3 members left', (await page.locator('.party-member').count()) === 3);

// Summary text — the thing that gets pasted into Slack.
const summary = await page.evaluate(() => {
  // Read the clipboard-bound text through the same path the button uses by
  // stubbing the clipboard, since headless Chrome denies clipboard writes.
  let captured = '';
  const original = navigator.clipboard.writeText;
  navigator.clipboard.writeText = (t) => { captured = t; return Promise.resolve(); };
  document.getElementById('party-copy').click();
  return new Promise(resolve => setTimeout(() => {
    navigator.clipboard.writeText = original;
    resolve(captured);
  }, 300));
});
record('summary has a roster section', /\*Roster\*/.test(summary));
record('summary has prompts', /\*Start here\*/.test(summary));
record('summary uses Slack single-asterisk bold', !/\*\*/.test(summary),
  (summary.match(/\*\*[^*]+\*\*/) || [''])[0]);
record('summary names a real member', /Kenji|Marta|Sam/.test(summary));
record('summary leaks no answer', !/"lie"/.test(summary));

// Clear must also drop the hash, or a reload restores what was cleared.
await page.evaluate(() => history.replaceState(null, '', location.pathname + '#r=deadbeef'));
await page.click('#party-clear');
await page.waitForTimeout(150);
record('clear empties the board', await page.isVisible('#party-empty'));
record('clear drops the roster hash', (await page.evaluate(() => location.hash)) === '');

// ── A roster link opens the board pre-filled ─────────────────────────────────
const rosterUrl = await page.evaluate(async (roster) => {
  const { buildRosterUrl } = await import(location.origin + '/js/share/link.js');
  return buildRosterUrl(roster);
}, ROSTER);

// A fragment-only navigation is same-document: no reload, so a board already open
// must react to hashchange. This is exactly what pasting a roster link into the
// address bar of an open tab does.
await page.goto(rosterUrl);
await page.waitForFunction(() => document.querySelectorAll('.party-member').length === 4, { timeout: 8000 });
record('roster link loads over an open board (hashchange)',
  (await page.locator('.party-member').count()) === 4,
  `${await page.locator('.party-member').count()}`);

// And on a genuinely cold load of the same URL.
await page.goto('about:blank');
await page.goto(rosterUrl);
await page.waitForFunction(() => document.querySelectorAll('.party-member').length === 4, { timeout: 8000 });
record('roster link boots cold with all 4 on the board',
  (await page.locator('.party-member').count()) === 4,
  `${await page.locator('.party-member').count()}`);

// ── The card page hands its own sheet to the board ───────────────────────────
const cardUrl = await page.evaluate(async (sheet) => {
  const { buildShareUrl } = await import(location.origin + '/js/share/link.js');
  return buildShareUrl(sheet);
}, ADA);
await page.goto(cardUrl);
await page.waitForSelector('#reader-card .cc-name', { timeout: 8000 });
const partyHref = await page.getAttribute('#reader-party', 'href');
record('card page party link carries the sheet', /#r=/.test(partyHref || ''),
  (partyHref || '').slice(0, 60));

// ── Report ───────────────────────────────────────────────────────────────────
for (const s of steps) console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.name}${s.detail ? `  (${s.detail})` : ''}`);
console.log(`\nconsole errors: ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);

const failed = steps.filter(s => !s.ok).length + errors.length;
console.log(`\n${failed ? 'FAIL' : 'PASS'}, ${steps.filter(s => !s.ok).length} step(s), ${errors.length} console error(s)`);

await browser.close();
process.exit(failed ? 1 : 0);
