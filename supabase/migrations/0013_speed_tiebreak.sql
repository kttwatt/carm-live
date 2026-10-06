-- Equal scores: the faster one ranks higher.
-- Speed = total seconds after the room's first answer to each question (submitted_at is the last change);
-- a question left unanswered counts as its slowest answer. Same rule as totalSeconds in lib/scoring.ts.
-- Safe to run twice.

-- Seconds after the room's first answer, per scored answer.
create or replace view public.answer_seconds with (security_invoker = false) as
  select r.session_id, r.user_id, r.scene_index,
         extract(epoch from r.submitted_at - min(r.submitted_at) over (partition by r.session_id, r.scene_index))::float8 as secs
  from responses r join answer_keys k on k.scene_index = r.scene_index;
revoke all on public.answer_seconds from anon, authenticated;

-- Same columns as before, plus secs at the end.
create or replace view public.participant_scores with (security_invoker = false) as
  with base as (
    select p.session_id, p.user_id, p.nickname, p.joined_at,
           coalesce(sum(public.score_answer(r.answer, k.correct, k.multi)), 0)::int as score,
           count(r.id) filter (where public.score_answer(r.answer, k.correct, k.multi) = 100)::int as correct,
           count(r.id)::int as answered
    from participants p
    left join (responses r join answer_keys k on k.scene_index = r.scene_index)
      on r.session_id = p.session_id and r.user_id = p.user_id
    group by p.session_id, p.user_id, p.nickname, p.joined_at
  ),
  slowest as (
    select session_id, scene_index, max(secs) as secs from answer_seconds group by session_id, scene_index
  )
  select b.session_id, b.user_id, b.nickname, b.joined_at, b.score, b.correct, b.answered,
         coalesce((select sum(coalesce(a.secs, s.secs))
                   from slowest s
                   left join answer_seconds a
                     on a.session_id = s.session_id and a.scene_index = s.scene_index and a.user_id = b.user_id
                   where s.session_id = b.session_id), 0)::float8 as secs
  from base b;
revoke all on public.participant_scores from anon, authenticated;

-- Ties on score are broken by speed; only an exact tie on both shares a rank.
create or replace function public.leaderboard(p_room text, p_limit int default 10)
returns table (rank int, nickname text, score int)
language sql stable security definer set search_path = public as $$
  select (rank() over (order by s.score desc, s.secs))::int, s.nickname, s.score
  from participant_scores s join sessions x on x.id = s.session_id
  where x.room_code = upper(p_room)
  order by s.score desc, s.secs, s.joined_at
  limit least(greatest(p_limit, 1), 50)
$$;

create or replace function public.my_result(p_room text)
returns table (score int, rank int, total int, correct int, answered int, questions int)
language sql stable security definer set search_path = public as $$
  with ranked as (
    select s.*, (rank() over (order by s.score desc, s.secs))::int as rk, (count(*) over ())::int as n
    from participant_scores s join sessions x on x.id = s.session_id
    where x.room_code = upper(p_room)
  )
  select score, rk, n, correct, answered, (select count(*)::int from answer_keys)
  from ranked where user_id = auth.uid()
$$;

-- The presenter's summary also gets each answer's seconds (new column, so the function is recreated).
drop function if exists public.session_report(text, text);
create function public.session_report(p_room text, p_key text)
returns table (participant_id uuid, nickname text, joined_at timestamptz, scene_index int, answer text[], points int, secs float8)
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_hash text;
begin
  select s.id, x.presenter_key_hash into v_id, v_hash
  from sessions s join session_secrets x on x.session_id = s.id
  where s.room_code = upper(p_room);
  if v_id is null then raise exception 'room not found'; end if;
  if v_hash <> crypt(p_key, v_hash) then raise exception 'presenter key invalid'; end if;
  return query
    select p.id, p.nickname, p.joined_at, r.scene_index, r.answer,
           case when k.scene_index is null then null else public.score_answer(r.answer, k.correct, k.multi) end,
           a.secs
    from participants p
    left join responses r on r.session_id = p.session_id and r.user_id = p.user_id
    left join answer_keys k on k.scene_index = r.scene_index
    left join answer_seconds a on a.session_id = r.session_id and a.user_id = r.user_id and a.scene_index = r.scene_index
    where p.session_id = v_id
    order by p.joined_at, r.scene_index;
end $$;

revoke all on function public.leaderboard(text, int) from public;
revoke all on function public.my_result(text) from public;
revoke all on function public.session_report(text, text) from public;
grant execute on function public.leaderboard(text, int) to anon, authenticated;
grant execute on function public.my_result(text) to authenticated;
grant execute on function public.session_report(text, text) to anon, authenticated;
