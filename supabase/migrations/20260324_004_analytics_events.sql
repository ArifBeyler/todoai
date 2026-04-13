-- ============================================================
-- Analytics Events Table
-- ============================================================
-- Tracks product funnel events from both frontend and backend.
-- Events are immutable append-only.

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_name  text NOT NULL,
  source      text NOT NULL DEFAULT 'backend',
  properties  jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id  text,
  device_info jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_source ON public.analytics_events (source);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Frontend can insert own events, read own events
CREATE POLICY "analytics_own_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analytics_own_select" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Materialized view for daily retention (computed by cron)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.retention_daily (
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cohort_date date NOT NULL,
  day_offset  integer NOT NULL,
  active      boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cohort_date, day_offset)
);

CREATE INDEX IF NOT EXISTS idx_retention_daily_cohort ON public.retention_daily (cohort_date, day_offset);

ALTER TABLE public.retention_daily ENABLE ROW LEVEL SECURITY;
-- Service-only: no client policies
