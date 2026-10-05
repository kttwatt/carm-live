-- Answers save as soon as a choice is tapped (no submit button).
-- An empty answer clears it; changes are throttled to 4 per second instead of 1.

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
  if not exists (select 1 from participants p where p.session_id = v_id and p.user_id = v_uid) then
    raise exception 'join the room first';
  end if;
  if coalesce(cardinality(p_answer), 0) = 0 then
    delete from responses where session_id = v_id and scene_index = p_scene and user_id = v_uid;
    return;
  end if;
  if cardinality(p_answer) > 8
     or exists (select 1 from unnest(p_answer) a where char_length(a) not between 1 and 24) then
    raise exception 'invalid answer';
  end if;
  insert into responses (session_id, scene_index, user_id, answer)
  values (v_id, p_scene, v_uid, p_answer)
  on conflict (session_id, scene_index, user_id) do update
    set answer = excluded.answer, submitted_at = now()
    where responses.submitted_at < now() - interval '250 milliseconds';
end $$;
