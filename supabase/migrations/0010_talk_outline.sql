-- The talk outline is now scene 3 (right after the opening video), so every scene from 3 on moves down by one.
-- Answer keys, saved answers and each room's current scene follow it.
-- Safe to run twice: it only shifts while the first question is still at its old place (4).

do $$
begin
  if (select min(scene_index) from public.answer_keys) <> 4 then
    raise notice 'already shifted, nothing to do';
    return;
  end if;

  -- Two steps (+1000 then -999) so no row ever collides with a neighbour's old index.
  update public.answer_keys set scene_index = scene_index + 1000 where scene_index >= 3;
  update public.answer_keys set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.responses set scene_index = scene_index + 1000 where scene_index >= 3;
  update public.responses set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.session_state set scene_index = scene_index + 1 where scene_index >= 3;
end $$;
