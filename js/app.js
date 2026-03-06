import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents } from './events.js';
import { randomFill } from './testdata.js';

function init() {
  loadSaved(state);
  render();
  bindEvents();
}

window.randomFill = randomFill;

init();
