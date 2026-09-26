// Generic helpers come from the DOM Kit (js/neorgon-dom.js, vendored from
// packages/neorgon-ui/dom/). They are re-exported so every existing
// `import { escHtml } from './utils.js'` keeps working.
//
// Do not edit js/neorgon-dom.js. Edit the canonical source and run
// packages/neorgon-ui/sync-dom.sh.
import { escHtml, debounce, showToast as kitToast } from './neorgon-dom.js';
export { escHtml, debounce };

const _els = {};
export function $(id) {
  return _els[id] || (_els[id] = document.getElementById(id));
}


/**
 * An absolute https: URL, normalised, or '' for anything else.
 *
 * For image URLs that arrive from the search APIs (RAWG, Jikan, TMDB through the
 * Worker). `javascript:`, `data:`, `http:` and relative values are dropped rather
 * than rendered, so a hostile upstream record cannot pick the scheme. Still pass
 * the result through escHtml at the sink: this checks the scheme, not the quotes.
 */
export function httpsUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const u = new URL(value);
    return u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

/** This site's own toast contract, rendered by the kit. */
export function showToast(msg) {
  return kitToast(msg, { id: 'app-toast', className: 'toast',
    visibleClass: 'visible', duration: 2000 });
}



const _reduceMotion = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export function scrollTop() {
  window.scrollTo({ top: 0, behavior: _reduceMotion && _reduceMotion.matches ? 'auto' : 'smooth' });
}
