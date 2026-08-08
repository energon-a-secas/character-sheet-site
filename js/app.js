import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents, initCharacterSheetAuth } from './events.js';
import { randomFill } from './testdata.js';

window.randomFill = randomFill;

loadSaved(state);
await initCharacterSheetAuth();
render();
bindEvents();
