// Export paths for the DOM card.
//
// PNG: serialise the live card into an SVG <foreignObject>, rasterise at a real
// scale factor. Unlike the old canvas path this re-renders at the target
// resolution instead of upscaling a finished bitmap, so 3× is genuinely sharper.
//
// PDF: hand the card to the browser's print pipeline, which keeps text as vector
// and selectable. No jsPDF, no screenshot-in-a-PDF.

import { showToast } from '../utils.js';

const CARD_CSS_URL = 'css/card.css';
let _cardCssText = null;

/** The card stylesheet, fetched once. The SVG has no access to the page's sheets. */
async function cardCss() {
  if (_cardCssText === null) {
    const res = await fetch(CARD_CSS_URL);
    _cardCssText = res.ok ? await res.text() : '';
  }
  return _cardCssText;
}

/**
 * Fetch every remote image and convert it to a data: URL.
 *
 * Required for both export paths: an SVG foreignObject cannot load external
 * images at all, and a canvas holding a cross-origin image is tainted. Images
 * that fail resolve to nothing and render as an empty frame.
 */
export async function inlineImages(urls) {
  const map = new Map();
  await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) return;
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(blob);
      });
      map.set(url, dataUrl);
    } catch { /* unreachable image renders as an empty frame */ }
  }));
  return map;
}

/** Rasterise the card element to a PNG blob at `scale`× its CSS size. */
export async function cardToPngBlob(cardEl, scale = 2) {
  const width = cardEl.offsetWidth;
  const height = cardEl.offsetHeight;
  const css = await cardCss();

  const clone = cardEl.cloneNode(true);
  clone.style.margin = '0';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';

  const serialized = new XMLSerializer().serializeToString(clone);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">
        <style>${css}</style>
        ${serialized}
      </div>
    </foreignObject>
  </svg>`;

  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('rasterize failed'));
    i.src = svgUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  // Revoke on the next frame — revoking immediately can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(name) {
  return (name || 'character').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'character';
}

/** Download the card as PNG. `scale` 1 | 2 | 3. */
export async function downloadPng(cardEl, name, scale = 2) {
  try {
    const blob = await cardToPngBlob(cardEl, scale);
    if (!blob) { showToast('Export failed'); return; }
    triggerDownload(blob, `${slugify(name)}-card@${scale}x.png`);
    showToast(`Downloaded at ${scale}× (${cardEl.offsetWidth * scale}px wide)`);
  } catch (err) {
    console.error(err);
    showToast('Export failed: try a different layout');
  }
}

/** Copy the card PNG to the clipboard. */
export async function copyPng(cardEl, scale = 2) {
  try {
    const blob = await cardToPngBlob(cardEl, scale);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Card copied: paste it into Slack');
  } catch {
    showToast('Clipboard blocked: use Download instead');
  }
}

/** Native share sheet with the PNG attached, falling back to clipboard. */
export async function sharePng(cardEl, name, scale = 2) {
  try {
    const blob = await cardToPngBlob(cardEl, scale);
    const file = new File([blob], `${slugify(name)}-card.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: `${name || 'My'} character sheet`, files: [file] });
      return;
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    showToast('Card copied to clipboard');
  } catch (err) {
    if (err?.name === 'AbortError') return; // user dismissed the share sheet
    showToast('Sharing not supported here: use Download');
  }
}

/**
 * Print the card. The print stylesheet hides the app and sizes the card to A4,
 * so "Save as PDF" in the browser dialog yields vector text.
 */
export function printCard(cardEl) {
  const root = document.getElementById('card-print-root') || (() => {
    const d = document.createElement('div');
    d.id = 'card-print-root';
    document.body.appendChild(d);
    return d;
  })();

  root.innerHTML = '';
  const clone = cardEl.cloneNode(true);
  // Strip ids from the clone. cloneNode copies them, so leaving them in puts a
  // second #export-card in the document and any getElementById after a print
  // silently resolves to whichever comes first.
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  // The preview is scaled down with a transform; printing must not inherit that.
  clone.style.transform = 'none';
  root.appendChild(clone);

  const cleanup = () => {
    root.innerHTML = '';
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  window.print();
}
