-- Run in Supabase SQL editor before using kickoff cron / scoring APIs.

-- Points awarded per prediction after a match is scored.
alter table predictions
  add column if not exists points integer;

-- One row per match: tracks auto-collection at kickoff and final scoring.
create table if not exists match_state (
  match_id integer primary key,
  predictions_collected_at timestamptz,
  scored_at timestamptz,
  final_home_score integer,
  final_away_score integer
);

-- RLS: allow anon key (same as predictions) for server-side upserts.
alter table match_state enable row level security;

create policy "Allow anon select on match_state"
  on match_state for select to anon using (true);

create policy "Allow anon insert on match_state"
  on match_state for insert to anon with check (true);

create policy "Allow anon update on match_state"
  on match_state for update to anon using (true) with check (true);
