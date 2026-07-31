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

  if (form) form.hidden = user !== null;
  if (currentEl) currentEl.hidden = user === null;
  if (user && label) label.textContent = personLabel(user.id);
}

function setStatus(message) {
  const el = banner.querySelector('[data-auth-status]');
  if (el) el.textContent = message;
}

// Supabase reports a failed magic-link redirect (expired, already used,
// tampered) as error params in the URL FRAGMENT, e.g.
// "#error=access_denied&error_code=otp_expired&error_description=...". A
// *successful* redirect also arrives via the fragment (access_token /
// refresh_token), which the Supabase client itself consumes to establish the
// session — this function only ever acts on the error keys, so it cannot
// interfere with that path. See the call site in initAuth() for why it is
// safe to run after getSession() has resolved.
function consumeAuthErrorFromHash() {
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;

  const params = new URLSearchParams(hash.slice(1));
  const errorCode = params.get('error_code');
  if (!params.get('error') && !errorCode) return;

  // Never render error_description: it arrives in the URL, so a crafted link
  // could put arbitrary attacker-chosen wording in front of a family member.
  // Map to our own copy instead — setStatus() uses textContent, so this is a
  // social-engineering precaution, not an injection one.
  setStatus(
    errorCode === 'otp_expired'
      ? 'That sign-in link is no longer valid — request a new one below.'
      : "That sign-in link didn't work — request a new one below."
  );

  // Drop the fragment so a reload doesn't re-show a stale error.
  // replaceState, not location.hash = '', so this doesn't add a history entry
  // or trigger a scroll jump.
  history.replaceState(null, '', window.location.pathname + window.location.search);
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
    // onAuthStateChange still fires locally for a client-side failure, but a
    // network failure can leave the session ambiguous — say so rather than
    // leaving the user unsure whether they're still signed in.
    setStatus("Couldn't sign out — try again.");
  }
}

export async function initAuth() {
  banner = document.querySelector('[data-auth-banner]');
  if (!banner || !isConfigured()) return;

  // Required children of the banner markup. If the template drifts and one
  // of these selectors stops matching, fail closed (banner stays hidden)
  // rather than throwing out of initAuth() and taking initInterests() /
  // initComments() down with it in main.js's .then() chain.
  const form = banner.querySelector('[data-auth-form]');
  const signoutButton = banner.querySelector('[data-auth-signout]');
  if (!form || !signoutButton) return;

  form.addEventListener('submit', onSubmit);
  signoutButton.addEventListener('click', onSignOut);
  banner.hidden = false;

  try {
    PEOPLE = await getProfiles();
  } catch (e) {
    // Sign-in still works, but every consumer of PEOPLE (interest rows,
    // comment authorship labels) degrades to its own "couldn't load" state —
    // an empty roster is not silently equivalent to a working one.
    PEOPLE = [];
  }

  try {
    const session = await getSession();
    user = session ? session.user : null;
  } catch (e) {
    user = null;
  }

  // Runs after getSession() has resolved: supabase-js's client detects a
  // session in the URL (the success case: access_token/refresh_token) as
  // part of its own initialization, which happens no later than the first
  // call into the client — awaiting db() inside getSession() above is that
  // first call. By the time we're here, the client has already had its
  // chance to consume a success fragment, so inspecting/clearing the hash
  // now cannot race or interfere with it. This function only acts when the
  // fragment carries error params, which the client does not consume, so
  // even if that reasoning were wrong for some edge case, the success path
  // is untouched by construction.
  consumeAuthErrorFromHash();
  render();

  try {
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
  } catch (e) {
    // onAuthStateChange() awaits db(), which rejects if the CDN import
    // failed. Swallow rather than reject initAuth(): main.js's .then()
    // chain must still run initInterests()/initComments() so they can render
    // their own "couldn't load" states, same reasoning as the DOM-lookup
    // guard above. The banner already rendered whatever session it got, it
    // just won't hear about future sign-in/sign-out events this page load.
  }
}
