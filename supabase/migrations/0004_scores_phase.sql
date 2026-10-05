-- After each question is revealed, the presenter shows the running scores before moving on.
alter table public.session_state drop constraint if exists session_state_phase_check;
alter table public.session_state
  add constraint session_state_phase_check check (phase in ('idle', 'open', 'locked', 'revealed', 'scores'));
