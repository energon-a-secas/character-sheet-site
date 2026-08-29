---
name: Character Sheet
description: Neorgon dark tool shell with a rotating per-section neon glow, a horizontal interview carousel, a Clerk auth modal, and a canvas-rendered RPG card export. All base suite tokens, plus eight section accents and a modal-based auth.
colors:
  bg: "#040714"
  surface-1: "rgba(255,255,255,0.03)"
  surface-2: "rgba(255,255,255,0.06)"
  border-subtle: "rgba(255,255,255,0.07)"
  border: "rgba(255,255,255,0.1)"
  border-strong: "rgba(255,255,255,0.22)"
  text-primary: "#f9f9f9"
  text-secondary: "#cacaca"
  text-muted: "rgba(255,255,255,0.55)"
  accent: "#0063e5"
  accent-bright: "#0080ff"
  glow-intro: "#22d3ee"
  glow-identity: "#818cf8"
  glow-gaming: "#34d399"
  glow-anime: "#f472b6"
  glow-movies: "#fbbf24"
  glow-hobbies: "#2dd4bf"
  glow-wildcards: "#a78bfa"
  glow-extras: "#fb923c"
typography:
  display:
    fontFamily: "'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "'Avenir Next', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "15px"
spacing:
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s6: "24px"
  s8: "32px"
components:
  section-arrow:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "50%"
  auth-modal-dialog:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  card-canvas:
    backgroundColor: "#040714"
    textColor: "{colors.text-primary}"
    rounded: "0"
---

# Design System: Character Sheet

## Overview

**This is the Neorgon suite shell with three deliberate deviations.** Read the root [DESIGN.md](../DESIGN.md) first; everything there holds unless noted below. The deviations are: a **rotating per-section glow**, a **horizontal interview carousel** instead of a scrolling page, and a **Clerk auth modal** instead of the inline auth sheet. The deliverable is a **canvas-rendered RPG card** the user exports.

Base tokens are identical to the suite (`#040714` void, glass surfaces, `#0063e5` accent, Avenir Next, 68px gradient header). What changes is layered on top.

## Deviations from the suite baseline

### 1. Per-section glow (`--section-glow`)

Unlike the one-accent suite rule, this tool defines **eight** glow accents, one per interview section, and swaps the live `--section-glow` variable as the user advances:

- intro `#22d3ee` (cyan) · identity `#818cf8` (indigo, default) · gaming `#34d399` (green) · anime `#f472b6` (pink) · movies `#fbbf24` (amber) · hobbies `#2dd4bf` (teal) · wildcards `#a78bfa` (violet) · extras `#fb923c` (orange).

The active glow tints focus states, section dots, selected chips, and `color-mix` borders (e.g. `.shelf-item--game img` borders mix the gaming glow). Blue `#0063e5` remains the action color for primary buttons; the glow is **ambient/contextual**, not the button color. This is a sanctioned exception to the One-Accent Rule, justified by the multi-section interview structure (mirrors the hub's per-card rainbow logic).

### 2. Horizontal carousel (`.section-wrapper` + `.section-arrow`)

The interview is one section at a time inside `.section-wrapper`, navigated by round `.section-arrow` buttons (`arrow-left` / `arrow-right`, 50% radius, surface-1 fill) plus dot nav with SVG ring progress. `nextSection()` / `prevSection()` are exposed on `window` and called from inline `onclick` (legacy pattern in this app). The page does not scroll through sections; it transitions between them.

### 3. Clerk auth **modal** (not the inline sheet)

Auth uses **Clerk** (publishable key in a `<meta name="clerk-publishable-key">`), mounted into a true modal: `.auth-modal` / `.auth-modal-backdrop` (blur 8px) / `.auth-modal-dialog`, opened by `.auth-toggle`. Clerk components mount into `#neorgon-signin-mount` and `#neorgon-user-mount`. A `.legacy-link-card` lets password-only Neorgon accounts link once. Header layout is **Pattern B** (`auth-toggle` gets `margin-left:auto`, `.header-home` gets `margin-left:8px`). This replaces the template's `.auth-panel` collapsible sheet.

### 4. Canvas card export

The payoff is `js/card.js → generateCard(state)`: an async canvas render (800px wide, dynamic height ≥900px) drawing background, header, stat boxes, body sections, socials, a collection grid, footer, and the chosen avatar. Export is PNG (`toDataURL`) or PDF (lazy jsPDF). All remote images (RAWG/TMDB/Jikan via the CF Worker) must load `crossOrigin: anonymous` or `toDataURL` throws. The card has its own theme system (`js/themes.js`: dark, light, cyberpunk, minimal, sunset, forest) independent of the site chrome. These themes style the **exported card only**, not the app UI.

## Backend note

Cloudflare Worker (`worker/worker.js`) at `charactersheet-api.neorgon.workers.dev` proxies RAWG, Jikan, and TMDB with CORS locked to the domain + localhost. The frontend always targets the deployed worker.

## Do's and Don'ts

### Do

- **Do** keep base suite chrome (header gradient, footer, font, blue primary) untouched; only layer the glow/carousel/modal on top.
- **Do** swap `--section-glow` per section and use `color-mix` for tints rather than hardcoding.
- **Do** preload remote images with `crossOrigin: anonymous` before any canvas export.

### Don't

- **Don't** convert the inline-sheet auth into use here, or vice versa convert this modal pattern into other tools; this Clerk modal is specific to character-sheet (and memes).
- **Don't** let card-export themes (cyberpunk/sunset/forest) leak into the app UI; they belong to the canvas only.
- **Don't** promote a section glow to the primary button color; blue stays the action color.
- Everything in the root DESIGN.md "Don't" list still applies.
