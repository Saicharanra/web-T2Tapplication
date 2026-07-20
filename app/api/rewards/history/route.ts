import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch redeemed rewards for the logged-in user
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch redemptions with joined reward details
    const { data: redemptions, error } = await supabaseAdmin
      .from("RewardRedemption")
      .select(`
        redemption_id,
        reward_id,
        code,
        redeemed_at,
        expires_at,
        status,
        Reward (
          title,
          description,
          points_required,
          image_url,
          category,
          company_name,
          logo_url,
          banner_url,
          discount_type,
          discount_value,
          original_price,
          min_purchase,
          terms,
          store_location,
          website,
          contact_number
        )
      `)
      .eq("user_id", userId)
      .order("redeemed_at", { ascending: false });

    if (error) {
      console.error("Error fetching redemptions history:", error);
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }

    const history = (redemptions || []).map((r: any) => {
      const reward = r.Reward as any;
      return {
        id: String(r.redemption_id),
        reward_id: String(r.reward_id),
        name: reward?.title || "Unknown Reward",
        description: reward?.description || "",
        image_url: reward?.image_url || "",
        category: reward?.category || "General",
        points_required: reward?.points_required || 0,
        date: r.redeemed_at ? r.redeemed_at.split("T")[0] : "",
        redeemed_at: r.redeemed_at,
        expires_at: r.expires_at,
        code: r.code,
        status: r.status,
        company_name: reward?.company_name || "T2T Partner",
        logo_url: reward?.logo_url || "",
        banner_url: reward?.banner_url || "",
        discount_type: reward?.discount_type || "Percentage",
        discount_value: reward?.discount_value || 0,
        original_price: reward?.original_price || null,
        min_purchase: reward?.min_purchase || 0,
        terms: reward?.terms || "",
        store_location: reward?.store_location || "",
        website: reward?.website || "",
        contact_number: reward?.contact_number || ""
      };
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Error in GET /api/rewards/history:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
