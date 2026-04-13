-- ============================================================
-- Dual Image Asset System: profileAvatar + starterHero
-- ============================================================

-- Add asset_type to avatars table to distinguish profile avatars from starter heroes
ALTER TABLE public.avatars
  ADD COLUMN IF NOT EXISTS asset_type text NOT NULL DEFAULT 'profile_avatar';

-- Add active_starter_hero_id to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS active_starter_hero_id uuid;

-- FK for users.active_starter_hero_id -> avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_users_active_starter_hero'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT fk_users_active_starter_hero
      FOREIGN KEY (active_starter_hero_id) REFERENCES public.avatars(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for querying starter heroes
CREATE INDEX IF NOT EXISTS idx_avatars_user_asset_type
  ON public.avatars (user_id, asset_type, is_active);

-- ---------- Update compute_home_state RPC to include starterHero ----------
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
  v_starter     record;
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

  SELECT * INTO v_avatar
  FROM public.avatars
  WHERE user_id = p_user_id AND is_active = true AND asset_type = 'profile_avatar'
  LIMIT 1;

  SELECT * INTO v_starter
  FROM public.avatars
  WHERE user_id = p_user_id AND is_active = true AND asset_type = 'starter_hero'
  LIMIT 1;

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
    'starterHeroSummary', CASE WHEN v_starter IS NOT NULL THEN jsonb_build_object(
      'id', v_starter.id,
      'imageUrl', v_starter.image_url,
      'storagePath', v_starter.storage_path,
      'styleVersion', v_starter.style_version
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
