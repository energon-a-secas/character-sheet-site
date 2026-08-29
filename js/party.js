// The party board (party.html).
//
// Takes several sheets — pasted card links, imported .json files, or the one in
// this browser's localStorage — and reports where they overlap. All of it runs
// locally: js/party/analyze.js is pure arithmetic and this file is DOM plus
// decoding.
//
// It imports sheet.js rather than state.js for the same reason reader.js does:
// this page's CSP blocks the CDN Convex ships from, and there is no backend to
// talk to. Reading `localStorage` for "Add my sheet" is a read, not a session.

import { hydrateSheet } from './sheet.js';
import { $, escHtml, showToast } from './utils.js';
import { payloadFromUrl, decodeSheet, readRosterFromLocation, buildRosterUrl } from './share/link.js';
import { analyze, toMember, fmtHour } from './party/analyze.js';

// Members in the order they were added. Order is meaningful in the UI (the roster
// reads as a list someone built), so this is an array, not a map.
let members = [];
let nextId = 1;

// ── Intake ──────────────────────────────────────────────────────────────────

function setError(msg) {
  const el = $('party-error');
  el.hidden = !msg;
  el.textContent = msg || '';
}

/**
 * Add a hydrated sheet, unless someone with that name is already on the board.
 *
 * Named-based de-duplication rather than payload-based: the common mistake is
 * pasting the same person's link twice after they re-shared it, and the two
 * payloads differ even though the person does not.
 */
function addSheet(sheet) {
  const member = toMember(sheet, `m${nextId++}`);
  const dupe = members.find(m => m.name.toLowerCase() === member.name.toLowerCase());
  if (dupe) return { added: false, reason: `${member.name} is already in the party` };
  members.push(member);
  return { added: true, member };
}

async function addFromText(text) {
  const lines = String(text).split(/\s+/).filter(Boolean);
  if (!lines.length) return { ok: 0, failed: [], skipped: [] };

  const result = { ok: 0, failed: [], skipped: [] };
  for (const line of lines) {
    const payload = payloadFromUrl(line);
    if (!payload) { result.failed.push(line); continue; }
    try {
      const sheet = hydrateSheet(await decodeSheet(payload));
      const added = addSheet(sheet);
      if (added.added) result.ok++;
      else result.skipped.push(added.reason);
    } catch {
      // A truncated link is the overwhelmingly common failure — copying out of
      // Slack drops everything after the # in some clients.
      result.failed.push(line);
    }
  }
  return result;
}

function reportIntake({ ok, failed, skipped }) {
  const parts = [];
  if (ok) parts.push(`Added ${ok} sheet${ok > 1 ? 's' : ''}`);
  if (skipped.length) parts.push(skipped.join('; '));
  if (failed.length) {
    parts.push(`${failed.length} link${failed.length > 1 ? 's' : ''} could not be read. The part after the # may have been cut off`);
  }
  setError(parts.join(' · '));
  if (ok) render();
}

async function onAdd() {
  const field = $('party-input');
  const result = await addFromText(field.value);
  if (result.ok) field.value = '';
  reportIntake(result);
}

async function onFiles(fileList) {
  const result = { ok: 0, failed: [], skipped: [] };
  for (const file of fileList) {
    try {
      const parsed = JSON.parse(await file.text());
      // A .json export is the author's own sheet and still carries truth1/truth2/
      // lie. hydrateSheet keeps them; nothing on this page reads the answer, and
      // `Copy roster link` re-encodes through the answer-stripping path.
      const sheets = Array.isArray(parsed) ? parsed : [parsed];
      for (const s of sheets) {
        const added = addSheet(hydrateSheet(s));
        if (added.added) result.ok++;
        else result.skipped.push(added.reason);
      }
    } catch {
      result.failed.push(file.name);
    }
  }
  reportIntake(result);
}

/** Add the sheet this browser has been building, if there is one. */
function onAddMine() {
  let raw;
  try {
    raw = localStorage.getItem('player-card');
  } catch {
    setError('This browser is blocking local storage, so there is no sheet to read.');
    return;
  }
  if (!raw) {
    setError('No sheet in this browser yet: build one first.');
    return;
  }
  try {
    const added = addSheet(hydrateSheet(JSON.parse(raw)));
    if (!added.added) { setError(added.reason); return; }
    setError('');
    render();
  } catch {
    setError('The sheet saved in this browser could not be read.');
  }
}

function removeMember(id) {
  members = members.filter(m => m.id !== id);
  setError('');
  render();
}

// ── Rendering ───────────────────────────────────────────────────────────────

function render() {
  const board = $('party-board');
  const empty = $('party-empty');

  if (!members.length) {
    board.hidden = true;
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  board.hidden = false;

  const data = analyze(members);

  renderRoster();
  renderOverlap(data.overlap);
  renderShared(data.ground.shared);
  renderSolo(data.ground.solo);
  renderClasses(data.composition);
  renderPrompts(data.icebreakers);
}

function renderRoster() {
  $('party-roster-count').textContent = `${members.length}`;
  $('party-roster').innerHTML = members.map(m => `
    <article class="party-member">
      <div class="party-member-face">
        ${m.avatarImage
          ? `<img src="${escHtml(m.avatarImage)}" alt="" loading="lazy">`
          : `<span class="party-member-initial">${escHtml((m.name[0] || '?').toUpperCase())}</span>`}
      </div>
      <div class="party-member-body">
        <h3 class="party-member-name">${escHtml(m.name)}</h3>
        <p class="party-member-class">${escHtml(m.rpgClass)}</p>
        ${m.role ? `<p class="party-member-line">${escHtml(m.role)}</p>` : ''}
        ${m.place || m.offsetLabel
          ? `<p class="party-member-line">${escHtml([m.place, m.offsetLabel].filter(Boolean).join(' · '))}</p>` : ''}
        ${m.bestTime ? `<p class="party-member-line party-member-best">Best reached: ${escHtml(m.bestTime)}</p>` : ''}
      </div>
      <button type="button" class="party-member-remove" data-remove-member="${m.id}"
        aria-label="Remove ${escHtml(m.name)}">×</button>
    </article>`).join('');
}

/**
 * The overlap grid: one cell per UTC hour, shaded by how many people are inside
 * their working window.
 *
 * Shows UTC rather than the viewer's local time on purpose — a roster gets
 * screenshotted and pasted, and a grid labelled in the sender's local time is
 * wrong for everyone who reads it.
 */
function renderOverlap({ hours, best, window: win, unknown, placed }) {
  const note = $('party-overlap-note');

  if (!placed) {
    note.textContent = 'Nobody on this roster set a timezone, so there is nothing to overlap.';
    $('party-overlap').innerHTML = '';
    return;
  }

  const bits = [];
  if (win && best > 1) {
    bits.push(`${best} of ${placed} are reachable from ${fmtHour(win.startUtc)}–${fmtHour(win.endUtc)} UTC (${win.length}h).`);
  } else if (best === 1) {
    bits.push('No hour of the day has more than one of you inside working hours.');
  }
  if (unknown.length) {
    bits.push(`${unknown.join(', ')} ${unknown.length > 1 ? 'have' : 'has'} no timezone set and ${unknown.length > 1 ? 'are' : 'is'} not counted.`);
  }
  note.textContent = bits.join(' ');

  $('party-overlap').innerHTML = hours.map(h => {
    const n = h.available.length;
    // Opacity by share of the placed roster, so the grid means the same thing
    // whether the party is 2 people or 9.
    const strength = placed ? n / placed : 0;
    const isBest = n === best && best > 0;
    return `<div class="party-hour${isBest ? ' is-best' : ''}" style="--fill:${strength.toFixed(3)}"
      title="${fmtHour(h.utcHour)} UTC: ${n ? escHtml(h.available.join(', ')) : 'nobody'}">
      <span class="party-hour-label">${String(h.utcHour).padStart(2, '0')}</span>
      <span class="party-hour-count">${n}</span>
    </div>`;
  }).join('');
}

function renderShared(shared) {
  const host = $('party-shared');
  if (!shared.length) {
    host.innerHTML = `<p class="party-none">Nothing listed by two or more people yet. ${
      members.length < 2 ? 'Add another sheet.' : 'Try filling in more of the taste sections.'}</p>`;
    return;
  }

  // Grouped by category so the read-out has structure; categories keep the
  // analyzer's order, which puts titles above coincidences like platforms.
  const groups = new Map();
  for (const row of shared) {
    if (!groups.has(row.categoryLabel)) groups.set(row.categoryLabel, []);
    groups.get(row.categoryLabel).push(row);
  }

  host.innerHTML = [...groups.entries()].map(([label, rows]) => `
    <div class="party-shared-group">
      <h3 class="party-shared-title">${escHtml(label)}</h3>
      <ul class="party-shared-list">
        ${rows.map(r => `
          <li class="party-shared-row">
            <span class="party-shared-count">${r.people.length}</span>
            <span class="party-shared-label">${escHtml(r.label)}</span>
            <span class="party-shared-people">${escHtml(r.people.join(', '))}</span>
          </li>`).join('')}
      </ul>
    </div>`).join('');
}

function renderSolo(solo) {
  const section = $('party-solo-section');
  section.hidden = !solo.length;
  if (!solo.length) return;
  $('party-solo').innerHTML = solo.map(r => `
    <span class="party-solo-chip">
      <strong>${escHtml(r.label)}</strong>
      <span>${escHtml(r.people[0])}</span>
    </span>`).join('');
}

function renderClasses(composition) {
  $('party-classes').innerHTML = composition.map(c => `
    <div class="party-class">
      <div class="party-class-head">
        <span class="party-class-name">${escHtml(c.rpgClass)}</span>
        <span class="party-class-count">${c.people.length}</span>
      </div>
      <div class="party-class-people">${escHtml(c.people.join(', '))}</div>
    </div>`).join('');
}

/** Prompts carry **bold** from the analyzer; render it, escape everything else. */
function renderPrompts(prompts) {
  $('party-prompts').innerHTML = prompts.map(p => {
    const safe = escHtml(p).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    return `<li>${safe}</li>`;
  }).join('');
}

// ── Output ──────────────────────────────────────────────────────────────────

/** The board as Slack-ready mrkdwn — the format it actually gets pasted into. */
function summaryText() {
  const data = analyze(members);
  const lines = [`*Party: ${members.length} sheet${members.length > 1 ? 's' : ''}*`, ''];

  lines.push('*Roster*');
  for (const m of members) {
    const meta = [m.rpgClass, m.role, m.place, m.offsetLabel].filter(Boolean).join(' · ');
    lines.push(`• ${m.name}: ${meta}`);
  }

  const { best, window: win, unknown, placed } = data.overlap;
  if (win && best > 1) {
    lines.push('', '*Overlap*', `• ${best} of ${placed} reachable ${fmtHour(win.startUtc)}–${fmtHour(win.endUtc)} UTC`);
    if (unknown.length) lines.push(`• No timezone set: ${unknown.join(', ')}`);
  }

  if (data.ground.shared.length) {
    lines.push('', '*Common ground*');
    for (const r of data.ground.shared.slice(0, 12)) {
      lines.push(`• ${r.label}: ${r.people.join(', ')}`);
    }
  }

  lines.push('', '*Start here*');
  // Slack mrkdwn is single-asterisk bold; the analyzer emits Markdown's double.
  for (const p of data.icebreakers) lines.push(`• ${p.replace(/\*\*/g, '*')}`);

  return lines.join('\n');
}

async function copySummary() {
  const text = summaryText();
  try {
    await navigator.clipboard.writeText(text);
    showToast('Summary copied: paste it into Slack');
  } catch {
    setError('Clipboard blocked by this browser. The summary is in the console.');
    console.log(text);
  }
}

async function copyRosterLink() {
  try {
    const url = await buildRosterUrl(members.map(m => m.sheet));
    await navigator.clipboard.writeText(url);
    showToast(`Roster link copied (${url.length} characters)`);
  } catch {
    setError('Could not build or copy the roster link.');
  }
}

function clearParty() {
  members = [];
  nextId = 1;
  // The roster lives in the hash; leaving it there means a reload silently
  // restores what was just cleared.
  if (location.hash) history.replaceState(null, '', location.pathname);
  setError('');
  render();
}

// ── Boot ────────────────────────────────────────────────────────────────────

function bind() {
  $('party-add').addEventListener('click', onAdd);
  $('party-add-mine').addEventListener('click', onAddMine);
  $('party-clear').addEventListener('click', clearParty);
  $('party-copy').addEventListener('click', copySummary);
  $('party-roster-link').addEventListener('click', copyRosterLink);
  $('party-files').addEventListener('change', (e) => {
    onFiles([...e.target.files]);
    e.target.value = '';  // so re-picking the same file fires change again
  });

  // Cmd/Ctrl+Enter in the textarea adds, matching every other paste-and-go box.
  $('party-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onAdd(); }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-member]');
    if (btn) removeMember(btn.dataset.removeMember);
  });

  // Dropping files anywhere on the page, since the drop target people aim for is
  // the whole board rather than the small file button.
  document.addEventListener('dragover', (e) => { e.preventDefault(); document.body.classList.add('party-dragging'); });
  document.addEventListener('dragleave', () => document.body.classList.remove('party-dragging'));
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.classList.remove('party-dragging');
    const files = [...(e.dataTransfer?.files || [])];
    if (files.length) onFiles(files);
  });
}

/** Load the roster in the URL, replacing whatever is on the board. */
async function loadFromHash() {
  const roster = await readRosterFromLocation();
  if (!roster?.length) return false;
  members = [];
  nextId = 1;
  for (const s of roster) {
    try { addSheet(hydrateSheet(s)); } catch { /* skip an unreadable entry */ }
  }
  render();
  return true;
}

async function main() {
  bind();

  // Pasting a roster link into the address bar of a tab already on this page is a
  // same-document navigation — no reload, so nothing would happen without this.
  // `clearParty` uses replaceState, which does not fire hashchange, so clearing
  // cannot re-trigger a load.
  window.addEventListener('hashchange', () => { loadFromHash(); });

  if (!(await loadFromHash())) render();
}

main().catch((err) => {
  console.error(err);
  setError('Something went wrong setting up the board.');
});
