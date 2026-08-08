// Renders the card model to DOM. No canvas, no measure/draw pair to keep in sync:
// the browser lays the card out, and `fitCard` reads real measured heights to decide
// what a fixed-size preset can keep.

import { escHtml } from '../utils.js';
import { getTheme, getLayout } from './presets.js';

/** Write theme tokens + layout size onto the card root. */
function applyPreset(el, themeId, layoutId) {
  const theme = getTheme(themeId);
  const layout = getLayout(layoutId);

  for (const [prop, val] of Object.entries(theme.tokens)) {
    el.style.setProperty(prop, val);
  }
  el.style.width = `${layout.width}px`;
  el.dataset.layout = layout.id;
  el.dataset.theme = theme.id;
  el.style.setProperty('--card-cols', String(layout.columns));

  // Both branches set *both* properties. Clearing minHeight matters: a flow
  // layout leaves it behind, and any fixed preset shorter than that floor then
  // renders at the floor instead of its own height — silently, since the element
  // no longer overflows and fitCard finds nothing to drop.
  if (layout.fit === 'fixed') {
    el.style.height = `${layout.height}px`;
    el.style.minHeight = '0';
  } else {
    el.style.height = 'auto';
    el.style.minHeight = `${layout.minHeight}px`;
  }
  return layout;
}

function blockHtml(b, imageSrc) {
  switch (b.kind) {
    case 'header': return headerHtml(b, imageSrc);
    case 'facts': return factsHtml(b);
    case 'truths': return truthsHtml(b);
    case 'columns': return columnsHtml(b);
    case 'quote': return quoteHtml(b);
    case 'tags': return tagsHtml(b);
    case 'link': return linkHtml(b);
    case 'socials': return socialsHtml(b);
    case 'media': return mediaHtml(b, imageSrc);
    default: return '';
  }
}

function headerHtml(b, imageSrc) {
  const av = b.avatar;
  const src = av ? imageSrc(av.image) : '';
  const meta = [
    b.role && `<div class="cc-role">${escHtml(b.role)}</div>`,
    b.prevCompany && `<div class="cc-prev">Previously at ${escHtml(b.prevCompany)}</div>`,
  ].filter(Boolean).join('');

  const stamps = [
    b.place && `<span class="cc-stamp">${escHtml(b.place)}</span>`,
    b.utcOffset && `<span class="cc-stamp cc-stamp--accent">${escHtml(b.utcOffset)}</span>`,
    b.localTime && `<span class="cc-stamp">${escHtml(b.localTime)} local</span>`,
  ].filter(Boolean).join('');

  return `<header class="cc-header" data-block="header">
    <div class="cc-avatar">
      ${src ? `<img src="${escHtml(src)}" alt="${escHtml(av.label)}">` : '<div class="cc-avatar-empty" aria-hidden="true"></div>'}
    </div>
    <div class="cc-ident">
      <h1 class="cc-name">${escHtml(b.name)}</h1>
      <div class="cc-class">${escHtml(b.rpgClass)}</div>
      ${meta}
      ${stamps ? `<div class="cc-stamps">${stamps}</div>` : ''}
      ${b.description ? `<p class="cc-bio">${escHtml(b.description)}</p>` : ''}
    </div>
  </header>`;
}

function factsHtml(b) {
  return `<section class="cc-block cc-facts" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">${escHtml(b.title)}</h2>
    <dl class="cc-fact-list">
      ${b.items.map(i => `
        <div class="cc-fact">
          <dt>${escHtml(i.label)}</dt>
          <dd>${escHtml(i.value)}</dd>
        </div>`).join('')}
    </dl>
  </section>`;
}

function truthsHtml(b) {
  return `<section class="cc-block cc-truths" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">${escHtml(b.title)}</h2>
    <div class="cc-hint">${escHtml(b.hint)}</div>
    <ol class="cc-truth-list">
      ${b.items.map(t => `<li>${escHtml(t)}</li>`).join('')}
    </ol>
  </section>`;
}

function columnsHtml(b) {
  return `<section class="cc-block cc-columns" data-block="${escHtml(b.id)}">
    ${b.columns.map(c => `
      <div class="cc-col cc-col--${escHtml(c.key)}">
        <h2 class="cc-title">${escHtml(c.title)}</h2>
        ${c.list.length ? `<ul class="cc-list">${c.list.map(n => `<li>${escHtml(n)}</li>`).join('')}</ul>` : ''}
        ${c.extras.length ? `<dl class="cc-fact-list cc-fact-list--tight">
          ${c.extras.map(e => `<div class="cc-fact"><dt>${escHtml(e.label)}</dt><dd>${escHtml(e.value)}</dd></div>`).join('')}
        </dl>` : ''}
      </div>`).join('')}
  </section>`;
}

function quoteHtml(b) {
  return `<figure class="cc-block cc-quote" data-block="${escHtml(b.id)}">
    <blockquote>${escHtml(b.text)}</blockquote>
    ${b.source ? `<figcaption>— ${escHtml(b.source)}</figcaption>` : ''}
  </figure>`;
}

function tagsHtml(b) {
  return `<section class="cc-block cc-tags-block" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">${escHtml(b.title)}</h2>
    ${b.tags.length ? `<div class="cc-tags">${b.tags.map(t => `<span class="cc-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
    ${b.note ? `<dl class="cc-fact-list cc-fact-list--tight"><div class="cc-fact"><dt>${escHtml(b.note.label)}</dt><dd>${escHtml(b.note.value)}</dd></div></dl>` : ''}
  </section>`;
}

function linkHtml(b) {
  const shown = b.note || b.url;
  return `<section class="cc-block cc-link" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">${escHtml(b.title)}</h2>
    <div class="cc-link-value">${escHtml(shown)}</div>
    ${b.note && b.url ? `<div class="cc-link-url">${escHtml(b.url)}</div>` : ''}
  </section>`;
}

function socialsHtml(b) {
  return `<section class="cc-block cc-socials" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">Find me</h2>
    <div class="cc-social-grid">
      ${b.items.map(i => `<div class="cc-social"><span class="cc-social-label">${escHtml(i.label)}</span><span class="cc-social-handle">${escHtml(i.handle)}</span></div>`).join('')}
    </div>
  </section>`;
}

function mediaHtml(b, imageSrc) {
  return `<section class="cc-block cc-media" data-block="${escHtml(b.id)}">
    <h2 class="cc-title">Favourite media</h2>
    <div class="cc-media-grid">
      ${b.items.map(m => {
        const src = imageSrc(m.image);
        return `<figure class="cc-media-item cc-media-item--${escHtml(m.type)}">
          ${src ? `<img src="${escHtml(src)}" alt="${escHtml(m.name)}">` : '<div class="cc-media-empty" aria-hidden="true"></div>'}
          <figcaption>${escHtml(m.name)}</figcaption>
        </figure>`;
      }).join('')}
    </div>
  </section>`;
}

/**
 * Render the model into `el`. `images` maps a remote URL to a data: URL; anything
 * missing renders as an empty frame rather than a broken image.
 *
 * Returns `{ layout, dropped }` — `dropped` names the blocks a fixed preset could
 * not fit, so the UI can say so instead of silently truncating.
 */
export function renderCard(el, model, cfg, images = new Map()) {
  const layout = applyPreset(el, cfg.theme, cfg.layout);
  const imageSrc = (url) => images.get(url) || '';

  const header = model.blocks.find(b => b.kind === 'header');
  const body = model.blocks.filter(b => b.kind !== 'header');

  el.innerHTML = `
    ${blockHtml(header, imageSrc)}
    <div class="cc-body">${body.map(b => blockHtml(b, imageSrc)).join('')}</div>
    <footer class="cc-footer">
      <span class="cc-footer-brand">charactersheet.neorgon.com</span>
    </footer>`;

  const dropped = layout.fit === 'fixed' ? fitCard(el, body) : [];
  return { layout, dropped };
}

/**
 * Drop the lowest-priority blocks until the content fits the fixed height.
 * Uses measured overflow, so it reflects the real rendered layout rather than a
 * parallel estimate that can drift from it.
 */
function fitCard(el, body) {
  const dropped = [];
  const order = [...body].sort((a, b) => a.priority - b.priority);
  const bodyEl = el.querySelector('.cc-body');

  // Both axes, because the multi-column presets overflow *sideways*: CSS multicol
  // answers "too much content" by adding a column past the card's right edge and
  // leaves scrollHeight untouched. A vertical-only check let the 3-column Slack
  // preset clip four sections while reporting nothing dropped.
  const overflows = () =>
    el.scrollHeight > el.clientHeight + 1 ||
    (bodyEl ? bodyEl.scrollWidth > bodyEl.clientWidth + 1 : false);

  if (!overflows()) return dropped;

  for (const block of order) {
    const node = el.querySelector(`[data-block="${block.id}"]`);
    if (!node) continue;
    node.remove();
    dropped.push(block.id);
    if (!overflows()) break;
  }

  // Stamp the card itself, not just the return value: the PNG and the PDF leave
  // the page, and a preset that quietly ate six sections reads as a complete card.
  if (dropped.length) {
    const note = document.createElement('span');
    note.className = 'cc-dropped';
    note.textContent = `${dropped.length} more section${dropped.length > 1 ? 's' : ''} on the full card`;
    el.querySelector('.cc-footer')?.appendChild(note);
  }
  return dropped;
}
