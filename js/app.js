import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents } from './events.js';
import { randomFill } from './testdata.js';
import { shareCard, generateQRCode, copyEmbedCode, downloadHighResCard } from './share.js';

function init() {
  loadSaved(state);
  render();
  bindEvents();
}

window.randomFill = randomFill;
window.shareCard = shareCard;
window.generateQRCode = generateQRCode;
window.copyEmbedCode = copyEmbedCode;
window.downloadHighResCard = downloadHighResCard;

init();
