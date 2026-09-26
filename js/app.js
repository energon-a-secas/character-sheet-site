import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents, initCharacterSheetAuth } from './events.js';

// Nothing here goes on `window`: every control reaches its function through the
// delegated listeners in events.js (see the ACTIONS comment there for why).
loadSaved(state);
await initCharacterSheetAuth();
render();
bindEvents();
