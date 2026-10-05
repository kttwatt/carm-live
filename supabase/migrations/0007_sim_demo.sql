-- Phase D: a presenter-controlled radiation demo shared with the projector and phones.
-- sim holds the C-arm setup, the shield and whether fluoroscopy is on; it rides along in session_state
-- so every client gets it through the same realtime change as scene changes.

alter table public.session_state add column if not exists sim jsonb;

create or replace function public.set_sim(p_room text, p_key text, p_sim jsonb)
returns setof public.session_state
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
  v_hash text;
begin
  select s.id, x.presenter_key_hash into v_id, v_hash
  from sessions s join session_secrets x on x.session_id = s.id
  where s.room_code = upper(p_room);
  if v_id is null then raise exception 'room not found'; end if;
  if v_hash <> crypt(p_key, v_hash) then raise exception 'presenter key invalid'; end if;
  if p_sim is not null and (jsonb_typeof(p_sim) <> 'object' or length(p_sim::text) > 2000) then
    raise exception 'invalid demo settings';
  end if;
  return query
    update session_state
       set sim = p_sim, version = version + 1, updated_at = now()
     where session_id = v_id
    returning *;
end $$;

revoke all on function public.set_sim(text, text, jsonb) from public;
grant execute on function public.set_sim(text, text, jsonb) to anon, authenticated;
