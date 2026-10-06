-- "Who uses fluoroscopy" is now its own scene 6 (speaker 1, right after the s02 poll), so every scene from 6 on moves down by one.
-- Answer keys, saved answers and each room's current scene follow it.
-- Safe to run twice: it only shifts while s04's key is still at its old place (7).

do $$
begin
  if not exists (select 1 from public.answer_keys where scene_index = 7) then
    raise notice 'already shifted, nothing to do';
    return;
  end if;

  -- Two steps (+1000 then -999) so no row ever collides with a neighbour's old index.
  update public.answer_keys set scene_index = scene_index + 1000 where scene_index >= 6;
  update public.answer_keys set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.responses set scene_index = scene_index + 1000 where scene_index >= 6;
  update public.responses set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.session_state set scene_index = scene_index + 1 where scene_index >= 6;
end $$;
