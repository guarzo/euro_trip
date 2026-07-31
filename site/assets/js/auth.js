// Who is signed in, and who the four people are. Replaces identity.js, whose
// answer to "who are you" was whatever the browser said.
//
// The roster now comes from the profiles table rather than from _config.yml,
// so the page no longer ships the list of who may post. PEOPLE is empty until
// initAuth() resolves; main.js awaits it before anything reads it.

import {
  isConfigured, getSession, signIn, signOut, onAuthStateChange, getProfiles
} from './supabase.js';

const listeners = [];
let banner = null;
let user = null;

export let PEOPLE = [];

export function getUser() {
  return user;
}

export function onAuthChange(fn) {
  listeners.push(fn);
}

export function personLabel(userId) {
  const person = PEOPLE.find(function (p) { return p.user_id === userId; });
  // A comment whose author has no profile row still renders. Falling back to
  // the raw UUID would leak an internal id into the page for no benefit.
  return person ? person.emoji + ' ' + person.name : 'Someone';
}

function notify() {
  listeners.forEach(function (fn) { fn(user); });
}

function render() {
  if (!banner) return;
  const form = banner.querySelector('[data-auth-form]');
  const currentEl = banner.querySelector('[data-auth-current]');
  const label = banner.querySelector('[data-auth-label]');

  form.hidden = user !== null;
  currentEl.hidden = user === null;
  if (user) label.textContent = personLabel(user.id);
}

function setStatus(message) {
  const el = banner.querySelector('[data-auth-status]');
  if (el) el.textContent = message;
}

async function onSubmit(e) {
  e.preventDefault();

  const button = banner.querySelector('[data-auth-signin]');
  // Re-entry guard: a double-tap would otherwise request two links, and the
  // built-in mailer is rate-limited enough for that to matter.
  if (button.disabled) return;

  const email = banner.querySelector('[data-auth-email]').value.trim();
  if (email === '') return;

  button.disabled = true;
  setStatus('Sending…');

  try {
    // Return to the page the link was requested from, so signing in from the
    // Rome page comes back to Rome.
    await signIn(email, window.location.href);
    // Deliberately identical wording whether or not the address is one of the
    // four. Saying "no such user" would turn the form into a way to ask who
    // has an account.
    setStatus('Check your email for a sign-in link.');
  } catch (err) {
    setStatus("Couldn't send a link — try again.");
  } finally {
    button.disabled = false;
  }
}

async function onSignOut() {
  try {
    await signOut();
  } catch (e) {
    // onAuthStateChange still fires locally, so the UI returns to the form.
  }
}

export async function initAuth() {
  banner = document.querySelector('[data-auth-banner]');
  if (!banner || !isConfigured()) return;

  banner.querySelector('[data-auth-form]').addEventListener('submit', onSubmit);
  banner.querySelector('[data-auth-signout]').addEventListener('click', onSignOut);
  banner.hidden = false;

  try {
    PEOPLE = await getProfiles();
  } catch (e) {
    // Names are unavailable, but sign-in still works and marks still save.
    PEOPLE = [];
  }

  try {
    const session = await getSession();
    user = session ? session.user : null;
  } catch (e) {
    user = null;
  }
  render();

  // Fires on sign-in, sign-out, and token refresh — including when the user
  // arrives back from a magic link, which is what completes that flow.
  await onAuthStateChange(function (nextUser) {
    const changed = (nextUser && nextUser.id) !== (user && user.id);
    user = nextUser;
    render();
    // Token refresh fires this with the same user every hour or so. Notifying
    // on that would re-render every thread and every interest row for no
    // reason, so only a real identity change propagates.
    if (changed) notify();
  });
}
