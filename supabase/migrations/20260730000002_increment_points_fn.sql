-- ============================================================
-- Helper: Atomically increment user points balance
-- Called by: app/api/submissions/[id]/verify/route.ts
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_user_points(
  p_user_id UUID,
  p_points   INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try flat schema first (users table with points column)
  UPDATE public.users
  SET
    points     = COALESCE(points, 0) + p_points,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- If no row updated, try updating reward_points_balance (unified schema)
  IF NOT FOUND THEN
    UPDATE public.users
    SET
      reward_points_balance = COALESCE(reward_points_balance, 0) + p_points,
      updated_at            = NOW()
    WHERE id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_user_points(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_user_points(UUID, INT) TO service_role;
