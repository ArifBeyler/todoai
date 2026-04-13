-- ============================================================
-- Premium AI Todo Backend - Core Schema Migration
-- ============================================================

-- ---------- New enums ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM (
      'trialing', 'active', 'past_due', 'grace', 'expired', 'cancelled', 'unknown'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'photo_quality_status') THEN
    CREATE TYPE public.photo_quality_status AS ENUM (
      'pending_review', 'accepted', 'reupload_required', 'rejected'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'avatar_job_status') THEN
    CREATE TYPE public.avatar_job_status AS ENUM (
      'pending', 'leased', 'processing', 'succeeded', 'failed', 'cancelled', 'dead_letter'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visual_job_status') THEN
    CREATE TYPE public.visual_job_status AS ENUM (
      'pending', 'leased', 'processing', 'succeeded', 'failed', 'cancelled', 'dead_letter'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_kind') THEN
    CREATE TYPE public.task_kind AS ENUM ('task', 'habit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_step_status') THEN
    CREATE TYPE public.onboarding_step_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'home_hero_state') THEN
    CREATE TYPE public.home_hero_state AS ENUM (
      'unsubscribed',
      'subscribed_no_photo',
      'photo_processing',
      'avatar_ready_empty',
      'avatar_ready_tasks_in_progress',
      'eligible_for_generation',
      'generation_pending',
      'visual_ready'
    );
  END IF;
END $$;

-- ---------- Enhance existing users table ----------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS active_avatar_id uuid,
  ADD COLUMN IF NOT EXISTS display_name text;

-- ---------- onboarding_progress ----------
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  step_key    text NOT NULL,
  status      public.onboarding_step_status NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, step_key)
);

-- ---------- user_preferences ----------
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  reminder_default_time    time DEFAULT '09:00',
  quiet_hours_start        time DEFAULT '22:00',
  quiet_hours_end          time DEFAULT '07:00',
  preferred_generation_time time DEFAULT '10:00',
  prompt_style             text NOT NULL DEFAULT 'default',
  theme                    text NOT NULL DEFAULT 'light',
  language                 text NOT NULL DEFAULT 'tr',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

-- ---------- subscriptions ----------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   uuid NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  status                    public.subscription_status NOT NULL DEFAULT 'unknown',
  product_id                text,
  revenuecat_app_user_id    text,
  original_purchase_date    timestamptz,
  trial_ends_at             timestamptz,
  expires_at                timestamptz,
  grace_until               timestamptz,
  cancellation_date         timestamptz,
  entitlements              jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- ---------- subscription_events (immutable ledger) ----------
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rc_event_id     text NOT NULL,
  event_type      text NOT NULL,
  product_id      text,
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rc_event_id)
);

-- ---------- paywall_events ----------
CREATE TABLE IF NOT EXISTS public.paywall_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type  text NOT NULL,
  paywall_id  text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- photo_uploads ----------
CREATE TABLE IF NOT EXISTS public.photo_uploads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path      text NOT NULL,
  bucket            text NOT NULL DEFAULT 'face-raw-private',
  file_size_bytes   integer,
  mime_type         text DEFAULT 'image/jpeg',
  quality_status    public.photo_quality_status NOT NULL DEFAULT 'pending_review',
  validation_error  text,
  consent_id        uuid REFERENCES public.user_consents(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- avatars ----------
CREATE TABLE IF NOT EXISTS public.avatars (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_upload_id   uuid REFERENCES public.photo_uploads(id) ON DELETE SET NULL,
  storage_path      text,
  image_url         text,
  style_version     text NOT NULL DEFAULT 'v1',
  model_version     text NOT NULL DEFAULT 'v1',
  is_active         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- FK for users.active_avatar_id -> avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_active_avatar'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_active_avatar FOREIGN KEY (active_avatar_id) REFERENCES public.avatars(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- avatar_jobs ----------
CREATE TABLE IF NOT EXISTS public.avatar_jobs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_upload_id   uuid REFERENCES public.photo_uploads(id) ON DELETE SET NULL,
  avatar_id         uuid REFERENCES public.avatars(id) ON DELETE SET NULL,
  status            public.avatar_job_status NOT NULL DEFAULT 'pending',
  idempotency_key   text NOT NULL,
  attempt_count     smallint NOT NULL DEFAULT 0,
  max_attempts      smallint NOT NULL DEFAULT 3,
  next_run_at       timestamptz NOT NULL DEFAULT now(),
  locked_by         text,
  locked_until      timestamptz,
  last_error        text,
  provider          text NOT NULL DEFAULT 'fal.ai',
  prompt_version    text NOT NULL DEFAULT 'v1',
  provider_job_id   text,
  provider_response jsonb,
  started_at        timestamptz,
  finished_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idempotency_key)
);

-- ---------- Enhance todos for task/habit unification ----------
ALTER TABLE public.todos
  ADD COLUMN IF NOT EXISTS kind          text NOT NULL DEFAULT 'task',
  ADD COLUMN IF NOT EXISTS recurrence_rule jsonb,
  ADD COLUMN IF NOT EXISTS is_archived   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS goal_id       uuid,
  ADD COLUMN IF NOT EXISTS notes         text,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_time  time,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now();

-- ---------- task_instances ----------
CREATE TABLE IF NOT EXISTS public.task_instances (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES public.todos(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_for_date  date NOT NULL,
  due_at_local        timestamptz,
  status              text NOT NULL DEFAULT 'scheduled',
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, scheduled_for_date)
);

-- ---------- task_completions ----------
CREATE TABLE IF NOT EXISTS public.task_completions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  uuid NOT NULL REFERENCES public.task_instances(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  source       text NOT NULL DEFAULT 'manual',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- daily_stats ----------
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stat_date       date NOT NULL,
  planned_count   integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  habit_streak    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, stat_date)
);

-- ---------- daily_visuals ----------
CREATE TABLE IF NOT EXISTS public.daily_visuals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_id          uuid REFERENCES public.generation_jobs(id) ON DELETE SET NULL,
  visual_date     date NOT NULL,
  storage_path    text,
  image_url       text,
  thumbnail_url   text,
  prompt_version  text NOT NULL DEFAULT 'v1',
  model_version   text NOT NULL DEFAULT 'v1',
  style_version   text NOT NULL DEFAULT 'v1',
  is_hero_active  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, visual_date)
);

-- ---------- notification_tokens ----------
CREATE TABLE IF NOT EXISTS public.notification_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform     text NOT NULL DEFAULT 'ios',
  token        text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

-- ---------- feature_flags ----------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key    text NOT NULL,
  target_type text NOT NULL DEFAULT 'global',
  target_id   text,
  is_enabled  boolean NOT NULL DEFAULT false,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flag_key, target_type, COALESCE(target_id, '__global__'))
);

-- ---------- audit_logs ----------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- goals (future-ready) ----------
CREATE TABLE IF NOT EXISTS public.goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  target_date date,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- FK for todos.goal_id -> goals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_todos_goal'
  ) THEN
    ALTER TABLE public.todos
      ADD CONSTRAINT fk_todos_goal FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------- ai_chat_threads (future-ready) ----------
CREATE TABLE IF NOT EXISTS public.ai_chat_threads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title         text,
  model_version text NOT NULL DEFAULT 'v1',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ---------- ai_chat_messages ----------
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid NOT NULL REFERENCES public.ai_chat_threads(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'user',
  content     text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- ai_suggestions ----------
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  thread_id          uuid REFERENCES public.ai_chat_threads(id) ON DELETE SET NULL,
  suggestion_type    text NOT NULL DEFAULT 'task',
  suggestion_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted           boolean,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user ON public.onboarding_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscription_events_user ON public.subscription_events (user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_uploads_user ON public.photo_uploads (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avatars_user_active ON public.avatars (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_avatar_jobs_status ON public.avatar_jobs (status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_avatar_jobs_user ON public.avatar_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_jobs_idempotency ON public.avatar_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_todos_kind ON public.todos (user_id, kind);
CREATE INDEX IF NOT EXISTS idx_task_instances_user_date ON public.task_instances (user_id, scheduled_for_date);
CREATE INDEX IF NOT EXISTS idx_task_instances_task ON public.task_instances (task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_instance ON public.task_completions (instance_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_date ON public.task_completions (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON public.daily_stats (user_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_visuals_user_date ON public.daily_visuals (user_id, visual_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_visuals_hero ON public.daily_visuals (user_id, is_hero_active) WHERE is_hero_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user ON public.notification_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags (flag_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_threads_user ON public.ai_chat_threads (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_thread ON public.ai_chat_messages (thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user ON public.ai_suggestions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paywall_events_user ON public.paywall_events (user_id, created_at DESC);

-- ---------- Updated_at triggers for new tables ----------
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_photo_uploads_updated_at
  BEFORE UPDATE ON public.photo_uploads
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_avatar_jobs_updated_at
  BEFORE UPDATE ON public.avatar_jobs
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_ai_threads_updated_at
  BEFORE UPDATE ON public.ai_chat_threads
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

CREATE TRIGGER trg_todos_updated_at
  BEFORE UPDATE ON public.todos
  FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ---------- claim_avatar_jobs RPC ----------
CREATE OR REPLACE FUNCTION public.claim_avatar_jobs(worker_name text, max_jobs integer DEFAULT 5)
RETURNS SETOF public.avatar_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.avatar_jobs
    WHERE status = 'pending'
      AND next_run_at <= now()
      AND attempt_count < max_attempts
    ORDER BY created_at ASC
    LIMIT GREATEST(max_jobs, 1)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.avatar_jobs j
  SET status = 'leased',
      locked_by = worker_name,
      locked_until = now() + interval '2 minutes',
      updated_at = now()
  FROM candidates c
  WHERE j.id = c.id
  RETURNING j.*;
END;
$$;

-- ---------- refresh_daily_stats RPC ----------
CREATE OR REPLACE FUNCTION public.refresh_daily_stats(p_user_id uuid, p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_planned  integer;
  v_completed integer;
  v_streak   integer := 0;
  v_check_date date;
BEGIN
  SELECT count(*) INTO v_planned
  FROM public.task_instances
  WHERE user_id = p_user_id AND scheduled_for_date = p_date;

  SELECT count(*) INTO v_completed
  FROM public.task_completions tc
  JOIN public.task_instances ti ON tc.instance_id = ti.id
  WHERE ti.user_id = p_user_id AND ti.scheduled_for_date = p_date;

  v_check_date := p_date;
  LOOP
    PERFORM 1
    FROM public.task_completions tc
    JOIN public.task_instances ti ON tc.instance_id = ti.id
    WHERE ti.user_id = p_user_id AND ti.scheduled_for_date = v_check_date;
    IF NOT FOUND THEN EXIT; END IF;
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  INSERT INTO public.daily_stats (user_id, stat_date, planned_count, completed_count, habit_streak)
  VALUES (p_user_id, p_date, v_planned, v_completed, v_streak)
  ON CONFLICT (user_id, stat_date)
  DO UPDATE SET
    planned_count   = EXCLUDED.planned_count,
    completed_count = EXCLUDED.completed_count,
    habit_streak    = EXCLUDED.habit_streak,
    updated_at      = now();
END;
$$;

-- ---------- compute_home_state RPC ----------
CREATE OR REPLACE FUNCTION public.compute_home_state(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_user        record;
  v_sub         record;
  v_avatar      record;
  v_today       date := current_date;
  v_stats       record;
  v_hero_state  text;
  v_visual      record;
  v_pending_job record;
  v_eligible    boolean := false;
  v_completed_today integer := 0;
  v_planned_today   integer := 0;
  v_active_todos    integer := 0;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'user_not_found'); END IF;

  SELECT * INTO v_sub FROM public.subscriptions WHERE user_id = p_user_id;

  SELECT * INTO v_avatar FROM public.avatars WHERE user_id = p_user_id AND is_active = true LIMIT 1;

  SELECT count(*) INTO v_active_todos
  FROM public.todos WHERE user_id = p_user_id AND is_completed = false AND is_archived = false;

  SELECT planned_count, completed_count, habit_streak INTO v_planned_today, v_completed_today, v_stats
  FROM public.daily_stats WHERE user_id = p_user_id AND stat_date = v_today;

  IF v_planned_today IS NULL THEN v_planned_today := 0; END IF;
  IF v_completed_today IS NULL THEN v_completed_today := 0; END IF;

  SELECT * INTO v_visual
  FROM public.daily_visuals
  WHERE user_id = p_user_id AND visual_date = v_today AND is_hero_active = true
  LIMIT 1;

  SELECT * INTO v_pending_job
  FROM public.generation_jobs
  WHERE user_id = p_user_id
    AND status IN ('pending', 'leased', 'processing')
    AND job_type = 'daily_scene'
  ORDER BY created_at DESC LIMIT 1;

  -- State derivation: monetization > pipeline blocking > content readiness
  IF v_sub IS NULL OR v_sub.status NOT IN ('trialing', 'active', 'grace') THEN
    v_hero_state := 'unsubscribed';
  ELSIF v_avatar IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.avatar_jobs WHERE user_id = p_user_id AND status IN ('pending','leased','processing')) THEN
      v_hero_state := 'photo_processing';
    ELSE
      v_hero_state := 'subscribed_no_photo';
    END IF;
  ELSIF v_visual IS NOT NULL THEN
    v_hero_state := 'visual_ready';
  ELSIF v_pending_job IS NOT NULL THEN
    v_hero_state := 'generation_pending';
  ELSIF v_active_todos >= 3 AND v_avatar IS NOT NULL THEN
    v_eligible := true;
    v_hero_state := 'eligible_for_generation';
  ELSIF v_active_todos > 0 THEN
    v_hero_state := 'avatar_ready_tasks_in_progress';
  ELSE
    v_hero_state := 'avatar_ready_empty';
  END IF;

  RETURN jsonb_build_object(
    'heroState', v_hero_state,
    'userSummary', jsonb_build_object(
      'id', v_user.id,
      'displayName', COALESCE(v_user.display_name, v_user.name),
      'onboardingCompleted', v_user.onboarding_completed,
      'timezone', v_user.timezone
    ),
    'subscriptionSummary', CASE WHEN v_sub IS NOT NULL THEN jsonb_build_object(
      'status', v_sub.status,
      'trialEndsAt', v_sub.trial_ends_at,
      'expiresAt', v_sub.expires_at,
      'isPremium', v_sub.status IN ('trialing', 'active', 'grace')
    ) ELSE jsonb_build_object('status', 'none', 'isPremium', false) END,
    'avatarSummary', CASE WHEN v_avatar IS NOT NULL THEN jsonb_build_object(
      'id', v_avatar.id,
      'imageUrl', v_avatar.image_url,
      'styleVersion', v_avatar.style_version
    ) ELSE NULL END,
    'todayTaskSummary', jsonb_build_object(
      'activeTodos', v_active_todos,
      'plannedToday', v_planned_today,
      'completedToday', v_completed_today,
      'streak', COALESCE((SELECT habit_streak FROM public.daily_stats WHERE user_id = p_user_id AND stat_date = v_today), 0)
    ),
    'generationSummary', jsonb_build_object(
      'eligible', v_eligible,
      'pendingJobId', v_pending_job.id,
      'pendingJobStatus', v_pending_job.status,
      'todayVisualId', v_visual.id,
      'todayVisualUrl', v_visual.image_url
    ),
    'hero', jsonb_build_object(
      'state', v_hero_state,
      'activeVisualUrl', v_visual.image_url,
      'activeThumbnailUrl', v_visual.thumbnail_url
    )
  );
END;
$$;
