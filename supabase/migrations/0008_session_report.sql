-- Score summary for the presenter: every participant with each answer and its points.
-- Needs the presenter key, because it lists individual answers.

create or replace function public.session_report(p_room text, p_key text)
returns table (participant_id uuid, nickname text, joined_at timestamptz, scene_index int, answer text[], points int)
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
           case when k.scene_index is null then null else public.score_answer(r.answer, k.correct, k.multi) end
    from participants p
    left join responses r on r.session_id = p.session_id and r.user_id = p.user_id
    left join answer_keys k on k.scene_index = r.scene_index
    where p.session_id = v_id
    order by p.joined_at, r.scene_index;
end $$;

revoke all on function public.session_report(text, text) from public;
grant execute on function public.session_report(text, text) to anon, authenticated;
