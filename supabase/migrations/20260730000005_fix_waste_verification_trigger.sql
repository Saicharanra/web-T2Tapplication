-- ============================================================
-- FIX: Make handle_waste_submission_verification trigger case-insensitive & robust
-- Solves: Trigger not firing when status is updated to 'Approved' or 'VERIFIED'
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_waste_submission_verification()
RETURNS TRIGGER AS $$
DECLARE
    v_points INT;
    v_weight NUMERIC(10,2);
BEGIN
    -- Determine points to award
    v_points := COALESCE(NEW.points_earned, NEW.points_awarded, 15);
    IF v_points <= 0 THEN
        v_points := 15;
    END IF;

    v_weight := COALESCE(NEW.weight_kg, NEW.weight, 1.0);

    -- Execute when status transitions to approved / verified (case-insensitive)
    IF lower(NEW.status::text) IN ('approved', 'verified') 
       AND (OLD.status IS NULL OR lower(OLD.status::text) NOT IN ('approved', 'verified')) THEN

        -- 1. Update user points balance in public.users (both flat & master column names)
        UPDATE public.users
        SET 
            reward_points_balance = COALESCE(reward_points_balance, 0) + v_points,
            points                = COALESCE(points, 0) + v_points,
            total_rewards_earned  = COALESCE(total_rewards_earned, 0) + v_points,
            total_waste_kg        = COALESCE(total_waste_kg, 0) + v_weight,
            updated_at            = NOW()
        WHERE id = NEW.user_id;

        -- 2. Update reward_points table if exists
        UPDATE public.reward_points
        SET 
            points_balance  = COALESCE(points_balance, 0) + v_points,
            lifetime_earned = COALESCE(lifetime_earned, 0) + v_points,
            updated_at      = NOW()
        WHERE profile_id = NEW.user_id;

        -- 3. Update business waste total if linked
        IF NEW.business_id IS NOT NULL THEN
            UPDATE public.businesses
            SET total_waste_collected_kg = COALESCE(total_waste_collected_kg, 0) + v_weight,
                updated_at = NOW()
            WHERE id = NEW.business_id;
        END IF;

        -- 4. Record in points_history (safe insert)
        BEGIN
            INSERT INTO public.points_history (user_id, submission_id, points, transaction_type, description, created_at)
            VALUES (NEW.user_id, NEW.id, v_points, 'EARNED', format('Earned %s points for recycling', v_points), NOW());
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

        -- 5. In-App Notification
        BEGIN
            INSERT INTO public.notifications (user_id, title, message, channel, created_at)
            VALUES (
                NEW.user_id, 
                'Waste Verification Approved! 🎉', 
                format('Your waste submission was verified! You earned %s points.', v_points), 
                'in_app',
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger to public.waste_submissions
DROP TRIGGER IF EXISTS trg_waste_submission_verified ON public.waste_submissions;
CREATE TRIGGER trg_waste_submission_verified
    AFTER UPDATE ON public.waste_submissions
    FOR EACH ROW EXECUTE FUNCTION public.handle_waste_submission_verification();
