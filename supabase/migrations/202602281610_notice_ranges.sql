alter table public.notices
  add column if not exists budget_min numeric,
  add column if not exists budget_max numeric,
  add column if not exists trl_min smallint,
  add column if not exists trl_max smallint;

alter table public.notices
  drop constraint if exists notices_trl_bounds;

alter table public.notices
  add constraint notices_trl_bounds
  check (
    (trl_min is null or (trl_min >= 1 and trl_min <= 9))
    and (trl_max is null or (trl_max >= 1 and trl_max <= 9))
    and (trl_min is null or trl_max is null or trl_min <= trl_max)
  );
