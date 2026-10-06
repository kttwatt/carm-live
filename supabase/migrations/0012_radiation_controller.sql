-- "Who may control an X-ray machine" (draft ministerial regulation 2569, item 9) is now its own scene 8, so every scene from 8 on
-- moves down by one (0-based index 7). Answer keys, saved answers and each room's current scene follow it.
-- Run after 0011. Safe to run twice: it only shifts while s04's key is still at its 0011 place (8).

do $$
begin
  if not exists (select 1 from public.answer_keys where scene_index = 8) then
    raise notice 'already shifted (or 0011 not run yet), nothing to do';
    return;
  end if;

  -- Two steps (+1000 then -999) so no row ever collides with a neighbour's old index.
  update public.answer_keys set scene_index = scene_index + 1000 where scene_index >= 7;
  update public.answer_keys set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.responses set scene_index = scene_index + 1000 where scene_index >= 7;
  update public.responses set scene_index = scene_index - 999 where scene_index >= 1000;

  update public.session_state set scene_index = scene_index + 1 where scene_index >= 7;
end $$;
