-- Scores for one room, computed from that room's rows only.
-- The participant_scores view (0013) recomputed every room's answer times once per participant, so one top-10
-- call took ~0.3 s of database time with 100 people x 5 answers, and 100 phones asking at once queued for
-- 15-30 s (load test 2026-10-07). Same results and tie-break as 0013: score, then total seconds after the room's
-- first answer to each question, a question left unanswered counting as that question's slowest answer.
-- Safe to run twice.

create or replace function public.room_scores(p_session uuid)
returns table (user_id uuid, nickname text, joined_at timestamptz, score int, correct int, answered int, secs float8)
language sql stable security definer set search_path = public as $$
  with r as (
    select r.user_id, r.scene_index,
           public.score_answer(r.answer, k.correct, k.multi) as pts,
           extract(epoch from r.submitted_at - min(r.submitted_at) over (partition by r.scene_index))::float8 as secs
    from responses r join answer_keys k on k.scene_index = r.scene_index
    where r.session_id = p_session
  ),
  slowest as (select scene_index, max(secs) as secs from r group by scene_index),
  per as (
    -- an answered question counts its own seconds instead of the slowest: total = sum(slowest) + sum(own - slowest)
    select p.user_id, p.nickname, p.joined_at,
           coalesce(sum(r.pts), 0)::int as score,
           (count(*) filter (where r.pts = 100))::int as correct,
           count(r.scene_index)::int as answered,
           coalesce(sum(r.secs - s.secs), 0) as delta
    from participants p
    left join r on r.user_id = p.user_id
    left join slowest s on s.scene_index = r.scene_index
    where p.session_id = p_session
    group by p.user_id, p.nickname, p.joined_at
  )
  select user_id, nickname, joined_at, score, correct, answered,
         ((select coalesce(sum(secs), 0) from slowest) + delta)::float8
  from per
$$;
revoke all on function public.room_scores(uuid) from public, anon, authenticated;

create or replace function public.leaderboard(p_room text, p_limit int default 10)
returns table (rank int, nickname text, score int)
language sql stable security definer set search_path = public as $$
  select (rank() over (order by s.score desc, s.secs))::int, s.nickname, s.score
  from sessions x cross join lateral public.room_scores(x.id) s
  where x.room_code = upper(p_room)
  order by s.score desc, s.secs, s.joined_at
  limit least(greatest(p_limit, 1), 50)
$$;

create or replace function public.my_result(p_room text)
returns table (score int, rank int, total int, correct int, answered int, questions int)
language sql stable security definer set search_path = public as $$
  with ranked as (
    select s.*, (rank() over (order by s.score desc, s.secs))::int as rk, (count(*) over ())::int as n
    from sessions x cross join lateral public.room_scores(x.id) s
    where x.room_code = upper(p_room)
  )
  select score, rk, n, correct, answered, (select count(*)::int from answer_keys)
  from ranked where user_id = auth.uid()
$$;

revoke all on function public.leaderboard(text, int) from public;
revoke all on function public.my_result(text) from public;
grant execute on function public.leaderboard(text, int) to anon, authenticated;
grant execute on function public.my_result(text) to authenticated;
