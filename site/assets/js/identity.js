// Who is using this device. This is the only thing localStorage still holds —
// the opinions themselves live in Supabase. Losing this value costs a tap,
// not data.

const STORAGE_KEY = 'euro-trip-person';

const listeners = [];
let banner = null;

export let PEOPLE = [];

export function getPerson() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    // A key from an older or hand-edited value must not be trusted: it would
    // be rejected by the database CHECK constraint anyway, so treat it as
    // unpicked and let the user choose again.
    return PEOPLE.some(function (p) { return p.key === value; }) ? value : null;
  } catch (e) {
    // Private browsing. Identity lasts for this page view only.
    return null;
  }
}

export function setPerson(key) {
  if (!PEOPLE.some(function (p) { return p.key === key; })) return;
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    // Not fatal — render() still reflects the choice for this page view.
  }
  render();
  notify(key);
}

export function clearPerson() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Nothing to do; render() below still returns the UI to the picker.
  }
  render();
  notify(null);
}

export function onPersonChange(fn) {
  listeners.push(fn);
}

export function personLabel(key) {
  const person = PEOPLE.find(function (p) { return p.key === key; });
  return person ? person.emoji + ' ' + person.name : key;
}

function notify(value) {
  listeners.forEach(function (fn) { fn(value); });
}

function render() {
  if (!banner) return;
  const current = getPerson();
  const picker = banner.querySelector('[data-identity-picker]');
  const currentEl = banner.querySelector('[data-identity-current]');
  const label = banner.querySelector('[data-identity-label]');

  picker.hidden = current !== null;
  currentEl.hidden = current === null;
  if (current) label.textContent = personLabel(current);
}

export function initIdentity() {
  banner = document.querySelector('[data-identity-banner]');
  if (!banner) return;

  try {
    PEOPLE = JSON.parse(banner.dataset.people) || [];
  } catch (e) {
    PEOPLE = [];
  }
  if (PEOPLE.length === 0) return;

  const choices = banner.querySelector('[data-identity-choices]');
  PEOPLE.forEach(function (person) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'identity-choice';
    btn.textContent = person.emoji + ' ' + person.name;
    btn.addEventListener('click', function () { setPerson(person.key); });
    choices.appendChild(btn);
  });

  banner.querySelector('[data-identity-switch]')
    .addEventListener('click', clearPerson);

  banner.hidden = false;
  render();
}
