import { ConvexHttpClient } from "https://esm.sh/convex@1.21.0/browser";
// The sheet shape lives in sheet.js so the read-only card page can import it
// without loading a Convex client it never uses.
import { blankSheet, hydrateSheet, deepMerge, migrateSheet } from './sheet.js';

export { blankSheet, hydrateSheet, deepMerge, migrateSheet };

// Run: npx convex dev — then paste your deployment URL here
const CONVEX_URL = "https://unique-lobster-957.convex.cloud";
export const convex = new ConvexHttpClient(CONVEX_URL);

export const api = {
  sheets: { list: "sheets:list", save: "sheets:save", remove: "sheets:remove" },
  migration: {
    myAccountLink: "migration:myAccountLink",
    linkLegacyAccount: "migration:linkLegacyAccount",
    getUserSetting: "migration:getUserSetting",
    setUserSetting: "migration:setUserSetting",
    listUserSettings: "migration:listUserSettings",
  },
};

const STORAGE_KEY = 'player-card';

export const state = blankSheet();


export function loadSaved(s) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      deepMerge(s, saved);
      migrateSheet(s);
    }
  } catch { /* ignore */ }
}

export function save(s) {
  try {
    // Strip auth/session fields before persisting
    const { _user, _sheetId, _sheetName, ...toSave } = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* quota */ }
}

export function resetState(s) {
  // Rebuilt from blankSheet() so a field added to the sheet is cleared here for
  // free. _user / _sheetId / _sheetName are deliberately preserved: the Clerk
  // session and the active sheet survive "start over".
  const fresh = blankSheet();
  delete fresh._user;
  delete fresh._sheetId;
  delete fresh._sheetName;
  Object.assign(s, fresh);
  localStorage.removeItem(STORAGE_KEY);
}

