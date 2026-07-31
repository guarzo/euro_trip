// Shared interest marks. Every family member's mark for a city renders on
// both the city page and the cities index, because both key on the same
// interest_key rather than on the page they appear on.

import { getPerson, onPersonChange, PEOPLE } from './identity.js';
import { isConfigured, getInterests, setInterest, clearInterest } from './supabase.js';

const CYCLE = ['unset', 'yes', 'no'];
const MARK = { unset: '—', yes: '★', no: '✕' };
// DESIGN.md: emoji may reinforce a state but may never be its only carrier,
// so every stamp ships a word too. Names are short enough to sit inline.
const WORD = { unset: '?', yes: 'Yes', no: 'No' };

// interest_key -> { person -> state }
let marks = {};
let rows = [];

// interest_key -> promise for the write currently in flight for that mark.
// Taps render optimistically and instantly, but the network writes they
// trigger are chained rather than raced: two taps in quick succession would
// otherwise each capture the same `previous` state, and a failure handler for
// the first could revert to a value the second had already moved past,
// leaving the displayed mark disagreeing with the stored one until reload.
let pendingWrites = {};

function stateFor(key, person) {
  return (marks[key] && marks[key][person]) || 'unset';
}

function setLocal(key, person, state) {
  if (!marks[key]) marks[key] = {};
  if (state === 'unset') delete marks[key][person];
  else marks[key][person] = state;
}

function renderRow(row) {
  const key = row.dataset.interestKey;
  const me = getPerson();
  row.textContent = '';

  PEOPLE.forEach(function (person) {
    const state = stateFor(key, person.key);
    const isMe = person.key === me;

    const el = document.createElement(isMe ? 'button' : 'span');
    el.className = 'interest-mark' + (isMe ? ' is-me' : '');
    el.dataset.interestState = state;
    // Three carriers, deliberately: the person's emoji, the state glyph, and
    // the state word. Color and glyph alone would fail DESIGN.md.
    el.textContent = person.emoji + ' ' + MARK[state] + ' ' + WORD[state];

    if (isMe) {
      el.type = 'button';
      // Three states, so "no" maps to mixed rather than false — otherwise a
      // screen reader cannot tell "not marked" from "explicitly not interested".
      el.setAttribute('aria-pressed', state === 'yes' ? 'true' : (state === 'no' ? 'mixed' : 'false'));
      el.setAttribute('aria-label', 'Your mark, currently ' + state + '. Activate to change.');
      el.addEventListener('click', function () { cycle(row, key, person.key); });
    } else {
      // A span carries no accessible name of its own, and the visible text is
      // abbreviated, so state the whole thing for assistive tech.
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', person.name + ': ' + state);
    }

    row.appendChild(el);
  });

  if (!me) {
    const hint = document.createElement('span');
    hint.className = 'interest-hint';
    hint.textContent = 'Pick who you are to join in';
    row.appendChild(hint);
  }
}

function renderAll() {
  rows.forEach(renderRow);
}

function showRowError(row, message) {
  const err = document.createElement('span');
  err.className = 'interest-error';
  err.textContent = message;
  row.appendChild(err);
}

function cycle(row, key, person) {
  const previous = stateFor(key, person);
  const next = CYCLE[(CYCLE.indexOf(previous) + 1) % CYCLE.length];

  // Optimistic: render immediately, revert if the write fails. A star that
  // was never saved is worse than a slow one.
  setLocal(key, person, next);
  renderRow(row);

  // Chain behind any write already in flight for this mark, so the server
  // sees the same order the reader tapped.
  const prior = pendingWrites[key] || Promise.resolve();
  const write = prior.catch(function () {}).then(function () {
    // `next` is what this tap intended, and the chain guarantees every earlier
    // tap has already been sent, so it is safe to send as-is.
    return next === 'unset' ? clearInterest(key, person) : setInterest(key, person, next);
  }).catch(function (e) {
    // Only revert if no later tap has queued behind this one. Otherwise that
    // tap is about to write and owns what the row should show — reverting here
    // would drop the display back to a state the server is moving away from,
    // which is the desync this whole chain exists to prevent.
    if (pendingWrites[key] === write) {
      setLocal(key, person, previous);
      renderRow(row);
      showRowError(row, "Didn't save — try again");
    }
    throw e;
  });

  // Keep the chain alive for the next tap, then drop it once this mark is
  // idle so a failed write cannot poison later attempts.
  pendingWrites[key] = write;
  write.catch(function () {}).then(function () {
    if (pendingWrites[key] === write) delete pendingWrites[key];
  });
}

export async function initInterests() {
  rows = Array.prototype.slice.call(document.querySelectorAll('[data-interest-key]'));
  if (rows.length === 0) return;

  if (!isConfigured()) {
    rows.forEach(function (row) {
      row.textContent = '';
      showRowError(row, 'Marks turn on once Supabase is configured.');
    });
    return;
  }

  rows.forEach(function (row) {
    row.textContent = '';
    const loading = document.createElement('span');
    loading.className = 'interest-hint';
    loading.textContent = 'Loading marks…';
    row.appendChild(loading);
  });

  try {
    const data = await getInterests();
    marks = {};
    data.forEach(function (r) { setLocal(r.interest_key, r.person, r.state); });
    renderAll();
  } catch (e) {
    rows.forEach(function (row) {
      row.textContent = '';
      showRowError(row, "Couldn't load marks — reload to try again");
    });
    return;
  }

  // Switching identity re-renders which button is yours.
  onPersonChange(renderAll);
}
