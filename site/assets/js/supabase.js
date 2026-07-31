// The only file that performs network I/O. Everything else in the app talks
// to Supabase through these functions and never sees a query.
//
// The anon key is public by design and ships in the page. The database CHECK
// constraints and RLS policies are the real guardrails, not secrecy.
//
// The client library is imported DYNAMICALLY, inside the configured-check.
// A static top-level `import ... from 'https://esm.sh/...'` would fetch the
// CDN on every page load for every reader — including readers who never
// interact, and including the unconfigured state — and a blocked or slow CDN
// would reject the whole module graph, taking `initUI()`, `initInterests()`,
// and `initComments()` down with it. A static site must not lose its nav
// because a CDN is unreachable.

const config = window.SUPABASE_CONFIG || { url: '', anonKey: '' };

const CDN = 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise = null;

export function isConfigured() {
  return Boolean(config.url && config.anonKey);
}

// Resolves to a client, or rejects. Callers already handle rejection by
// rendering their failure state, so a CDN outage reads as "couldn't load"
// rather than as a broken page.
function db() {
  if (!isConfigured()) return Promise.reject(new Error('Supabase is not configured'));
  if (!clientPromise) {
    clientPromise = import(CDN).then(function (mod) {
      return mod.createClient(config.url, config.anonKey);
    }).catch(function (err) {
      // Drop the memo so a later call can attempt the import again.
      //
      // Note what this does NOT buy: if the CDN fetch itself failed, the
      // browser has cached that failure in the module map against this URL
      // for the life of the page, so the retried import() resolves to the
      // same rejection without touching the network. Recovery from a CDN
      // outage is a page reload, which is what the failure copy tells the
      // reader to do. Only a failure inside createClient() genuinely retries.
      // Cache-busting the URL would make in-session recovery work, and was
      // deliberately not done: it complicates the one file that must stay
      // simple for a case a refresh already handles.
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export async function getSession() {
  const { data } = await (await db()).auth.getSession();
  return data.session;
}

// shouldCreateUser: false is belt-and-braces. The dashboard's "allow new
// users to sign up" toggle is the real control, but a setting that lives only
// in a dashboard is invisible in a diff; this makes the intent reviewable.
export async function signIn(email, redirectTo) {
  const { error } = await (await db()).auth.signInWithOtp({
    email: email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo }
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await (await db()).auth.signOut();
  if (error) throw error;
}

export async function onAuthStateChange(fn) {
  (await db()).auth.onAuthStateChange(function (_event, session) {
    fn(session ? session.user : null);
  });
}

export async function getProfiles() {
  const { data, error } = await (await db())
    .from('profiles')
    .select('user_id, name, emoji');
  if (error) throw error;
  return data || [];
}

export async function getInterests() {
  const { data, error } = await (await db())
    .from('interests')
    .select('interest_key, user_id, state');
  if (error) throw error;
  return data || [];
}

// user_id is omitted deliberately: the column defaults to auth.uid(), so the
// author is whoever holds the session and cannot be spoofed by the caller.
export async function setInterest(interestKey, state) {
  const { error } = await (await db())
    .from('interests')
    .upsert(
      { interest_key: interestKey, state: state, updated_at: new Date().toISOString() },
      { onConflict: 'interest_key,user_id' }
    );
  if (error) throw error;
}

// No .eq('user_id', ...) is needed or wanted: the delete policy already scopes
// this to auth.uid(), so a missing filter deletes only your own row.
export async function clearInterest(interestKey) {
  const { error } = await (await db())
    .from('interests')
    .delete()
    .eq('interest_key', interestKey);
  if (error) throw error;
}

export async function getComments(pagePath) {
  const { data, error } = await (await db())
    .from('comments')
    .select('id, user_id, body, created_at')
    .eq('page_path', pagePath)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addComment(pagePath, body) {
  const { error } = await (await db())
    .from('comments')
    .insert({ page_path: pagePath, body: body });
  if (error) throw error;
}
