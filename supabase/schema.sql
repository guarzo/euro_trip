-- Applied by hand in the Supabase SQL editor. Committed so the schema is
-- reviewable and reproducible; this project has no migration tooling.
--
-- WARNING: This file drops and recreates every table. After the four users
-- and their profiles rows are seeded (see the README's Supabase setup section),
-- re-running this file will destroy all comments, interest marks, and profile
-- rows. Do not re-run it to "check something" — re-run is only safe before
-- users are created.
--
-- Authorship is enforced here, not in the browser. The anon key ships in the
-- page and the JavaScript belongs to whoever opens devtools; `auth.uid() =
-- user_id` is the only claim in this system that a determined sibling cannot
-- forge.

-- Dropped rather than migrated: the previous tables keyed authorship on a
-- client-chosen `person` string, and their contents are a few days of test
-- marks. See the design doc, "Existing rows are dropped".
drop table if exists interests;
drop table if exists comments;
drop table if exists profiles;

-- Display identity for the four users. Rows are inserted by hand alongside
-- the auth users; there is deliberately no write policy.
create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name    text not null,
  emoji   text not null
);

-- An interest is about a city, a comment is about a page. The cities index
-- renders all eleven toggles on one page, so keying interests on the page
-- would collide them into a single row.
create table interests (
  id           uuid primary key default gen_random_uuid(),
  interest_key text not null,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  state        text not null check (state in ('yes','no')),
  updated_at   timestamptz not null default now(),
  unique (interest_key, user_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  page_path  text not null,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index interests_key_idx on interests (interest_key);
create index comments_path_idx on comments (page_path);

alter table profiles  enable row level security;
alter table interests enable row level security;
alter table comments  enable row level security;

-- Policies are dropped before being recreated: `create policy` has no
-- `if not exists`, so without this the file fails on a second run, which
-- would defeat the "reproducible" intent stated at the top.
drop policy if exists "read profiles"     on profiles;
drop policy if exists "read interests"    on interests;
drop policy if exists "insert interests"  on interests;
drop policy if exists "update interests"  on interests;
drop policy if exists "delete interests"  on interests;
drop policy if exists "read comments"     on comments;
drop policy if exists "insert comments"   on comments;

-- Reads stay open to anon: the site is public and browsable logged out.
create policy "read profiles"  on profiles  for select to anon, authenticated using (true);
create policy "read interests" on interests for select to anon, authenticated using (true);
create policy "read comments"  on comments  for select to anon, authenticated using (true);

-- Writes require a session, and may only ever touch your own row.
create policy "insert interests" on interests for insert to authenticated
  with check (auth.uid() = user_id);
create policy "update interests" on interests for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Delete is required: clearing a mark removes the row rather than storing an
-- "unset" state, so the table only ever holds actual opinions.
create policy "delete interests" on interests for delete to authenticated
  using (auth.uid() = user_id);

create policy "insert comments" on comments for insert to authenticated
  with check (auth.uid() = user_id);
-- Deliberately no update or delete policy on comments. Editing or removing a
-- comment is a SQL console job, which is the right level of friction for four
-- people.
