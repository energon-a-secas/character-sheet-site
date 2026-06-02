import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents, initCharacterSheetAuth } from './events.js';
import { randomFill } from './testdata.js';
import { shareCard, generateQRCode, copyEmbedCode, downloadHighResCard } from './share.js';

window.randomFill = randomFill;
window.shareCard = shareCard;
window.generateQRCode = generateQRCode;
window.copyEmbedCode = copyEmbedCode;
window.downloadHighResCard = downloadHighResCard;

loadSaved(state);
await initCharacterSheetAuth();
render();
bindEvents();
