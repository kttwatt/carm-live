-- The projector now shows each choice's count live while the room answers,
-- so per-choice counts are public once the current question opens (not only after the reveal).
-- Safe to run twice.
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
            or (v_scene = p_scene and v_phase <> 'idle');
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

revoke all on function public.response_summary(text, int, text) from public;
grant execute on function public.response_summary(text, int, text) to anon, authenticated;
