-- ============================================================
-- Major Systems Migration
-- Focus sessions, notification scheduling, voice inputs,
-- AI suggestion enhancements, user preferences extensions
-- ============================================================

-- ---------- focus_sessions ----------
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  todo_ids              uuid[] NOT NULL DEFAULT '{}',
  duration_minutes      integer NOT NULL,
  actual_duration_seconds integer,
  status                text NOT NULL DEFAULT 'active',
  face_down_enabled     boolean NOT NULL DEFAULT false,
  pause_count           integer NOT NULL DEFAULT 0,
  total_pause_seconds   integer NOT NULL DEFAULT 0,
  interruption_count    integer NOT NULL DEFAULT 0,
  points_awarded        integer NOT NULL DEFAULT 0,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user
  ON public.focus_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status
  ON public.focus_sessions (user_id, status) WHERE status = 'active';

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own focus sessions'
  ) THEN
    CREATE POLICY "Users can manage own focus sessions"
      ON public.focus_sessions FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------- notification_schedules ----------
CREATE TABLE IF NOT EXISTS public.notification_schedules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category          text NOT NULL,
  event_key         text NOT NULL,
  scheduled_for     timestamptz NOT NULL,
  todo_id           uuid REFERENCES public.todos(id) ON DELETE CASCADE,
  tone              text NOT NULL DEFAULT 'focused',
  template_key      text,
  personalization   jsonb NOT NULL DEFAULT '{}'::jsonb,
  status            text NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedules_pending
  ON public.notification_schedules (user_id, scheduled_for)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_schedules_todo
  ON public.notification_schedules (todo_id);

ALTER TABLE public.notification_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notification schedules'
  ) THEN
    CREATE POLICY "Users can read own notification schedules"
      ON public.notification_schedules FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ---------- voice_inputs ----------
CREATE TABLE IF NOT EXISTS public.voice_inputs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  transcript     text NOT NULL,
  parsed_result  jsonb NOT NULL DEFAULT '{}'::jsonb,
  todo_id        uuid REFERENCES public.todos(id) ON DELETE SET NULL,
  language       text NOT NULL DEFAULT 'tr',
  duration_ms    integer,
  confidence     float,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_inputs_user
  ON public.voice_inputs (user_id, created_at DESC);

ALTER TABLE public.voice_inputs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own voice inputs'
  ) THEN
    CREATE POLICY "Users can manage own voice inputs"
      ON public.voice_inputs FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ---------- user_preferences extensions ----------
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS active_hours_start time DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS active_hours_end time DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS notification_categories jsonb DEFAULT '{"task_reminder":true,"ai_suggestion":true,"focus_nudge":true,"visual_ready":true,"achievement":true,"summary":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mic_permission_status text DEFAULT 'not_asked',
  ADD COLUMN IF NOT EXISTS haptics_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS focus_sound_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_notification_limit integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS suggestion_frequency_days integer DEFAULT 3;

-- ---------- ai_suggestions enhancements ----------
ALTER TABLE public.ai_suggestions
  ADD COLUMN IF NOT EXISTS tone text DEFAULT 'curious',
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS reason_text text,
  ADD COLUMN IF NOT EXISTS dismissed_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_model text;

-- ---------- users extensions for focus ----------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS focus_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_focus_date date;

-- ---------- award_focus_points function ----------
CREATE OR REPLACE FUNCTION public.award_focus_points(
  p_user_id uuid,
  p_session_id uuid,
  p_duration_minutes integer,
  p_face_down boolean,
  p_pause_count integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base integer := 0;
  v_bonus integer := 0;
  v_streak integer := 0;
  v_total integer := 0;
  v_last_date date;
BEGIN
  v_base := CASE
    WHEN p_duration_minutes <= 15 THEN 10
    WHEN p_duration_minutes <= 25 THEN 20
    WHEN p_duration_minutes <= 45 THEN 35
    WHEN p_duration_minutes <= 60 THEN 50
    ELSE 75
  END;

  IF p_face_down THEN v_bonus := v_bonus + 15; END IF;
  IF p_pause_count = 0 THEN v_bonus := v_bonus + 10; END IF;

  SELECT focus_streak, last_focus_date INTO v_streak, v_last_date
  FROM public.users WHERE id = p_user_id;

  IF v_last_date = current_date - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_last_date IS NULL OR v_last_date < current_date - 1 THEN
    v_streak := 1;
  END IF;

  v_bonus := v_bonus + LEAST(v_streak * 5, 25);
  v_total := v_base + v_bonus;

  UPDATE public.users
  SET total_points = greatest(0, total_points + v_total),
      focus_streak = v_streak,
      last_focus_date = current_date
  WHERE id = p_user_id;

  UPDATE public.focus_sessions
  SET points_awarded = v_total
  WHERE id = p_session_id;

  RETURN v_total;
END;
$$;
