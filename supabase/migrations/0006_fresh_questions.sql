-- Entering a question (forward or back) starts it fresh: its earlier answers are deleted.
-- Entering the first question clears every answer in the room, so a restart begins from zero.
-- "Reset scene" (phase back to idle on the same scene) also clears that scene's answers.
-- Re-opening after a lock on the same scene keeps answers.

create or replace function public.set_session_state(p_room text, p_key text, p_scene int, p_phase text)
returns setof public.session_state
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_hash text;
  v_old_scene int;
  v_first_question int := (select min(scene_index) from answer_keys);
begin
  select s.id, x.presenter_key_hash, st.scene_index into v_id, v_hash, v_old_scene
  from sessions s
  join session_secrets x on x.session_id = s.id
  join session_state st on st.session_id = s.id
  where s.room_code = upper(p_room);
  if v_id is null then raise exception 'room not found'; end if;
  if v_hash <> crypt(p_key, v_hash) then raise exception 'presenter key invalid'; end if;

  if p_scene = v_first_question and p_scene <> v_old_scene then
    delete from responses where session_id = v_id;
  elsif (p_scene <> v_old_scene and p_phase in ('idle', 'open'))
     or (p_scene = v_old_scene and p_phase = 'idle') then
    delete from responses where session_id = v_id and scene_index = p_scene;
  end if;

  return query
    update session_state
       set scene_index = p_scene, phase = p_phase, version = version + 1, updated_at = now()
     where session_id = v_id
    returning *;
end $$;
