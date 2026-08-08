// The read-only card page (card.html).
//
// Decodes a sheet from the URL fragment and renders the same card the author
// sees. It shares the model and renderer with the app, so a shared card cannot
// drift from the exported one.
//
// This page never writes: no localStorage, no Convex, no analytics. It is handed
// someone else's data and its only job is to display it.

// sheet.js, not state.js: the shape without the Convex client. This page's CSP
// blocks the CDN Convex loads from, and it has no backend to talk to anyway.
import { hydrateSheet } from './sheet.js';
import { buildCardModel, collectImageUrls, getTwoTruths } from './card/model.js';
import { renderCard } from './card/render.js';
import { inlineImages, downloadPng, printCard, slugify } from './card/export.js';
import { readSheetFromLocation, buildRosterUrl } from './share/link.js';
import { $ } from './utils.js';

/** A prompt aimed at the reader, built from what the sheet actually contains. */
function icebreaker(sheet, model) {
  const name = sheet.identity.name || 'they';
  const candidates = [];

  if (getTwoTruths(sheet).length) {
    candidates.push(`Guess which of the three statements ${name} made up — then ask.`);
  }
  if (sheet.intro.currentlyLearning) {
    candidates.push(`${name} is currently learning ${sheet.intro.currentlyLearning}. Ask how it is going.`);
  }
  if (sheet.intro.careerHighlight) {
    candidates.push(`Ask about the work ${name} is proudest of.`);
  }
  const games = sheet.gaming.topGames || [];
  if (games.length) {
    candidates.push(`Ask why ${games[0].name} made the list.`);
  }
  if (model.blocks.some(b => b.id === 'takes')) {
    candidates.push(`There is a hot take on this card. Disagree with it politely.`);
  }

  return candidates[0] || `Ask ${name} which part of this card they would change first.`;
}

async function main() {
  const status = $('reader-status');
  const partial = await readSheetFromLocation();

  if (!partial) {
    status.hidden = true;
    $('reader-empty').hidden = false;
    return;
  }

  // Fill the sparse decoded sheet out to the full shape — the model reads nested
  // arrays directly, and a share link omits everything that was empty.
  const sheet = hydrateSheet(partial);
  const model = buildCardModel(sheet);

  const cardEl = $('reader-card');
  // Render once without images so the card appears immediately, then again with
  // the artwork inlined. Inlining is also what makes export work at all.
  renderCard(cardEl, model, sheet.cardConfig);

  status.hidden = true;
  $('reader-card-wrap').hidden = false;
  $('reader-icebreaker').textContent = icebreaker(sheet, model);

  const name = sheet.identity.name || 'character';
  document.title = `${name} — Character Sheet`;

  const images = await inlineImages(collectImageUrls(model));
  if (images.size) renderCard(cardEl, model, sheet.cardConfig, images);

  $('reader-png').addEventListener('click', () => downloadPng(cardEl, name, 2));
  $('reader-print').addEventListener('click', () => printCard(cardEl));

  // Carry this card into the party board, so it opens with one member already on
  // the roster rather than an empty box the reader has to re-paste into. Set
  // after the card renders: it costs a gzip, and the card matters more.
  const party = $('reader-party');
  if (party) party.href = await buildRosterUrl([sheet]);
}

main().catch((err) => {
  console.error(err);
  $('reader-status').hidden = true;
  $('reader-empty').hidden = false;
});
