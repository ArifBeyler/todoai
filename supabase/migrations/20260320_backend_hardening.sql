create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'generation_job_type') then
    create type public.generation_job_type as enum ('avatar', 'daily_scene', 'regenerate');
  end if;
  if not exists (select 1 from pg_type where typname = 'generation_job_status') then
    create type public.generation_job_status as enum ('pending', 'leased', 'processing', 'succeeded', 'failed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'scene_safety') then
    create type public.scene_safety as enum ('scene_safe', 'needs_review', 'not_scene_safe');
  end if;
end $$;

alter table public.users
  add column if not exists onboarding_step text not null default 'welcome',
  add column if not exists onboarding_status text not null default 'in_progress',
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists avatar_generation_status text not null default 'not_started',
  add column if not exists avatar_visual_id uuid references public.generated_visuals(id) on delete set null,
  add column if not exists notification_opt_in boolean not null default false,
  add column if not exists timezone text not null default 'UTC',
  add column if not exists locale text not null default 'tr',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  source text not null default 'mobile',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, consent_type, consent_version)
);

create table if not exists public.task_intents (
  id uuid primary key default gen_random_uuid(),
  todo_id uuid not null unique references public.todos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  normalized_text text not null,
  semantic_category text not null,
  confidence numeric(5,4) not null default 0,
  scene_safety public.scene_safety not null default 'needs_review',
  moderation_reason text,
  abstract_reason text,
  parsed_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_type public.generation_job_type not null,
  status public.generation_job_status not null default 'pending',
  idempotency_key text not null,
  priority smallint not null default 5,
  source text not null default 'app',
  payload jsonb not null default '{}'::jsonb,
  prompt_version text not null default 'v1',
  prompt_snapshot text,
  provider text not null default 'fal.ai',
  provider_job_id text,
  provider_response jsonb,
  visual_id uuid references public.generated_visuals(id) on delete set null,
  lease_owner text,
  lease_expires_at timestamptz,
  attempts smallint not null default 0,
  max_attempts smallint not null default 3,
  last_error text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.generation_job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs(id) on delete cascade,
  attempt_number smallint not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  outcome text not null default 'processing',
  error_message text,
  provider_request jsonb,
  provider_response jsonb,
  unique (job_id, attempt_number)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  external_event_id text,
  signature_valid boolean not null default false,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  process_status text not null default 'received',
  process_error text
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_key text not null,
  channel text not null default 'push',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  source_entity text not null,
  source_id uuid,
  severity text not null default 'low',
  reason text not null,
  status text not null default 'open',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.cost_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  job_id uuid references public.generation_jobs(id) on delete set null,
  provider text not null,
  cost_usd numeric(10,5) not null default 0,
  tokens_in integer,
  tokens_out integer,
  image_count integer,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists idx_generation_jobs_user_status on public.generation_jobs (user_id, status);
create index if not exists idx_generation_jobs_ready on public.generation_jobs (status, available_at, priority);
create index if not exists idx_generation_jobs_provider_job on public.generation_jobs (provider_job_id);
create index if not exists idx_task_intents_user_scene on public.task_intents (user_id, scene_safety);
create index if not exists idx_notification_events_user_created on public.notification_events (user_id, created_at desc);
create index if not exists idx_webhook_events_external_id on public.webhook_events (provider, external_event_id);

alter table public.user_consents enable row level security;
alter table public.task_intents enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.generation_job_attempts enable row level security;
alter table public.webhook_events enable row level security;
alter table public.notification_events enable row level security;
alter table public.moderation_flags enable row level security;
alter table public.cost_ledger enable row level security;

drop policy if exists "Users can manage own consents" on public.user_consents;
create policy "Users can manage own consents"
  on public.user_consents
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own task intents" on public.task_intents;
create policy "Users can read own task intents"
  on public.task_intents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can read own generation jobs" on public.generation_jobs;
create policy "Users can read own generation jobs"
  on public.generation_jobs
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own generation jobs" on public.generation_jobs;
create policy "Users can insert own generation jobs"
  on public.generation_jobs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own notifications" on public.notification_events;
create policy "Users can read own notifications"
  on public.notification_events
  for select
  using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_touch_updated_at on public.users;
create trigger trg_users_touch_updated_at
before update on public.users
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_task_intents_touch_updated_at on public.task_intents;
create trigger trg_task_intents_touch_updated_at
before update on public.task_intents
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_generation_jobs_touch_updated_at on public.generation_jobs;
create trigger trg_generation_jobs_touch_updated_at
before update on public.generation_jobs
for each row execute procedure public.touch_updated_at();

create or replace function public.claim_generation_jobs(worker_name text, max_jobs integer default 5)
returns setof public.generation_jobs
language plpgsql
security definer
as $$
begin
  return query
  with candidates as (
    select id
    from public.generation_jobs
    where status = 'pending'
      and available_at <= now()
      and attempts < max_attempts
    order by priority asc, created_at asc
    limit greatest(max_jobs, 1)
    for update skip locked
  )
  update public.generation_jobs j
  set status = 'leased',
      lease_owner = worker_name,
      lease_expires_at = now() + interval '2 minutes',
      updated_at = now()
  from candidates c
  where j.id = c.id
  returning j.*;
end;
$$;
