-- Phase B: answers. Writes only through submit_response, which checks that the scene is open.

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  scene_index int not null,
  user_id uuid not null default auth.uid(),
  answer text[] not null,
  submitted_at timestamptz not null default now(),
  unique (session_id, scene_index, user_id)
);

alter table public.responses enable row level security;
create policy "participant reads own answers" on public.responses
  for select to authenticated using (user_id = auth.uid());

create or replace function public.submit_response(p_room text, p_scene int, p_answer text[])
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_scene int;
  v_phase text;
begin
  if v_uid is null then raise exception 'sign in required'; end if;
  select s.id, st.scene_index, st.phase into v_id, v_scene, v_phase
  from sessions s join session_state st on st.session_id = s.id
  where s.room_code = upper(p_room);
  if v_id is null then raise exception 'room not found'; end if;
  if v_scene <> p_scene or v_phase <> 'open' then raise exception 'answers closed'; end if;
  if coalesce(cardinality(p_answer), 0) not between 1 and 8
     or exists (select 1 from unnest(p_answer) a where char_length(a) not between 1 and 24) then
    raise exception 'invalid answer';
  end if;
  if not exists (select 1 from participants p where p.session_id = v_id and p.user_id = v_uid) then
    raise exception 'join the room first';
  end if;
  -- Changing an answer is allowed while open, at most once per second.
  insert into responses (session_id, scene_index, user_id, answer)
  values (v_id, p_scene, v_uid, p_answer)
  on conflict (session_id, scene_index, user_id) do update
    set answer = excluded.answer, submitted_at = now()
    where responses.submitted_at < now() - interval '1 second';
end $$;

-- Respondent count is public; the per-choice counts only for the presenter, or for everyone once revealed.
create or replace function public.response_summary(p_room text, p_scene int, p_key text default null)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_scene int;
  v_phase text;
  v_hash text;
  v_show boolean;
  v_counts jsonb;
begin
  select s.id, st.scene_index, st.phase, x.presenter_key_hash into v_id, v_scene, v_phase, v_hash
  from sessions s
  join session_state st on st.session_id = s.id
  join session_secrets x on x.session_id = s.id
  where s.room_code = upper(p_room);
  if v_id is null then raise exception 'room not found'; end if;
  v_show := (p_key is not null and v_hash = crypt(p_key, v_hash))
            or (v_scene = p_scene and v_phase = 'revealed');
  if v_show then
    select coalesce(jsonb_object_agg(a, n), '{}'::jsonb) into v_counts
    from (select a, count(*) n from responses r, unnest(r.answer) a
          where r.session_id = v_id and r.scene_index = p_scene group by a) t;
  end if;
  return jsonb_build_object(
    'respondents', (select count(*) from responses r where r.session_id = v_id and r.scene_index = p_scene),
    'counts', v_counts
  );
end $$;

revoke all on function public.submit_response(text, int, text[]) from public;
revoke all on function public.response_summary(text, int, text) from public;
grant execute on function public.submit_response(text, int, text[]) to authenticated;
grant execute on function public.response_summary(text, int, text) to anon, authenticated;
