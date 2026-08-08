# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
make serve    # Start dev server at http://localhost:8814
make kill     # Kill the server on port 8814
```

ES modules require an HTTP server — `file://` will not work.

The worker is a Cloudflare Worker deployed at `https://charactersheet-api.neorgon.workers.dev`. To develop the worker locally you need Wrangler and API keys (see `worker/` directory). The frontend `js/api.js` always points at the deployed worker URL regardless of environment.

## Architecture

Modular ES module app. `js/app.js` is the entry point — it calls `loadSaved`, `render`, and `bindEvents`, then exposes `randomFill` on `window`.

**State** (`js/state.js`): Single exported `state` object with sections: `identity`, `gaming`, `anime`, `movies`, `hobbies`, `wildcards`, `extras`, plus `showBuilder` flag and `cardConfig`. Persisted to `localStorage` key `player-card` via `save(state)`. `loadSaved` uses `deepMerge` so new fields added to state aren't clobbered by older saved data.

**Sections flow**: 8 interview sections (`SECTIONS` array in `data.js`) → card builder step (`state.showBuilder = true`) → card modal (`js/card/panel.js`). Navigation (`nextSection` / `prevSection`) is exposed on `window` and called from inline HTML `onclick`. Section progress is tracked by `currentSection` index.

**Rendering** (`js/render.js`): `render()` is the single re-render entry point. It checks `state.showBuilder` — if true, it dynamic-imports `builder.js` and delegates. Otherwise it calls `renderSection`, `renderProgressBar`, `renderNav`, `renderMediaShelf`. Section content is built via `innerHTML` strings with `escHtml()` for XSS safety. `data-*` attributes on DOM elements drive all event delegation.

**Events** (`js/events.js`): One delegated listener each for `input`, `click`, `keydown` on `document`. Routing is purely by `data-*` attributes (`data-field`, `data-toggle`, `data-choice`, `data-console`, `data-hobby`, `data-wildcard`, `data-escape`, `data-escape-wc`, `data-remove`, `data-avatar`, `data-highlight`, `data-dot`, `data-builder-opt`, plus the card modal's `data-card-layout` / `data-card-theme` / `data-card-scale` / `data-card-action`). Navigation functions are exposed on `window` (`nextSection`, `prevSection`, `closeCardModal`, `startOver`).

The card modal's chips are namespaced `data-card-*` on purpose: a bare `[data-theme]` selector also matches `<html data-theme>`, which the header kit sets for a visitor's chosen theme, so it swallowed unrelated clicks.

**RPG class assignment** (`js/data.js`): `getRPGClass(state)` iterates `RPG_CLASSES` in order and returns the first match. The classes are: Digital Ronin, Screen Sage, Pixel Paladin, Cultural Explorer, Creative Wanderer, Otaku Guardian, Cinephile Knight, Wildcard Rogue, Balanced Adventurer (always matches last). Matching uses helper `count*` functions that tally filled fields per section.

**Section fill progress** (`js/data.js → getSectionFill`): Returns 0–1 ratio per section key. Used to render SVG ring progress on section dot nav buttons.

**Card rendering** (`js/card/`): DOM + CSS, not canvas. The pipeline is one direction:

- `model.js` → `buildCardModel(state)` returns `{ blocks, header }`. Every block carries a `priority` (`PRIORITY` in the same file) so a fixed-size layout can decide what to drop.
- `presets.js` → `CARD_THEMES` (7) and `CARD_LAYOUTS` (5). A theme is **only** a set of `--c-*` token values, so adding one is a data edit with no renderer change. A layout is a width, a height or `minHeight`, a `fit` of `fixed` | `flow`, and a column count.
- `render.js` → `renderCard(el, model, cfg, images)` writes the theme tokens and layout size onto the element, builds the body HTML, then runs `fitCard` for `fixed` layouts: it removes lowest-priority blocks until the content stops overflowing and stamps a `.cc-dropped` note into the card's footer. Returns `{ layout, dropped }`.
- `export.js` → PNG by serialising the card into an SVG `<foreignObject>` and rasterising at 1×/2×/3× (a genuine re-render at scale, not a bitmap upscale); PDF by cloning into `#card-print-root` and calling `window.print()` against the `@media print` block in `css/card.css`, so text stays vector and selectable.
- `panel.js` → the card modal: theme/size/scale chips, the export buttons, and the share link + QR. Owns the only card instance in the app.

`css/card.css` must stay self-contained — no `var()` references to app tokens, no external `@font-face`. It is serialised verbatim into the export SVG, where the page's other stylesheets do not exist.

**Avatar selection**: Drawn from all API-fetched images across the interview (anime chars, waifu/husbando, anime series, games, movies). Options come from `js/card/media.js`; the user picks one in the builder step via `state.cardConfig.avatarId`.

**Media search backend** (`worker/worker.js`): Cloudflare Worker proxying three external APIs:
- Games: RAWG (`env.RAWG_API_KEY`)
- Anime + characters: Jikan (MyAnimeList, no key required)
- Movies/series: TMDB (`env.TMDB_READ_TOKEN`)

CORS is restricted to `charactersheet.neorgon.com` and localhost ports 8888/8889. Results are cached for 5 minutes (`Cache-Control: public, max-age=300`).

**Search UX**: Inputs use `data-search-type` and `data-state-key` and `data-max` attributes. `handleSearch` is debounced 350ms. Results are rendered as `data-result` JSON on each item element; `handleResultSelect` parses and merges into state. Single-pick fields store an object directly; multi-pick fields store arrays with a max cap enforced on selection.

**Wildcard skip pattern**: Each wildcard has `{ value, skip }`. `skip` is either `''`, `'cant'`, or `'skip'`. When skipped, the textarea is disabled and the value is cleared. `buildCardModel` only includes wildcards where `value && !skip`.

**Sharing** (`js/share/`): `link.js` compresses the pruned sheet (gzip → base64url) into a `card.html#s=…` fragment, which never leaves the browser as part of a request — nothing is uploaded. `encodeSheet` replaces `truth1`/`truth2`/`lie` with a pre-shuffled `statements` array, so the answer is *absent* from the link rather than merely unrendered. `qr.js` generates the QR locally for the same reason; a realistic dense sheet is ~1400 characters, past scannable density, so `panel.js` falls back to showing the link when `qrModuleCount` exceeds its limit. `encodeRoster` / `buildRosterUrl` do the same for several sheets at once as a `party.html#r=…` fragment — one gzip window over the whole roster, because teammates' sheets repeat each other heavily (measured: 775 chars for four sheets vs 1563 as separate payloads). Every sheet in a roster goes through the same answer-stripping.

**Party board** (`party.html`, `js/party.js`, `js/party/analyze.js`): takes several sheets — pasted card links, imported `.json`, or the one in this browser's localStorage — and reports where they overlap. `analyze.js` is pure functions over hydrated sheets: timezone overlap, shared titles/hobbies/genres, class composition, and icebreaker prompts built from what people actually filled in. No backend; the roster travels in the URL fragment like a single card does.

Two rules the module header states and the checks enforce: nothing may read the two-truths answer (a sheet from a share link has `intro.statements` and no answer at all), and a "shared interest" must be genuinely shared — a row with one owner is a bug, not a weak match. `CATEGORIES` order is load-bearing: it ranks a shared game title above a ticked platform, and `commonGround` sorts by that rank before headcount.

## Key gotchas

- Images from the RAWG/TMDB/Jikan APIs are cross-origin. Both export paths need them as `data:` URLs — an SVG `foreignObject` cannot load external images at all, and a canvas holding a cross-origin image is tainted. `inlineImages` in `js/card/export.js` fetches and converts them; the worker is the CORS-safe proxy.
- The card element in the modal **is** the element exported. Preview fitting is a CSS `transform`, which layout ignores, so `offsetWidth` stays at the preset's true pixel width. Never resize the card to fit a container.
- CSS multicol (`slack`, `social`) overflows **horizontally**, not vertically — `scrollHeight` never changes. `fitCard` checks both axes for this reason.
- `card.html` (the shared-card reader) imports `js/sheet.js`, not `js/state.js`: that page's CSP blocks the CDN Convex loads from, and it has no backend to talk to. `party.html` does the same.
- Anything returned from `js/party/analyze.js` is serialised into the Slack summary. A `member` holds its whole `sheet`, so a function that returns members rather than names leaks every field of those sheets — including the two-truths answer of anyone added from localStorage or a `.json` import.
- The overlap grid is labelled in **UTC**, not the viewer's local time: a roster gets screenshotted and pasted, and a grid in the sender's local time is wrong for every reader. `offsetMinutes` uses Intl `longOffset`, not `shortOffset` — half-hour zones exist and `GMT+5:30` must not round to +5.
- A roster link pasted into an already-open `party.html` is a **same-document** navigation: no reload, so `main()` does not re-run. `js/party.js` handles `hashchange` for this. `clearParty` uses `replaceState`, which deliberately does not fire it.
- `render.js` uses a `lastRenderedSection` module-level variable to suppress entrance animation when re-rendering the same section. `lastNavigationDirection` (1 = forward, -1 = backward) drives directional CSS classes (`section-enter-right` / `section-enter-left`).
- The builder step is not a section index — it's a separate `state.showBuilder` flag. Dot nav clicking sets `state.showBuilder = false` before changing section.

## Checks

Two Node + Playwright scripts under `.forge/`, both needing `make serve` on 8814. They exist because every card-export bug so far was invisible to a static read: a preset that renders at the wrong height, content clipped by `overflow:hidden`, a button bound to a function that no longer exists.

```bash
node .forge/fit-check.mjs           # presets render at declared size; nothing clipped; 35 theme×layout combos
node .forge/app-check.mjs           # the real app: modal, every chip, every export button, share link, deck/script parity
node .forge/party-check.mjs         # party board: overlap maths against hand-computed answers, plus the page wiring
node .forge/export-shot.mjs slack default 1   # writes the actual PNG export for eyeballing
node .forge/modal-shot.mjs slack default      # screenshots the modal as a user sees it
node .forge/party-shot.mjs 1400               # screenshots the party board with the 4-person fixture
```

All three exit non-zero on failure and treat unexpected console errors as failures. `party-check.mjs` asserts exact expected overlaps from `.forge/party-fixture.mjs` (Santiago + Tokyo cannot both sit in a 09:00–18:00 window, so the best is 2 of 3) rather than checking the output merely looks plausible — the failure mode for that page is confident, wrong arithmetic. Use `export-shot.mjs`, **not** a page screenshot, to judge a wide preset — the page container clips a 1600px card, so a screenshot shows truncation the export does not have.

## Auth & Sheets (Convex + Clerk)

Optional Convex-backed **multi-sheet** storage with **Clerk** (shared [`neorgon-auth-client`](../neorgon-auth-client/) pattern). JWT template name in Clerk must be `convex` (enable the Clerk → Convex integration in the Clerk dashboard).

**Setup:** Run `npm install && npx convex dev` from the project root; set `CONVEX_URL` in `js/state.js`. In Clerk, add allowed origins for `http://localhost:8814` and `https://charactersheet.neorgon.com`. Publishable key lives in `<meta name="clerk-publishable-key">` in `index.html`; auth UI module is vendored at `js/vendor/neorgon-auth.js` (copy from `neorgon-auth-client` when updating).

**Auth flow:** Clerk session + `convex.setAuth` with Clerk’s `convex` JWT. Sign-in opens in a **modal** (`#authModal`); backdrop, **Close**, and **Escape** dismiss it; it closes automatically after a successful sign-in. Header button toggles the modal. In Clerk → **User & Authentication**, enable **Email** and **Username** so people can register and sign in with either (placeholders can be tuned via `signInProps` in `events.js`). `state._user` is `{ label }` when signed in (session-only, not in `player-card` localStorage). `state._sheetId` / `state._sheetName` track the active sheet.

**Sheets:** Rows keyed by `ownerSubject` (JWT `subject`). `convex/sheets.ts` — `list` (authenticated), `save`, `remove`. Sheets bar appears when signed in.

**Convex files:** `convex/schema.ts` (sheets), `convex/auth.config.ts` (Clerk issuer), `convex/sheets.ts` (CRUD).

## Navigation

- **Keyboard:** Left/Right arrow keys navigate between sections (disabled when focused on input/textarea/select)
- **Visual arrows:** `.arrow-left` / `.arrow-right` buttons flanking the container; hidden on mobile (≤768px)
- Left arrow hidden at section 0; right arrow hidden on card builder step
- Arrow visibility is updated by `updateArrows(state)` called at the end of every `render()` call

## Your Story — Expanded Fields

The `intro` section now has three visual sub-groups:
- **Career:** jobTitle, yearsExperience, prevCompany, city, careerHighlight
- **Personal:** motto, unknownFact, currentlyLearning
- **Fun Facts:** freeTimeChoice, freeTimeCustom, truth1, truth2, lie
