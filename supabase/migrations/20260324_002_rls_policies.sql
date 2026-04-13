-- ============================================================
-- RLS Policies - Classified by access pattern
-- ============================================================
-- Classification:
--   CLIENT R/W  : profiles, onboarding_progress, user_preferences, todos, task_instances, task_completions, notification_tokens
--   CLIENT R/O  : subscriptions, avatars, daily_visuals, daily_stats, feature_flags, goals, ai_chat_threads, ai_chat_messages, ai_suggestions
--   SERVICE ONLY: subscription_events, avatar_jobs, visual_generation_jobs (generation_jobs), notification_events, audit_logs, paywall_events, photo_uploads (status), cost_ledger, moderation_flags, webhook_events

-- ==========================================
-- Enable RLS on all new tables
-- ==========================================
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paywall_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_uploads       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_instances      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_visuals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions      ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CLIENT READ/WRITE tables
-- ==========================================

-- onboarding_progress
CREATE POLICY "onboarding_own_select" ON public.onboarding_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "onboarding_own_insert" ON public.onboarding_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "onboarding_own_update" ON public.onboarding_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_preferences
CREATE POLICY "prefs_own_select" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prefs_own_insert" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_own_update" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- task_instances
CREATE POLICY "instances_own_select" ON public.task_instances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "instances_own_insert" ON public.task_instances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instances_own_update" ON public.task_instances FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "instances_own_delete" ON public.task_instances FOR DELETE USING (auth.uid() = user_id);

-- task_completions
CREATE POLICY "completions_own_select" ON public.task_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "completions_own_insert" ON public.task_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notification_tokens
CREATE POLICY "tokens_own_select" ON public.notification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tokens_own_insert" ON public.notification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tokens_own_update" ON public.notification_tokens FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tokens_own_delete" ON public.notification_tokens FOR DELETE USING (auth.uid() = user_id);

-- goals
CREATE POLICY "goals_own_select" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_own_insert" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_own_update" ON public.goals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_own_delete" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- ai_chat_threads
CREATE POLICY "threads_own_select" ON public.ai_chat_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "threads_own_insert" ON public.ai_chat_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "threads_own_update" ON public.ai_chat_threads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_chat_messages (access through thread ownership)
CREATE POLICY "messages_own_select" ON public.ai_chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));
CREATE POLICY "messages_own_insert" ON public.ai_chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid()));

-- ai_suggestions
CREATE POLICY "suggestions_own_select" ON public.ai_suggestions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suggestions_own_insert" ON public.ai_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suggestions_own_update" ON public.ai_suggestions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- CLIENT READ-ONLY tables
-- ==========================================

-- subscriptions (snapshot, read only)
CREATE POLICY "sub_own_select" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- avatars (active/succeeded only)
CREATE POLICY "avatars_own_select" ON public.avatars FOR SELECT USING (auth.uid() = user_id);

-- daily_visuals
CREATE POLICY "visuals_own_select" ON public.daily_visuals FOR SELECT USING (auth.uid() = user_id);

-- daily_stats
CREATE POLICY "stats_own_select" ON public.daily_stats FOR SELECT USING (auth.uid() = user_id);

-- feature_flags (global + targeted)
CREATE POLICY "flags_read" ON public.feature_flags FOR SELECT
  USING (target_type = 'global' OR (target_type = 'user' AND target_id = auth.uid()::text));

-- photo_uploads (read own, no direct status write)
CREATE POLICY "photos_own_select" ON public.photo_uploads FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- SERVICE-ONLY tables (no client policies => access only via service role)
-- ==========================================
-- subscription_events  : no client policy
-- avatar_jobs          : no client policy
-- paywall_events       : no client policy (ingest via edge function)
-- audit_logs           : no client policy
-- cost_ledger          : already has no client policies from hardening migration
-- moderation_flags     : already has no client policies
-- webhook_events       : already has no client policies

-- ==========================================
-- Tighten existing policies from init migration
-- ==========================================

-- Prevent clients from writing to generation_jobs status/lease fields
-- The existing insert policy stays, but we revoke update to prevent status manipulation
DROP POLICY IF EXISTS "Users can insert own generation jobs" ON public.generation_jobs;
CREATE POLICY "generation_jobs_own_insert" ON public.generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
