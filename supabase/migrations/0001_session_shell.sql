-- Phase A: live session shell.
-- State changes only go through set_session_state (checks the presenter key);
-- clients receive them through Realtime Postgres Changes on session_state,
-- so a participant cannot fake a scene change by broadcasting.

create extension if not exists pgcrypto;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-Z0-9]{4,8}$'),
  title text not null default '',
  status text not null default 'live' check (status in ('live', 'ended')),
  created_at timestamptz not null default now()
);

-- Kept apart from sessions so no policy can ever expose it.
create table public.session_secrets (
  session_id uuid primary key references public.sessions on delete cascade,
  presenter_key_hash text not null
);

create table public.session_state (
  session_id uuid primary key references public.sessions on delete cascade,
  scene_index int not null default 0 check (scene_index >= 0),
  phase text not null default 'idle' check (phase in ('idle', 'open', 'locked', 'revealed')),
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions on delete cascade,
  user_id uuid not null default auth.uid(),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 24),
  joined_at timestamptz not null default now(),
  unique (session_id, user_id)
);

alter table public.sessions enable row level security;
alter table public.session_secrets enable row level security;
alter table public.session_state enable row level security;
alter table public.participants enable row level security;

create policy "anyone reads sessions" on public.sessions for select to anon, authenticated using (true);
create policy "anyone reads state" on public.session_state for select to anon, authenticated using (true);
create policy "participant reads own row" on public.participants for select to authenticated using (user_id = auth.uid());
create policy "participant joins as self" on public.participants for insert to authenticated with check (user_id = auth.uid());
create policy "participant renames self" on public.participants for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Room code alphabet skips look-alike characters (0/O, 1/I/L).
create or replace function public.create_session(p_title text)
returns table (room_code text, presenter_key text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_code text;
  v_key text := encode(gen_random_bytes(18), 'hex');
  v_id uuid;
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  loop
    v_code := (select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
               from generate_series(1, 6));
    exit when not exists (select 1 from sessions s where s.room_code = v_code);
  end loop;
  insert into sessions (room_code, title) values (v_code, coalesce(p_title, '')) returning id into v_id;
  insert into session_secrets (session_id, presenter_key_hash) values (v_id, crypt(v_key, gen_salt('bf')));
  insert into session_state (session_id) values (v_id);
  return query select v_code, v_key;
end $$;

create or replace function public.set_session_state(p_room text, p_key text, p_scene int, p_phase text)
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
  return query
    update session_state
       set scene_index = p_scene, phase = p_phase, version = version + 1, updated_at = now()
     where session_id = v_id
    returning *;
end $$;

revoke all on function public.create_session(text) from public;
revoke all on function public.set_session_state(text, text, int, text) from public;
grant execute on function public.create_session(text) to anon, authenticated;
grant execute on function public.set_session_state(text, text, int, text) to anon, authenticated;

alter publication supabase_realtime add table public.session_state;
