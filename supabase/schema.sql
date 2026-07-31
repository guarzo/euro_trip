-- Applied by hand in the Supabase SQL editor. Committed so the schema is
-- reviewable and reproducible; this project has no migration tooling.

-- An interest is about a city, a comment is about a page. The cities index
-- renders all eleven toggles on one page, so keying interests on the page
-- would collide them into a single row.
create table if not exists interests (
  id           uuid primary key default gen_random_uuid(),
  interest_key text not null,
  person       text not null check (person in ('papa','mama','bubu','gaby')),
  state        text not null check (state in ('yes','no')),
  updated_at   timestamptz not null default now(),
  unique (interest_key, person)
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  page_path  text not null,
  person     text not null check (person in ('papa','mama','bubu','gaby')),
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists interests_key_idx on interests (interest_key);
create index if not exists comments_path_idx on comments (page_path);

alter table interests enable row level security;
alter table comments  enable row level security;

-- The anon key ships in the client bundle; that is what it is for. The CHECK
-- constraints and the body length limit are the real guardrails.
--
-- Policies are dropped before being recreated: `create policy` has no
-- `if not exists`, so without this the whole file fails on a second run,
-- which would defeat the "reproducible" intent stated at the top.
drop policy if exists "anon reads interests"   on interests;
drop policy if exists "anon inserts interests" on interests;
drop policy if exists "anon updates interests" on interests;
drop policy if exists "anon deletes interests" on interests;
drop policy if exists "anon reads comments"    on comments;
drop policy if exists "anon inserts comments"  on comments;

create policy "anon reads interests"   on interests for select to anon using (true);
create policy "anon inserts interests" on interests for insert to anon with check (true);
create policy "anon updates interests" on interests for update to anon using (true) with check (true);
-- Delete is required: clearing a mark removes the row rather than storing
-- an "unset" state, so the table only ever holds actual opinions.
create policy "anon deletes interests" on interests for delete to anon using (true);

-- Deliberately no update or delete policy. Editing or removing a comment is
-- a SQL console job, which is the right level of friction for four people.
create policy "anon reads comments"   on comments for select to anon using (true);
create policy "anon inserts comments" on comments for insert to anon with check (true);
