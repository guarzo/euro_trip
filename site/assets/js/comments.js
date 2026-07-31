// One flat thread per page, oldest first. Comments cannot be edited or
// deleted from the browser — that is a SQL console job, which is the right
// level of friction for four people who live together.

import { getPerson, onPersonChange, personLabel } from './identity.js';
import { isConfigured, getComments, addComment } from './supabase.js';

// Mirrors the database CHECK on comments.body. The textarea's maxlength
// already caps typed input, so this guard only catches paths that bypass it
// (paste handling differences, autofill, a future caller). It exists so an
// over-long note fails as a readable message rather than an opaque
// constraint violation indistinguishable from a network error.
const MAX_BODY = 2000;

let section = null;
let thread = null;
let form = null;
let bodyEl = null;
let statusEl = null;
let lockedEl = null;
let pagePath = '';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

function renderThread(comments) {
  thread.textContent = '';

  if (comments.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'comments-empty';
    empty.textContent = 'No notes yet. Be the first to say something.';
    thread.appendChild(empty);
    return;
  }

  comments.forEach(function (c) {
    const item = document.createElement('article');
    item.className = 'comment';

    const meta = document.createElement('p');
    meta.className = 'comment-meta';
    meta.textContent = personLabel(c.person) + ' · ' + formatDate(c.created_at);

    const body = document.createElement('p');
    body.className = 'comment-body';
    // textContent, not innerHTML: comment bodies are user input and are
    // never treated as markup.
    body.textContent = c.body;

    item.appendChild(meta);
    item.appendChild(body);
    thread.appendChild(item);
  });
}

function renderFormVisibility() {
  const me = getPerson();
  form.hidden = me === null;
  lockedEl.hidden = me !== null;
}

function showThreadMessage(message) {
  thread.textContent = '';
  const p = document.createElement('p');
  p.className = 'comments-empty';
  p.textContent = message;
  thread.appendChild(p);
}

async function reload() {
  try {
    renderThread(await getComments(pagePath));
  } catch (e) {
    showThreadMessage("Couldn't load notes — reload to try again.");
  }
}

async function onSubmit(e) {
  e.preventDefault();

  const submit = form.querySelector('.comment-submit');
  // Re-entry guard: a double-tap on a touch device would otherwise fire two
  // posts of the same text before the first disabled the button.
  if (submit.disabled) return;

  // Clear any message left by a previous attempt before deciding anything, so
  // a stale "Didn't post" cannot outlive the text it referred to — including
  // on the empty-body path below, where we return without posting.
  statusEl.textContent = '';

  const me = getPerson();
  const body = bodyEl.value.trim();
  if (!me || body === '') return;

  if (body.length > MAX_BODY) {
    statusEl.textContent = 'Too long — ' + body.length + ' of ' + MAX_BODY + ' characters.';
    return;
  }

  submit.disabled = true;
  statusEl.textContent = 'Posting…';

  try {
    await addComment(pagePath, me, body);
    bodyEl.value = '';
    statusEl.textContent = '';
    await reload();
  } catch (err) {
    // The text stays in the textarea so nothing typed is lost.
    statusEl.textContent = "Didn't post — try again.";
  } finally {
    submit.disabled = false;
  }
}

export async function initComments() {
  section = document.querySelector('[data-comments]');
  if (!section) return;

  thread = section.querySelector('[data-comments-thread]');
  form = section.querySelector('[data-comment-form]');
  bodyEl = section.querySelector('[data-comment-body]');
  statusEl = section.querySelector('[data-comment-status]');
  lockedEl = section.querySelector('[data-comment-locked]');
  pagePath = section.dataset.pagePath || window.location.pathname;

  if (!isConfigured()) {
    showThreadMessage('Notes turn on once Supabase is configured.');
    lockedEl.hidden = true;
    return;
  }

  showThreadMessage('Loading notes…');
  renderFormVisibility();
  onPersonChange(renderFormVisibility);
  form.addEventListener('submit', onSubmit);

  await reload();
}
