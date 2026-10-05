-- The opening video is now scene 2 (right after the cover), so every scene from 2 on moves down by one.
-- Answer keys, saved answers and each room's current scene follow it.
-- Safe to run twice: it only shifts while the first question is still at its old place (3).

do $$
begin
  if (select min(scene_index) from public.answer_keys) <> 3 then
    raise notice 'already shifted, nothing to do';
    return;
  end if;

  -- Two steps (+1000 then -999) so no row ever collides with a neighbour's old index.
  update public.answer_keys set scene_index = scene_index + 1000 where scene_index >= 2;
  update public.answer_keys set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.responses set scene_index = scene_index + 1000 where scene_index >= 2;
  update public.responses set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.session_state set scene_index = scene_index + 1 where scene_index >= 2;
end $$;
