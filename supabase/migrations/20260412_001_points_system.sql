-- Points system: add total_points to users, points_awarded to todos,
-- and a trigger that awards/revokes points when todo completion changes.

alter table public.users
  add column if not exists total_points integer not null default 0;

alter table public.todos
  add column if not exists points_awarded integer not null default 0;

-- ----------------------------------------------------------------
-- award_todo_points()
-- Called by trigger on todos UPDATE.
-- When is_completed flips true  → compute & add points, store amount.
-- When is_completed flips false → subtract previously awarded points.
-- ----------------------------------------------------------------
create or replace function public.award_todo_points()
returns trigger
language plpgsql
security definer
as $$
declare
  v_points integer := 0;
begin
  -- Completing a todo
  if (new.is_completed = true and old.is_completed = false) then

    -- Base points by priority
    v_points := case new.priority
      when 'high'   then 30
      when 'medium' then 20
      else               10  -- low
    end;

    -- Habit bonus (recurring tasks)
    if new.recurrence <> 'once' then
      v_points := v_points + 5;
    end if;

    -- On-time bonus (completed on the due date)
    if new.due_date is not null
       and (new.completed_at at time zone 'UTC')::date = new.due_date then
      v_points := v_points + 5;
    end if;

    -- Store the awarded amount so we can reverse it exactly
    new.points_awarded := v_points;

    -- Increment user total (floor at 0)
    update public.users
      set total_points = greatest(0, total_points + v_points)
      where id = new.user_id;

  -- Un-completing a todo → reverse the previously awarded points
  elsif (new.is_completed = false and old.is_completed = true) then

    v_points := old.points_awarded;
    new.points_awarded := 0;

    if v_points > 0 then
      update public.users
        set total_points = greatest(0, total_points - v_points)
        where id = new.user_id;
    end if;

  end if;

  return new;
end;
$$;

-- Drop existing trigger if it exists (idempotent re-run)
drop trigger if exists trg_award_todo_points on public.todos;

create trigger trg_award_todo_points
  before update of is_completed
  on public.todos
  for each row
  execute function public.award_todo_points();

-- Expose total_points in users RLS (already readable via existing policy)
-- No new policy needed — existing "Users can read own profile" covers it.
