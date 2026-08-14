# Brief — Character Sheet export is the payoff but themes/layouts/high-res are decoys, nine collected fields never reach the card, and there is no shareable link to aggregate into a team view

Started 2026-08-08 10:16. Maintained by the `task` skill; read by `debrief` and `writeup`.

## Problem

Character Sheet export is the payoff but themes/layouts/high-res are decoys, nine collected fields never reach the card, and there is no shareable link to aggregate into a team view

<!-- What was wrong *before*. The symptom someone actually experienced, not the
     absence of the solution. debrief opens its deck on this, so vagueness here
     costs a slide later. -->

## Approach

Fix the broken promises first, then make the export the thing the app is actually for.
The card stops being a canvas drawing and becomes real DOM: a theme is a set of `--c-*`
custom properties, a layout is a width/height/column preset, and every content block
carries a priority so a fixed-size preset can drop the least important thing rather
than clip it. That single change is what makes the rest cheap — PNG is the same element
serialised into an SVG `foreignObject` and rasterised at 1×/2×/3×, PDF is the same
element under `@media print` (so text stays vector and selectable), and the element in
the modal *is* the element exported, so the preview cannot lie.

Sharing then follows without a backend: the sheet gzips into a URL fragment, which
never leaves the browser in a request. That claim is what the whole design rests on, so
the two-truths answer is stripped *at the encoder* — replaced with a pre-shuffled
`statements` array — rather than merely not rendered. The team half reuses the same
mechanism: a roster is one gzip window over several sheets in a `party.html#r=`
fragment, and `js/party/analyze.js` derives overlaps as pure functions so the
arithmetic can be checked against hand-computed answers instead of eyeballed.

## Rejected

**Refactoring `js/card.js` into a canvas block engine** rather than deleting it. It
would have preserved the measure/draw synchronisation gotcha that caused every layout
bug in the file, kept typography capped at what `fillText` can do (no wrapping, no
multicol, no real font stacks), and still needed a second code path for the PDF. The
841 lines went instead.

**A Convex-backed team roster** for the party board. It needs auth, ownership rules,
and a deletion story for other people's data — and it would have broken the "nothing is
uploaded" claim that the export/share design had already established. A hash payload
keeps that claim true for rosters too, at the cost of the roster living only in whoever
holds the link.

**A third-party QR service** (`api.qrserver.com`). The share URL contains the person's
own answers, so handing it to an external endpoint to draw a QR would leak exactly what
the fragment design exists to protect. Hand-rolled a self-contained encoder instead and
verified it against ISO/IEC 18004 plus two independent decoders.

## Decisions

<!-- Appended by: brief.sh note "<what you learned>" -->

- `2026-08-08 10:20` CSP img-src omits media.rawg.io, cdn.myanimelist.net, image.tmdb.org, cdn.simpleicons.org — every media image and console icon is blocked in production, so the exported card has never shown an avatar or media grid. Fetch-to-dataURL also needs these in connect-src.

- `2026-08-08 10:20` Renderer decision: replace canvas with DOM+CSS. Themes become CSS custom-property sets, layouts become grid presets, PNG via foreignObject rasterization at 1x/2x/3x, PDF via @media print (vector, selectable text). Rejected: refactoring card.js into a canvas block engine — it keeps the measure/draw sync gotcha and caps typography.

- `2026-08-08 10:20` Privacy: QR must be generated locally, not via api.qrserver.com — the share URL carries the person's answers, so handing it to a third-party QR service would leak them. Requires a self-contained QR encoder.

- `2026-08-08 10:40` QR encoder verified against ISO/IEC 18004 + two independent decoders, not eyeballed. Format-info bit strings match Table C.1 for all 8 masks; RS generator degree-7 matches reference alpha exponents (0,87,229,146,149,238,102,21). Fuzzed 140 payloads covering every version 1-40 including exact-capacity boundaries: zxing-cpp (engine behind most phone scanners) decodes 140/140. OpenCV's detector fails ~6/25 on realistic links, but segno's output fails the SAME strings at the same masks -- that is an OpenCV detector limit, not an encoder bug. Do not 'fix' the encoder in response to an OpenCV failure.

- `2026-08-08 10:40` Share-link QR density: a realistic sheet (name/role/city/two-truths/hobbies/games) gzips to a 414-721 char URL, landing at QR version 13-19 = 69-93 modules. That is near the practical limit for scanning off a laptop screen at card size, and it grows with sheet length. Hence qrModuleCount() and a hard cap in the UI: past ~v20 show the link/copy button instead of a QR nobody can scan. First-meeting use case is phone-scans-screen, so this matters more than it would for print.

- `2026-08-08 11:12` Right-edge text clipping in the slack preset was a harness artifact, not a renderer bug: shot.mjs screenshotted the element inside card.html, whose .reader container is max-width 1240px and clips a 1600px card. The real export (cardToPngBlob rasterises a detached clone) is clean at 1600x900. Deleted shot.mjs; visual checks now go through .forge/export-shot.mjs so what is inspected is what ships.

- `2026-08-08 11:23` Moved theme/size/scale out of the builder step into the card modal. The builder previewed nothing, so picking a theme there was guessing; the controls now sit beside the card they change. The card element in the modal IS the element exported — preview fitting is a CSS transform, which layout ignores, so offsetWidth stays at the preset's real pixel width.

- `2026-08-08 11:23` Namespaced the modal's chips data-card-theme / data-card-layout. The old handler matched a bare [data-theme], which also matches <html data-theme> set by the header kit's visitor theme — so any unhandled click in the app reassigned the card theme.

- `2026-08-08 11:23` Retired js/card.js (841 lines of canvas), js/themes.js and js/share.js. The measureCard/drawBody sync gotcha and the jsPDF CDN dependency go with them.

- `2026-08-08 11:23` Defect found while wiring: index.html CSP frame-src lacked blob:, so the intro-slide preview iframe in the card modal had never rendered — it was a blocked frame, not a slow one.

- `2026-08-08 11:23` Defect: #card-print-root only got display:block inside @media print, with no screen rule — so after any print a full A4 card sat visible at the bottom of the page. afterprint does not fire when the dialog is dismissed, so it stayed.

- `2026-08-08 11:23` Defect: printCard cloned the card with its id intact, putting a second #export-card in the document; getElementById after a print resolved to whichever came first.

- `2026-08-08 11:23` Defect: the deck and the presenter script both shuffled two-truths with Math.random(), so the card, deck and script each listed the statements in a different order and re-downloading moved the answer. Both now use getTwoTruths (seeded). The script also printed '*(this is the lie)*' inline next to the lie — now a folded <details>.

- `2026-08-08 11:23` Defect: intro slide 1 rendered 'Platform Engineer &middot; 9 years yrs' — esc() escaped the separator entity, and 'yrs' was appended to a free-text field already reading '9 years'.

- `2026-08-08 11:41` Party board (party.html + js/party.js + js/party/analyze.js) closes the 'find patterns within a team' half of the request. No backend: rosters travel as one gzipped hash payload (#r=), which beats N separate share payloads because teammates' sheets repeat each other heavily — measured 775 chars for 4 sheets vs 1563 as separate payloads.

- `2026-08-08 11:41` Rejected a Convex-backed team roster. It would need auth, ownership rules and a deletion story for other people's data — and the whole export/share design already established that nothing is uploaded. A hash payload keeps that claim true for rosters too.

- `2026-08-08 11:41` DEFECT (mine, caught by party-check): widestGap returned whole member objects, and a member holds its entire .sheet. That put two people's full sheets — including truth1/truth2/lie for anyone added from localStorage or a .json import — inside the analysis result, which is what summaryText serialises for pasting into Slack. Now returns names only.

- `2026-08-08 11:41` DEFECT (mine): shared items sorted by headcount alone, so 'PC — all four' outranked a game three people named. Sorted by category rank first; the CATEGORIES order already encoded the claim that a shared title is a conversation and a platform tick is a coincidence.

- `2026-08-08 11:41` DEFECT (mine): commonGround only read topGames/topAnime/topMovies, so replayGame and comfortRewatch titles were invisible to both the shared and solo lists — a game someone named as 'would replay blind' could not match anyone. Now included.

- `2026-08-08 11:41` DEFECT (real, found via a harness failure): pasting a roster link into an open party tab did nothing. A fragment-only navigation is same-document, so main() never re-ran. Added a hashchange listener; clearParty uses replaceState, which does not fire it, so clearing cannot re-trigger a load.

- `2026-08-08 11:41` Overlap grid is labelled in UTC, not the viewer's local time: a roster gets screenshotted and pasted, and a grid in the sender's local time is wrong for every reader. Working window is 09:00-18:00 local per person; bestTimeToPresent is free text so it is displayed on the roster and never computed with.

- `2026-08-08 11:41` offsetMinutes uses Intl longOffset rather than shortOffset: half-hour zones exist and 'GMT+5:30' must not round to +5. Asserted directly (Asia/Kolkata === 330).

- `2026-08-08 11:41` Verified: node .forge/party-check.mjs -> PASS, 56 checks, 0 console errors. Includes hand-computed overlap expectations (Santiago+Tokyo cannot both be in a 09-18 window, so best is 2 of 3), independent spot-checks of the 00:00 and 12:00 UTC cells, and two assertions that no answer field or raw sheet reaches the analysis output.

- `2026-08-08 11:47` docs/architecture.mmd rewritten: it still drew card.js as a Canvas renderer, which was deleted in this task. New diagram shows the three pages, the js/card pipeline, js/share, js/party/analyze.js, and the Worker. Regenerated architecture.svg (embedded in README).

- `2026-08-08 11:47` stream **card-renderer** done — Canvas replaced with DOM+CSS. 7 themes as --c-* token sets, 5 layout presets, priority-ranked blocks with measured fit-and-drop. Verified by fit-check across 35 theme×layout combos.

- `2026-08-08 11:47` stream **export-paths** done — PNG 1x/2x/3x via SVG foreignObject (real re-render, not upscale), vector PDF via @media print. NOT done: Slack-mrkdwn copy in present.js — the party summary emits mrkdwn but the single-card path does not.

- `2026-08-08 11:47` stream **share-link** done — card.html#s= gzip+base64url fragment, answers stripped at the encoder, local QR with a density cap. Extended to rosters (#r=) for the party board.

- `2026-08-08 11:47` stream **defects** done — All eight fixed, plus seven more found while wiring (CSP frame-src blob:, print-root leak, duplicate #export-card id, unseeded shuffle in deck+script, entity double-escape, and three party-board defects).

- `2026-08-14 09:51` Two framings, one field: legends.goldSaint is written by both the saint chips and the zodiac chips. goldSaintMode only relabels. This is why 'answer by birthday' is a full answer on the card rather than a lesser one — asserted in legends-check.

- `2026-08-14 09:51` 'No idea what any of this is' hides the chips instead of clearing goldSaint, so a mistaken tap is undoable. That moves the responsibility to legendFacts(), which drops the pick while mode is 'lost' — the same contract anime.waifuHusbandoSkip already used.

- `2026-08-14 09:51` The site's CSP blocked the feature. img-src already allowed i.ytimg.com but connect-src did not, so the card could fetch nothing to inline and a YouTube meme could never appear on an export. Found by app-check failing on console errors, not by reading.

- `2026-08-14 09:51` CSP resolution is deliberately asymmetric: index.html gets img-src https: (your own pasted URL, your own interview), card.html and party.html keep the tight allowlist (someone else's sheet must not make your browser call a host the sender chose). connect-src stays narrow on both.

- `2026-08-14 09:51` The twelve zodiac characters U+2648-2653 default to EMOJI presentation on macOS. CSS color computed to gold and the glyph rendered as a magenta emoji tile anyway. Fixed with a trailing U+FE0E on each symbol. Invisible in a diff, so legends-check asserts the selector is still there.

- `2026-08-14 09:51` Corrected mid-build: the Optimus Prime chip originally carried from:'not a Gundam', which printed on the chip and answered the question before it was asked. Changed to 'Transformers' — spotting the odd one out IS the joke; the card supplies the punchline after the pick.

- `2026-08-14 09:51` export-shot.mjs was passing an empty image map, so every shot it produced had no avatar and no thumbnail — the one script whose job is judging the export could not see the picture path at all. Now inlines first.

## Measured

All observed, none estimated.

- **841 lines** of canvas renderer deleted (`js/card.js`, via `git rm`), plus `js/themes.js`
  and `js/share.js`, and with them the jsPDF CDN dependency.
- **9 collected fields** never reached the card before this task; all now have a block in
  `buildCardModel` with a priority.
- **35 theme × layout combinations** rendered and measured by `.forge/fit-check.mjs`:
  `PASS — size 0, clipped 0, silent-drop 0`. "Silent-drop 0" means every dropped block is
  reported in the card footer rather than vanishing.
- **QR encoder: 140/140 payloads** decoded by zxing-cpp across versions 1–40 including
  exact-capacity boundaries. OpenCV's detector fails ~6/25 realistic links — but segno's
  output fails the *same* strings at the same masks, so that is an OpenCV detector limit,
  not an encoder bug.
- **Share-link density: 414–721 chars** for a realistic sheet → QR version 13–19 = 69–93
  modules, at the practical limit for scanning off a laptop screen. Hence the cap in
  `panel.js` that shows the link instead of an unscannable QR.
- **Roster payload: 775 chars for 4 sheets** vs **1563** as four separate payloads — one
  gzip window over the roster, because teammates' sheets repeat each other heavily.
- **56 checks** in `.forge/party-check.mjs`, including hand-computed overlap answers
  (Santiago UTC-4 and Tokyo UTC+9 cannot both sit in a 09:00–18:00 local window, so the
  best possible is 2 of 3) and independent spot-checks of the 00:00 and 12:00 UTC cells.
- **15 defects** fixed: the 8 scoped at the start, plus 7 found while wiring — 4 of those
  7 were mine, caught by the harness rather than by reading.
- **Registry:** `make validate-registry` → `✅ Registry valid — 70 sites, 52 domains,
  55 ports, 8 resources`.

## Open

1. **Slack-mrkdwn copy in `js/present.js`** — agreed scope, not built. The *party* summary
   emits Slack mrkdwn (`js/party.js → summaryText`), but the single-card path still has no
   "copy as mrkdwn" button. The party implementation is the pattern to follow, including
   the double-to-single asterisk conversion.
2. **Front/back card** — agreed scope, not started. The block-priority model in
   `js/card/model.js` is what makes it tractable: a back face is the blocks the front
   dropped, so it needs a layout preset with two faces and an export that emits both.
3. **The 09:00–18:00 working window is hardcoded** in `js/party/analyze.js`
   (`WORK_START_MIN`/`WORK_END_MIN`). Stated in the page's fineprint rather than
   configurable. Fine for the first-meeting use case; wrong for a team with a night shift.
4. **Roster durability is deliberately nil.** A party board exists only in whoever holds
   the link — no backend, by the decision under ## Rejected. If a team wants a persistent
   roster, that is a product decision that reopens auth and other-people's-data deletion.
5. **`docs/architecture.svg` is a generated artifact committed to the repo.** Regenerated
   here via `npx @mermaid-js/mermaid-cli`; there is no `make` target wiring it to
   `architecture.mmd`, so the next edit to the `.mmd` can silently leave it stale again —
   which is exactly how it got stale this time.

_Closed 2026-08-08 11:47._

_Closed 2026-08-08 11:48._

---

## Run — 2026-08-14 09:30

**Problem.** Add a Legends section (Saint Seiya gold saints, Gundam, retro fandom) and upgrade the meme field to a previewing two-slot picker

**Approach.** A 9th interview section, `legends`, sitting between Anime and Movies and
deliberately *not* gated behind `anime.watches` — Saint Seiya and Gundam are childhood
broadcast TV for a large audience that answers "Nah" to "do you watch anime". Ten
questions, mixing single-select chips (reusing the existing `data-choice` handler) with
free text (`data-field`), so the section needs no new event routing at all. The gold-saint
question exploits the fact that the twelve Gold Saints *are* the twelve zodiac signs: one
state field, two framings — an escape button reframes the same twelve chips from saint
names to plain zodiac signs, and picking one reveals which saint that makes you. The meme
field becomes a two-slot array with URL classification (YouTube / direct image / plain
link) driving a live thumbnail.

**Rejected: a `mecha` sub-branch inside the Anime section.** Cheaper — no new section, no
`getSectionFill` case, no dots-nav change — but it puts the questions behind the exact gate
that excludes the people most likely to have an answer. The "do you watch anime?" toggle
means *do you watch it now*; Saint Seiya is a memory, not a habit.

**Rejected: `extras.memes` as a clean array with no legacy fields.** The array is the right
shape, but `loadSaved` deep-merges saved localStorage over the blank sheet, and old share
links in the wild carry `extras.memeLink`. A bare rename silently drops the meme from every
existing sheet and every previously-shared card. Migration lives in `sheet.js` instead, on
the path both the live state and a decoded share link go through.

## Measured

- **54 assertions** in the new `.forge/legends-check.mjs`, all passing. Existing suites
  unchanged and still green: `app-check` 34, `party-check` 62, `fit-check` 35 theme×layout
  combos with 0 clipped and 0 silent drops.
- **1 pre-existing defect found by the work**: `.forge/export-shot.mjs` passed an empty
  image map, so the one script whose job is judging the real PNG export rendered every
  image — avatar included — as an empty frame.
- **1 CSP defect found by `app-check`, not by reading**: `connect-src` omitted
  `i.ytimg.com`, so a YouTube meme could never be inlined and would have exported as a hole.
- **2 defects found by looking at the rendered page** after the checks were green: zodiac
  glyphs drawn as colour emoji ignoring the gold palette, and the Optimus Prime chip
  spoiling its own joke. Neither was visible to a static read or to any assertion.
- Card model went from 11 to 12 blocks on the fixture; the `vertical` preset absorbed the
  Legends block and the thumbnail at 800×2083 with nothing dropped.

## Open

1. **The party board ignores `legends` entirely.** `js/party/analyze.js` has no category for
   a shared Gold Saint, Gundam or Saturday-morning hero — which is a shame, because those
   are better icebreakers than a shared platform tick. Out of scope here (the ask was
   questions, not party features) and it needs a `CATEGORIES` rank decision plus new
   expected values in `party-check.mjs`, which asserts exact overlaps.
2. **An arbitrary image-URL meme never reaches the card.** It previews in the interview
   (`img-src https:` on index.html) but cannot be inlined, because `connect-src` is narrow
   by design, so the card falls back to the note plus the link. Only YouTube memes get a
   thumbnail on the exported card. The fix is routing thumbnails through the existing
   Cloudflare Worker as a CORS-safe proxy — one host in the CSP, no wildcard — which means
   a worker change and a deploy.
3. **`i.ytimg.com` is an availability dependency for the card's thumbnail.** If YouTube
   changes that URL shape, the classifier silently produces a dead thumb; the graceful
   path means the card just loses the picture, so nothing alerts.
4. **Nine sections is getting long.** The interview was already ~5 minutes; Legends adds
   ten questions. Nothing measured this, and no one has been asked to fill it end to end.
   Worth watching whether people abandon at section 5.
5. **Not committed.** Every change is in the working tree only.

_Closed 2026-08-14 09:52._
