# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Recent Major Updates

**UI/UX Enhancement (Latest)**: Added comprehensive customization and sharing features:
- 6 card themes (dark, light, cyberpunk, minimal, sunset, forest) via `js/themes.js`
- 4 card layouts (vertical, horizontal, compact, social media) via `js/themes.js`
- Statistics dashboard with animated circular progress and achievements via `js/stats.js`
- 8 achievement types unlocked based on completion milestones
- Personality insights generated from user responses
- Enhanced sharing: native share API, QR code generation, high-res export via `js/share.js`
- See `IMPROVEMENTS.md` for comprehensive documentation

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

**Sections flow**: 7 interview sections (`SECTIONS` array in `data.js`) → card builder step (`state.showBuilder = true`) → card modal with canvas output. Navigation (`nextSection` / `prevSection`) is exposed on `window` and called from inline HTML `onclick`. Section progress is tracked by `currentSection` index.

**Rendering** (`js/render.js`): `render()` is the single re-render entry point. It checks `state.showBuilder` — if true, it dynamic-imports `builder.js` and delegates. Otherwise it calls `renderSection`, `renderProgressBar`, `renderNav`, `renderMediaShelf`. Section content is built via `innerHTML` strings with `escHtml()` for XSS safety. `data-*` attributes on DOM elements drive all event delegation.

**Events** (`js/events.js`): One delegated listener each for `input`, `click`, `keydown` on `document`. Routing is purely by `data-*` attributes (`data-field`, `data-toggle`, `data-choice`, `data-console`, `data-hobby`, `data-wildcard`, `data-escape`, `data-escape-wc`, `data-remove`, `data-avatar`, `data-highlight`, `data-dot`, `data-builder-opt`). Navigation functions and modal controls are exposed on `window` (`nextSection`, `prevSection`, `closeCardModal`, `downloadCard`, `downloadPDF`, `startOver`).

**RPG class assignment** (`js/data.js`): `getRPGClass(state)` iterates `RPG_CLASSES` in order and returns the first match. The classes are: Digital Ronin, Screen Sage, Pixel Paladin, Cultural Explorer, Creative Wanderer, Otaku Guardian, Cinephile Knight, Wildcard Rogue, Balanced Adventurer (always matches last). Matching uses helper `count*` functions that tally filled fields per section.

**Section fill progress** (`js/data.js → getSectionFill`): Returns 0–1 ratio per section key. Used to render SVG ring progress on section dot nav buttons.

**Card generation** (`js/card.js`): `generateCard(state)` is async — it preloads all images (avatar + selected media) into a `Map` using `crossOrigin: anonymous`, then measures total canvas height via `measureCard`, then draws sequentially: background, header, stat boxes, body sections (hobbies, gaming/anime two-col, movies, wildcards), socials, collection grid, footer, avatar. Card is 800px wide; height is dynamic (minimum 900px). Export: PNG via `canvas.toDataURL` or PDF via lazy-loaded jsPDF CDN.

**Avatar selection**: Drawn from all API-fetched images across the interview (anime chars, waifu/husbando, anime series, games, movies). User picks one in the builder step via `state.cardConfig.avatarId`. Positioned at fixed coords (50, 55, 110×150px) on the canvas.

**Media search backend** (`worker/worker.js`): Cloudflare Worker proxying three external APIs:
- Games: RAWG (`env.RAWG_API_KEY`)
- Anime + characters: Jikan (MyAnimeList, no key required)
- Movies/series: TMDB (`env.TMDB_READ_TOKEN`)

CORS is restricted to `charactersheet.neorgon.com` and localhost ports 8888/8889. Results are cached for 5 minutes (`Cache-Control: public, max-age=300`).

**Search UX**: Inputs use `data-search-type` and `data-state-key` and `data-max` attributes. `handleSearch` is debounced 350ms. Results are rendered as `data-result` JSON on each item element; `handleResultSelect` parses and merges into state. Single-pick fields store an object directly; multi-pick fields store arrays with a max cap enforced on selection.

**Wildcard skip pattern**: Each wildcard has `{ value, skip }`. `skip` is either `''`, `'cant'`, or `'skip'`. When skipped, the textarea is disabled and the value is cleared. The canvas only renders wildcards where `value && !skip`.

## Key gotchas

- Images from the RAWG/TMDB/Jikan APIs are cross-origin. `canvas.toDataURL()` will throw if any image loaded without `crossOrigin: anonymous`. The worker is the safe proxy for CORS — direct calls to these APIs from the frontend are not made.
- `measureCard` must stay in sync with `drawBody` — if you add a new canvas section, add its measurement counterpart or the card will clip.
- `render.js` uses a `lastRenderedSection` module-level variable to suppress entrance animation when re-rendering the same section. `lastNavigationDirection` (1 = forward, -1 = backward) drives directional CSS classes (`section-enter-right` / `section-enter-left`).
- The builder step is not a section index — it's a separate `state.showBuilder` flag. Dot nav clicking sets `state.showBuilder = false` before changing section.

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
