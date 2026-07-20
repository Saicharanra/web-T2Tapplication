import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch business owner's coupons and dashboard metrics
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || (userRole !== "BUSINESS" && userRole !== "business")) {
      return NextResponse.json({ error: "Forbidden: Business Owner role required" }, { status: 403 });
    }

    // 1. Fetch rewards created by this business owner
    const { data: rewards, error: fetchError } = await supabaseAdmin
      .from("Reward")
      .select("*")
      .eq("business_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching rewards:", fetchError);
      return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
    }

    if (!rewards || rewards.length === 0) {
      return NextResponse.json({
        rewards: [],
        redemptions: [],
        stats: {
          totalCoupons: 0,
          activeCoupons: 0,
          redeemedCoupons: 0,
          remainingCoupons: 0,
          couponViews: 0,
        }
      });
    }

    const rewardIds = rewards.map((r: any) => r.reward_id);

    // 2. Fetch redemptions for these rewards
    const { data: redemptions, error: redemptionsError } = await supabaseAdmin
      .from("RewardRedemption")
      .select(`
        redemption_id,
        reward_id,
        user_id,
        code,
        redeemed_at,
        status,
        User (
          name,
          email
        )
      `)
      .in("reward_id", rewardIds)
      .order("redeemed_at", { ascending: false });

    if (redemptionsError) {
      console.error("Error fetching redemptions:", redemptionsError);
    }

    // 3. Enhance rewards with their specific redemption counts and code list
    const enhancedRewards = await Promise.all(
      rewards.map(async (reward: any) => {
        const rewardRedemptions = (redemptions || []).filter((r: any) => r.reward_id === reward.reward_id);
        
        // Fetch codes to show stock status to owner
        const { data: codes } = await supabaseAdmin
          .from("RewardCode")
          .select("code, is_used")
          .eq("reward_id", reward.reward_id);

        return {
          ...reward,
          redemptionsCount: rewardRedemptions.length,
          codes: (codes || []).map((c: any) => c.code),
          unusedCodesCount: (codes || []).filter((c: any) => !c.is_used).length
        };
      })
    );

    // 4. Calculate metrics
    const totalCoupons = rewards.length;
    const activeCoupons = rewards.filter((r: any) => r.status === "Active").length;
    const redeemedCoupons = redemptions?.length || 0;
    const remainingCoupons = rewards.reduce((sum: number, r: any) => sum + (r.remaining_redemptions || 0), 0);
    const couponViews = rewards.reduce((sum: number, r: any) => sum + (r.views || 0), 0);

    return NextResponse.json({
      rewards: enhancedRewards,
      redemptions: (redemptions || []).map((r: any) => ({
        redemption_id: r.redemption_id,
        reward_id: r.reward_id,
        redeemed_at: r.redeemed_at,
        status: r.status,
        code: r.code,
        user: {
          name: (r.User as any)?.name || "Anonymous",
          email: (r.User as any)?.email ? `${(r.User as any).email.split('@')[0].slice(0, 3)}***@${(r.User as any).email.split('@')[1]}` : "N/A" // Mask email
        }
      })),
      stats: {
        totalCoupons,
        activeCoupons,
        redeemedCoupons,
        remainingCoupons,
        couponViews,
      }
    });

  } catch (error: any) {
    console.error("Error in GET /api/business/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST: Create a new reward (coupon) with secure codes
 */
export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || (userRole !== "BUSINESS" && userRole !== "business")) {
      return NextResponse.json({ error: "Forbidden: Business Owner role required" }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      points_required,
      logo_url,
      banner_url,
      company_name,
      discount_type,
      discount_value,
      original_price,
      expiry_date,
      max_redemptions,
      min_purchase,
      terms,
      store_location,
      website,
      contact_number,
      allow_multiple,
      codes
    } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!points_required || typeof points_required !== "number" || points_required <= 0) {
      return NextResponse.json({ error: "Points required must be a positive number" }, { status: 400 });
    }

    const processedCodes = Array.isArray(codes)
      ? codes.map((c: any) => String(c).trim()).filter(Boolean)
      : typeof codes === "string"
      ? codes.split("\n").map(c => c.trim()).filter(Boolean)
      : [];

    if (processedCodes.length === 0) {
      return NextResponse.json({ error: "At least one coupon code is required" }, { status: 400 });
    }

    const finalMaxRedemptions = processedCodes.length;

    // Insert Coupon (Reward)
    // Defaults status to PENDING_APPROVAL as admins must approve it
    const { data: newReward, error: insertError } = await supabaseAdmin
      .from("Reward")
      .insert({
        title: title.trim(),
        description: description?.trim() || "",
        points_required,
        image_url: banner_url?.trim() || "🎁", // fallback for image_url
        status: "PENDING_APPROVAL",
        category: body.category?.trim() || "General",
        stock: finalMaxRedemptions,
        business_id: userId,
        company_name: company_name?.trim() || "T2T Partner",
        discount_type: discount_type || "Percentage",
        discount_value: Number(discount_value) || 0,
        original_price: original_price ? Number(original_price) : null,
        expiry_date: expiry_date ? new Date(expiry_date).toISOString() : null,
        max_redemptions: finalMaxRedemptions,
        remaining_redemptions: finalMaxRedemptions,
        min_purchase: min_purchase ? Number(min_purchase) : 0,
        terms: terms?.trim() || "",
        store_location: store_location?.trim() || "",
        website: website?.trim() || "",
        contact_number: contact_number?.trim() || "",
        logo_url: logo_url?.trim() || "",
        banner_url: banner_url?.trim() || "",
        allow_multiple: !!allow_multiple,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (insertError || !newReward) {
      console.error("Error inserting reward:", insertError);
      return NextResponse.json({ error: insertError?.message || "Failed to create coupon" }, { status: 500 });
    }

    // Insert Coupon Codes securely
    const codesData = processedCodes.map(code => ({
      reward_id: newReward.reward_id,
      code,
      is_used: false,
      created_at: new Date().toISOString()
    }));

    const { error: codesError } = await supabaseAdmin
      .from("RewardCode")
      .insert(codesData);

    if (codesError) {
      console.error("Error inserting codes:", codesError);
      // Clean up reward since codes insert failed
      await supabaseAdmin.from("Reward").delete().eq("reward_id", newReward.reward_id);
      return NextResponse.json({ error: "Failed to securely save coupon codes" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Coupon created successfully and submitted for Admin approval!",
      reward: newReward
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error in POST /api/business/rewards:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
