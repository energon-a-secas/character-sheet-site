// Checks the Legends section, the meme classifier, and the sheet migration.
//
// Every assertion here exists because the thing it checks fails *silently*. A
// migration that stops running leaves the meme block simply absent from the card
// — the other checks still pass, they just render one block fewer. A URL
// classifier that stops rejecting `javascript:` produces a card that looks
// identical right up until someone clicks it. A "lost" Gold Saint that still
// carries a stale pick prints an answer the person explicitly withdrew.
//
// So each guard is tripped here, not merely exercised.
//
// Run: node .forge/legends-check.mjs   (needs `make serve` on 8814)

import { chromium } from '/Users/lucianoadonisvillarroel/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';

const ORIGIN = 'http://localhost:8814';
const IGNORE = [/frame-ancestors/i];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

const steps = [];
const record = (name, ok, detail = '') => steps.push({ name, ok, detail });

await page.goto(`${ORIGIN}/index.html`);
await page.waitForSelector('#section-container');

// ── URL classifier ────────────────────────────────────────────────────────────

const cls = await page.evaluate(async () => {
  const { classifyMediaUrl } = await import(location.origin + '/js/media-embed.js');
  const kind = (u) => { const r = classifyMediaUrl(u); return r ? `${r.kind}:${r.thumb}` : null; };
  return {
    watch:    kind('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    short:    kind('https://youtu.be/dQw4w9WgXcQ'),
    shorts:   kind('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
    embed:    kind('https://www.youtube.com/embed/dQw4w9WgXcQ?start=3'),
    image:    kind('https://example.com/a/meme.PNG?x=1'),
    plain:    kind('https://example.com/some/page'),
    js:       kind('javascript:alert(1)'),
    data:     kind('data:text/html,<script>alert(1)</script>'),
    relative: kind('/local/thing.png'),
    junk:     kind('not a url at all'),
    empty:    kind(''),
  };
});

const YT = 'youtube:https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
record('youtube watch?v= → thumbnail', cls.watch === YT, cls.watch);
record('youtu.be short → thumbnail', cls.short === YT, cls.short);
record('/shorts/ → thumbnail', cls.shorts === YT, cls.shorts);
record('/embed/ with query → thumbnail', cls.embed === YT, cls.embed);
record('image extension → image, case-insensitive, query ignored',
  cls.image === 'image:https://example.com/a/meme.PNG?x=1', cls.image);
record('other https → link, no thumb', cls.plain === 'link:', cls.plain);

// The scheme guard. These are the reason classifyMediaUrl returns null rather
// than passing text through to an href.
record('javascript: URL rejected', cls.js === null, String(cls.js));
record('data: URL rejected', cls.data === null, String(cls.data));
record('relative URL rejected', cls.relative === null, String(cls.relative));
record('non-URL rejected', cls.junk === null, String(cls.junk));
record('empty rejected', cls.empty === null, String(cls.empty));

// ── Sheet migration ───────────────────────────────────────────────────────────

const mig = await page.evaluate(async () => {
  const { hydrateSheet } = await import(location.origin + '/js/sheet.js');

  const legacy = hydrateSheet({
    extras: { memeLink: 'https://youtu.be/abcdefghijk', memeNote: 'the dog' },
  });
  const short = hydrateSheet({ extras: { memes: [{ url: 'https://a.test/x.png', note: '' }] } });
  const blank = hydrateSheet({});

  return {
    legacyUrl:   legacy.extras.memes[0].url,
    legacyNote:  legacy.extras.memes[0].note,
    legacyKeys:  Object.keys(legacy.extras).join(','),
    legacyLen:   legacy.extras.memes.length,
    shortLen:    short.extras.memes.length,
    shortSlot1:  JSON.stringify(short.extras.memes[1]),
    blankLen:    blank.extras.memes.length,
    hasLegends:  !!blank.legends && typeof blank.legends.goldSaint === 'string',
  };
});

record('legacy memeLink migrates into slot 0', mig.legacyUrl === 'https://youtu.be/abcdefghijk', mig.legacyUrl);
record('legacy memeNote migrates into slot 0', mig.legacyNote === 'the dog', mig.legacyNote);
record('legacy keys are removed, not left alongside', mig.legacyKeys === 'memes', mig.legacyKeys);
// A pruned share link decodes with a one-element array; render and the card both
// index slot 1 directly.
record('short array padded back to 2 slots', mig.shortLen === 2, `${mig.shortLen}`);
record('padded slot is a real empty slot', mig.shortSlot1 === '{"url":"","note":""}', mig.shortSlot1);
record('blank sheet has 2 slots', mig.blankLen === 2, `${mig.blankLen}`);
record('blank sheet has a legends section', mig.hasLegends, String(mig.hasLegends));

// ── Gold Saint: one field, two framings, and a withdrawal ──────────────────────

const saint = await page.evaluate(async () => {
  const { hydrateSheet } = await import(location.origin + '/js/sheet.js');
  const { legendFacts } = await import(location.origin + '/js/card/model.js');
  const facts = (legends) => legendFacts(hydrateSheet({ legends }));
  const valueOf = (legends, label) => (facts(legends).find(f => f.label === label) || {}).value || null;

  return {
    saintMode:  valueOf({ goldSaint: 'aquarius', goldSaintMode: '' }, 'Gold Saint'),
    zodiacMode: valueOf({ goldSaint: 'aquarius', goldSaintMode: 'zodiac' }, 'Gold Saint'),
    lostMode:   valueOf({ goldSaint: 'aquarius', goldSaintMode: 'lost' }, 'Gold Saint'),
    impostor:   valueOf({ gundam: 'optimus' }, 'Mobile suit'),
    realSuit:   valueOf({ gundam: 'wing' }, 'Mobile suit'),
    bogusSaint: valueOf({ goldSaint: 'ophiuchus' }, 'Gold Saint'),
    emptyCount: facts({}).length,
  };
});

// The U+FE0E is load-bearing, not stray whitespace: without it macOS draws the
// zodiac sign as a colour-emoji tile that ignores the card's palette. Asserted
// exactly so a "tidy-up" that strips it fails here rather than on someone's card.
record('saint framing prints the saint', saint.saintMode === 'Camus of Aquarius ♒︎', JSON.stringify(saint.saintMode));
record('the zodiac glyph keeps its text-presentation selector',
  /︎$/.test(saint.saintMode || ''), JSON.stringify(saint.saintMode));
// Answering by birthday must reach the card identically — that is the payoff of
// the alternative question, not a lesser answer.
record('zodiac framing prints the same value', saint.zodiacMode === saint.saintMode, String(saint.zodiacMode));
// The interview hides the chips in `lost` mode rather than clearing the field, so
// this is the only thing stopping a withdrawn answer reaching the card.
record('lost mode suppresses a stale pick', saint.lostMode === null, String(saint.lostMode));
record('unknown saint id is ignored, not printed raw', saint.bogusSaint === null, String(saint.bogusSaint));
record('the impostor is labelled as one', saint.impostor === 'Optimus Prime — which is not a Gundam', String(saint.impostor));
record('a real suit gets no editorial', saint.realSuit === 'Wing Zero', String(saint.realSuit));
record('empty legends produce no facts', saint.emptyCount === 0, `${saint.emptyCount}`);

// ── Section fill: "completely lost" is an answer, not a gap ────────────────────

const fill = await page.evaluate(async () => {
  const { hydrateSheet } = await import(location.origin + '/js/sheet.js');
  const { getSectionFill } = await import(location.origin + '/js/data.js');
  const f = (legends) => getSectionFill(hydrateSheet({ legends }), 'legends');
  return {
    empty: f({}),
    lost:  f({ retroDepth: 'lost' }),
    two:   f({ gundam: 'wing', dbForm: 'ssj' }),
    six:   f({ gundam: 'wing', dbForm: 'ssj', tfFaction: 'autobot', goldSaint: 'leo', arcadeGame: 'a', openingTheme: 'b' }),
    mode:  f({ goldSaintMode: 'zodiac' }),
  };
});

record('empty legends → 0', fill.empty === 0, `${fill.empty}`);
record('"completely lost" fills the ring', fill.lost === 1, `${fill.lost}`);
record('two of ten → 1/3', Math.abs(fill.two - 1 / 3) < 1e-9, `${fill.two}`);
record('six answers fill the ring', fill.six === 1, `${fill.six}`);
// Pressing the escape button is a framing choice, not an answer to the question.
record('choosing a framing alone scores nothing', fill.mode === 0, `${fill.mode}`);

// ── The section renders and is wired ──────────────────────────────────────────

const ui = await page.evaluate(async () => {
  const { state } = await import(location.origin + '/js/state.js');
  const { renderSection } = await import(location.origin + '/js/render.js');
  const { SECTIONS } = await import(location.origin + '/js/data.js');

  const idx = SECTIONS.findIndex(s => s.key === 'legends');
  state.currentSection = idx;
  state.legends.goldSaintMode = '';
  state.legends.goldSaint = '';
  renderSection(false);

  const q = (sel) => document.querySelectorAll(sel).length;
  const saintChips = q('[data-choice="legends.goldSaint"]');
  const gundamChips = q('[data-choice="legends.gundam"]');
  const impostorText = document.querySelector('.gundam-chip--impostor')?.textContent.trim() || '';

  // Switch framing through the real click path, not by setting state. The label
  // must be read from the Gold Saint group specifically — `.field-label` alone
  // matches the retro-depth question above it and passes for the wrong reason.
  const saintGroup = () =>
    document.querySelector('[data-escape="legends.goldSaintMode"]').closest('.field-group');
  saintGroup().querySelector('[data-escape="legends.goldSaintMode"][data-val="zodiac"]').click();
  const zodiacLabel = saintGroup().querySelector('.field-label')?.textContent || '';
  const firstChip = document.querySelector('[data-choice="legends.goldSaint"]')?.textContent.replace(/\s+/g, ' ').trim() || '';

  document.querySelector('[data-choice="legends.goldSaint"][data-val="aquarius"]').click();
  const reveal = document.querySelector('.saint-reveal')?.textContent.replace(/\s+/g, ' ').trim() || '';
  const keptPick = state.legends.goldSaint;

  saintGroup().querySelector('[data-escape="legends.goldSaintMode"][data-val="lost"]').click();
  const chipsWhenLost = q('[data-choice="legends.goldSaint"]');
  const stillPicked = state.legends.goldSaint;

  return { idx, saintChips, gundamChips, impostorText, zodiacLabel, firstChip, reveal, keptPick, chipsWhenLost, stillPicked };
}, );

record('legends is a real section', ui.idx > 0, `index ${ui.idx}`);
record('twelve Gold Saint chips', ui.saintChips === 12, `${ui.saintChips}`);
record('eight mobile suit chips', ui.gundamChips === 8, `${ui.gundamChips}`);
record('the impostor is on the board', /Optimus Prime/.test(ui.impostorText), ui.impostorText.replace(/\s+/g, ' '));
// The chip must NOT give itself away — the subtitle names the series like every
// other chip does, and the card supplies the punchline only after a pick.
record('the impostor chip does not spoil itself', !/not a Gundam/i.test(ui.impostorText), ui.impostorText.replace(/\s+/g, ' '));
record('escape reframes the question', /zodiac sign/i.test(ui.zodiacLabel), ui.zodiacLabel.trim());
record('reframed chips are labelled by sign', /Aries/.test(ui.firstChip), ui.firstChip);
record('picking a sign reveals the saint', /Camus of Aquarius/.test(ui.reveal), ui.reveal);
record('the pick writes the shared field', ui.keptPick === 'aquarius', ui.keptPick);
record('"no idea" hides the chips', ui.chipsWhenLost === 0, `${ui.chipsWhenLost}`);
// Non-destructive on purpose: a mistaken tap on "no idea" must be undoable.
record('"no idea" does not delete the answer', ui.stillPicked === 'aquarius', ui.stillPicked);

// ── Meme preview swaps without a re-render ───────────────────────────────────

const meme = await page.evaluate(async () => {
  const { state } = await import(location.origin + '/js/state.js');
  const { renderSection } = await import(location.origin + '/js/render.js');
  const { SECTIONS } = await import(location.origin + '/js/data.js');

  state.currentSection = SECTIONS.findIndex(s => s.key === 'extras');
  state.extras.memes = [{ url: '', note: '' }, { url: '', note: '' }];
  renderSection(false);

  const input = document.querySelector('[data-field="extras.memes.0.url"]');
  const slots = document.querySelectorAll('[data-field$=".url"]').length;

  input.focus();
  input.value = 'https://youtu.be/dQw4w9WgXcQ';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  const thumb = document.querySelector('#meme-preview-0 .meme-thumb')?.getAttribute('src') || '';
  const focusKept = document.activeElement === input;
  const saved = state.extras.memes[0].url;

  input.value = 'javascript:alert(1)';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const afterBad = document.querySelector('#meme-preview-0').textContent.trim();
  const badThumb = document.querySelectorAll('#meme-preview-0 .meme-thumb').length;

  return { slots, thumb, focusKept, saved, afterBad, badThumb };
});

record('two meme slots rendered', meme.slots === 2, `${meme.slots}`);
record('typing a YouTube link previews its thumbnail',
  meme.thumb === 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', meme.thumb);
// The whole reason the preview updates in place instead of calling renderSection.
record('the caret is not stolen mid-typing', meme.focusKept, String(meme.focusKept));
record('the URL reaches state', meme.saved === 'https://youtu.be/dQw4w9WgXcQ', meme.saved);
record('a javascript: URL renders no image', meme.badThumb === 0, `${meme.badThumb}`);
record('a javascript: URL is called out, not previewed', /Not a link yet/.test(meme.afterBad), meme.afterBad);

// ── The card's thumbnail contract, both branches ──────────────────────────────
//
// The claim in js/card/render.js is that a meme thumbnail is drawn only once it
// has been inlined as a data: URL, and that failing to inline costs the picture
// and nothing else. Both halves are asserted: a claim with only its happy path
// checked is how an empty box ends up in someone's exported PNG.

const card = await page.evaluate(async () => {
  const { hydrateSheet } = await import(location.origin + '/js/sheet.js');
  const { buildCardModel, collectImageUrls } = await import(location.origin + '/js/card/model.js');
  const { renderCard } = await import(location.origin + '/js/card/render.js');
  const { inlineImages } = await import(location.origin + '/js/card/export.js');

  const sheet = hydrateSheet({
    identity: { name: 'Thumb Test' },
    extras: { memeLink: 'https://youtu.be/dQw4w9WgXcQ', memeNote: 'the dog' },
  });
  const model = buildCardModel(sheet);
  const el = document.createElement('div');
  el.className = 'character-card';
  document.body.appendChild(el);

  const cfg = { ...sheet.cardConfig, layout: 'vertical', theme: 'default' };

  renderCard(el, model, cfg, new Map());
  const withoutImages = {
    thumbs: el.querySelectorAll('.cc-link-thumb').length,
    text: el.querySelector('.cc-link-value')?.textContent || '',
  };

  const urls = collectImageUrls(model);
  const images = await inlineImages(urls);
  renderCard(el, model, cfg, images);
  const src = el.querySelector('.cc-link-thumb')?.getAttribute('src') || '';

  el.remove();
  return {
    collected: urls,
    withoutImages,
    inlinedCount: images.size,
    thumbIsData: src.startsWith('data:image/'),
    thumbLen: src.length,
  };
});

record('the thumbnail URL is collected for inlining',
  card.collected.includes('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'), card.collected.join(','));
record('inlining actually succeeds through the CSP', card.inlinedCount === 1, `${card.inlinedCount} inlined`);
record('an inlined thumbnail renders as a data: URL', card.thumbIsData, `${card.thumbLen} chars`);
// The degradation branch: no inlined image must mean no <img> at all, never an
// empty frame, and the note must survive on its own.
record('no image map → no <img> element', card.withoutImages.thumbs === 0, `${card.withoutImages.thumbs}`);
record('no image map → the note still prints', card.withoutImages.text === 'the dog', card.withoutImages.text);

// ── Report ───────────────────────────────────────────────────────────────────

await browser.close();

let failed = 0;
for (const s of steps) {
  if (!s.ok) failed++;
  console.log(`${s.ok ? 'PASS' : 'FAIL'}  ${s.name}${s.detail ? `  (${s.detail})` : ''}`);
}
console.log(`\nconsole errors: ${errors.length}`);
errors.forEach(e => console.log('  ' + e));

const ok = failed === 0 && errors.length === 0;
console.log(`\n${ok ? 'PASS' : 'FAIL'} — ${failed} step(s), ${errors.length} console error(s)`);
process.exit(ok ? 0 : 1);
