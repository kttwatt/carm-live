-- Scores: computed on the server from answers and a hidden answer key.
-- Scene indexes follow lib/scenes.ts; answers follow lib/questions.ts. Keep all three in step.

create table public.answer_keys (
  scene_index int primary key,
  correct text[] not null,
  multi boolean not null default false
);
alter table public.answer_keys enable row level security; -- no policies: nobody reads the key directly

insert into public.answer_keys (scene_index, correct, multi) values
  (3,  array['patient','surgeon','scrub','circ','anes','tech'], true), -- s02
  (5,  array['patient'],    false), -- s04
  (7,  array['C'],          false), -- s06
  (9,  array['collar_out'], false), -- s08
  (10, array['assess'],     false)  -- s09
on conflict (scene_index) do update set correct = excluded.correct, multi = excluded.multi;

-- Same rule as scoreAnswer in lib/scoring.ts.
create or replace function public.score_answer(p_answer text[], p_correct text[], p_multi boolean)
returns int language sql immutable as $$
  select case
    when not p_multi then
      case when cardinality(p_answer) = 1 and p_answer[1] = any(p_correct) then 100 else 0 end
    else greatest(0, floor(100.0 * (
      (select count(*) from unnest(p_answer) a where a = any(p_correct))
      - (select count(*) from unnest(p_answer) a where not (a = any(p_correct)))
    ) / cardinality(p_correct)))::int
  end
$$;

create or replace view public.participant_scores with (security_invoker = false) as
  select p.session_id, p.user_id, p.nickname, p.joined_at,
         coalesce(sum(public.score_answer(r.answer, k.correct, k.multi)), 0)::int as score,
         count(r.id) filter (where public.score_answer(r.answer, k.correct, k.multi) = 100)::int as correct,
         count(r.id)::int as answered
  from participants p
  left join (responses r join answer_keys k on k.scene_index = r.scene_index)
    on r.session_id = p.session_id and r.user_id = p.user_id
  group by p.session_id, p.user_id, p.nickname, p.joined_at;
revoke all on public.participant_scores from anon, authenticated;

-- Nicknames and scores only; ties share a rank.
create or replace function public.leaderboard(p_room text, p_limit int default 10)
returns table (rank int, nickname text, score int)
language sql stable security definer set search_path = public as $$
  select (rank() over (order by s.score desc))::int, s.nickname, s.score
  from participant_scores s join sessions x on x.id = s.session_id
  where x.room_code = upper(p_room)
  order by s.score desc, s.joined_at
  limit least(greatest(p_limit, 1), 50)
$$;

create or replace function public.my_result(p_room text)
returns table (score int, rank int, total int, correct int, answered int, questions int)
language sql stable security definer set search_path = public as $$
  with ranked as (
    select s.*, (rank() over (order by s.score desc))::int as rk, (count(*) over ())::int as n
    from participant_scores s join sessions x on x.id = s.session_id
    where x.room_code = upper(p_room)
  )
  select score, rk, n, correct, answered, (select count(*)::int from answer_keys)
  from ranked where user_id = auth.uid()
$$;

revoke all on function public.leaderboard(text, int) from public;
revoke all on function public.my_result(text) from public;
grant execute on function public.leaderboard(text, int) to anon, authenticated;
grant execute on function public.my_result(text) to authenticated;
