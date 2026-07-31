// Shared interest marks. Every family member's mark for a city renders on
// both the city page and the cities index, because both key on the same
// interest_key rather than on the page they appear on.

import { getUser, onAuthChange, PEOPLE } from './auth.js';
import { isConfigured, getInterests, setInterest, clearInterest } from './supabase.js';

const CYCLE = ['unset', 'yes', 'no'];
const MARK = { unset: '—', yes: '★', no: '✕' };
// DESIGN.md: emoji may reinforce a state but may never be its only carrier,
// so every stamp ships a word too. Names are short enough to sit inline.
const WORD = { unset: '?', yes: 'Yes', no: 'No' };

// interest_key -> { userId -> state }
let marks = {};
let rows = [];

// interest_key -> promise for the write currently in flight for that mark.
// Taps render optimistically and instantly, but the network writes they
// trigger are chained rather than raced: two taps in quick succession would
// otherwise each capture the same `previous` state, and a failure handler for
// the first could revert to a value the second had already moved past,
// leaving the displayed mark disagreeing with the stored one until reload.
let pendingWrites = {};

function stateFor(key, userId) {
  return (marks[key] && marks[key][userId]) || 'unset';
}

function setLocal(key, userId, state) {
  if (!marks[key]) marks[key] = {};
  if (state === 'unset') delete marks[key][userId];
  else marks[key][userId] = state;
}

function renderRow(row) {
  const key = row.dataset.interestKey;
  const me = getUser();
  const myId = me ? me.id : null;
  row.textContent = '';

  PEOPLE.forEach(function (person) {
    const state = stateFor(key, person.user_id);
    const isMe = person.user_id === myId;

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
      el.addEventListener('click', function () { cycle(row, key); });
    } else {
      // A span carries no accessible name of its own, and the visible text is
      // abbreviated, so state the whole thing for assistive tech.
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', person.name + ': ' + state);
    }

    row.appendChild(el);
  });

  if (!myId) {
    const hint = document.createElement('span');
    hint.className = 'interest-hint';
    hint.textContent = 'Sign in to join in';
    row.appendChild(hint);
  }
}

function renderAll() {
  rows.forEach(renderRow);
}

// Status text lives in a sibling of the row, not inside it. renderRow() clears
// and rebuilds the row's contents on every render, so a live region placed
// inside it would be destroyed and recreated — and a region that did not exist
// before its text changed is not reliably announced. This element is created
// once per row and only ever has its textContent updated, which is what makes
// assistive tech announce "Didn't save" at all. Mirrors the pattern the
// comment form gets from markup via [data-comment-status].
function statusFor(row) {
  let el = row.nextElementSibling;
  if (!el || !el.classList.contains('interest-status')) {
    el = document.createElement('span');
    el.className = 'interest-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    row.insertAdjacentElement('afterend', el);
  }
  return el;
}

function setRowStatus(row, message, isError) {
  const el = statusFor(row);
  el.textContent = message;
  // The error styling stays on this element rather than the row, so it
  // survives the next renderRow().
  el.className = 'interest-status' + (isError ? ' interest-error' : '');
}

function showRowError(row, message) {
  setRowStatus(row, message, true);
}

function cycle(row, key) {
  const me = getUser();
  // Only the signed-in person's mark renders as a button, so this is a
  // belt-and-braces guard against a stale listener firing after sign-out.
  if (!me) return;

  const previous = stateFor(key, me.id);
  const next = CYCLE[(CYCLE.indexOf(previous) + 1) % CYCLE.length];

  // Optimistic: render immediately, revert if the write fails. A star that
  // was never saved is worse than a slow one.
  setLocal(key, me.id, next);
  renderRow(row);
  // Clear any error from a previous attempt: the row now shows this tap's
  // state, so a stale "Didn't save" would be describing something else.
  setRowStatus(row, '', false);

  // Chain behind any write already in flight for this mark, so the server
  // sees the same order the reader tapped.
  const prior = pendingWrites[key] || Promise.resolve();
  const write = prior.catch(function () {}).then(function () {
    // `next` is what this tap intended, and the chain guarantees every earlier
    // tap has already been sent, so it is safe to send as-is.
    return next === 'unset' ? clearInterest(key) : setInterest(key, next);
  }).catch(function (e) {
    // Only revert if no later tap has queued behind this one. Otherwise that
    // tap is about to write and owns what the row should show — reverting here
    // would drop the display back to a state the server is moving away from,
    // which is the desync this whole chain exists to prevent.
    if (pendingWrites[key] === write) {
      setLocal(key, me.id, previous);
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
    // Loading text goes through the live region too, so the transition from
    // "Loading marks…" to a rendered row (or to an error) is announced rather
    // than silently swapped.
    setRowStatus(row, 'Loading marks…', false);
  });

  try {
    const data = await getInterests();
    marks = {};
    data.forEach(function (r) { setLocal(r.interest_key, r.user_id, r.state); });
    if (PEOPLE.length === 0) {
      // The profiles fetch in auth.js failed, so there is no roster to
      // render marks against — an empty row would look like a rendering
      // glitch rather than a fetch failure, including for a signed-in user.
      rows.forEach(function (row) {
        row.textContent = '';
        showRowError(row, "Couldn't load marks — reload to try again");
      });
      return;
    }
    renderAll();
    rows.forEach(function (row) { setRowStatus(row, '', false); });
  } catch (e) {
    rows.forEach(function (row) {
      row.textContent = '';
      showRowError(row, "Couldn't load marks — reload to try again");
    });
    return;
  }

  // Signing in or out re-renders which mark is yours.
  onAuthChange(renderAll);
}
