# Product

## Register

product

## Users

Members of remote and distributed teams who want teammates to actually know how to work with them. Someone fills in an RPG-style "character sheet" about themselves (timezone, working vibes, how to run meetings that stick, their gaming/anime/movie taste) and shares the resulting card. Readers are their colleagues, scanning for the practical bits: when this person is online and how to present to them.

## Product Purpose

Character Sheet turns "how I like to work" into a shareable, game-styled card. The job: capture identity and working preferences through a friendly multi-step interview, assign a playful RPG class, and export a polished card (PNG/PDF, QR, native share) the user can drop in Slack or a team wiki. Success is a finished, shared card that makes a remote teammate easier to collaborate with.

## Brand Personality

Inherits the Neorgon voice (direct, builder-to-builder, generous) with an extra layer of **playful RPG flavor**: class names (Digital Ronin, Screen Sage, Pixel Paladin), stat boxes, achievements. Warm and a little gamified, never childish. Three words: capable, generous, playful.

## Anti-references

All Neorgon suite anti-references (see root `PRODUCT.md`), plus: corporate HR "personality test" blandness, and over-gamified UIs that bury the practical working-preferences content under XP bars and noise. The game framing serves the content; it never replaces it.

## Design Principles

1. **Interview, don't form-dump.** One section at a time via a horizontal carousel; progress is always visible.
2. **The card is the payoff.** Every step feeds a canvas card the user will actually share; the builder step lets them theme and pick an avatar before export.
3. **Auth only to save.** The full interview works without login; Clerk auth gates persistence and cross-device sync (with one-time legacy-account linking).
4. **Earned game flavor.** RPG class and achievements are seasoning derived from real answers, not gates.
5. Inherits all root suite principles.

## Accessibility & Inclusion

WCAG 2.2 AA targets from the suite. Carousel `.section-arrow` controls and the auth modal carry `aria-label`; the modal traps focus and closes on backdrop/Escape. Honors `prefers-reduced-motion` for section transitions and the achievement/progress animations.
