import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch Customer Analytics & Insights for Business Owner
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
      .select("reward_id, title, views, store_location, category, created_at")
      .eq("business_id", userId);

    if (fetchError) {
      console.error("Error fetching rewards:", fetchError);
      return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
    }

    if (!rewards || rewards.length === 0) {
      return NextResponse.json({
        totalViews: 0,
        totalRedemptions: 0,
        totalUniqueCustomers: 0,
        newCustomersAcquired: 0,
        returningCustomers: 0,
        conversionRate: 0,
        repeatCustomerRate: 0,
        avgRedemptionsPerCustomer: 0,
        locations: [],
        couponEngagement: [],
        recentRedemptions: []
      });
    }

    const rewardIds = rewards.map((r: any) => r.reward_id);

    // 2. Fetch redemptions with User details for these rewards
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
          id,
          name,
          email,
          location
        )
      `)
      .in("reward_id", rewardIds)
      .order("redeemed_at", { ascending: false });

    if (redemptionsError) {
      console.error("Error fetching redemptions for analytics:", redemptionsError);
    }

    const safeRedemptions = redemptions || [];

    // 3. Compute Metrics
    const totalViews = rewards.reduce((sum: number, r: any) => sum + (r.views || 0), 0);
    const totalRedemptions = safeRedemptions.length;

    // User counts & history tracking
    const userRedemptionCounts: Record<string, { count: number; name: string; email: string; location: string; firstRedeemed: string; lastRedeemed: string }> = {};
    
    // Location counts
    const locationCounts: Record<string, { count: number; uniqueUsers: Set<string> }> = {};

    // Coupon breakdown
    const couponRedemptionCounts: Record<number, number> = {};

    safeRedemptions.forEach((r: any) => {
      const uId = r.user_id || "unknown";
      const uName = (r.User as any)?.name || "Customer";
      const uEmail = (r.User as any)?.email || "";
      const uLoc = (r.User as any)?.location || "Unspecified Location";
      const rDate = r.redeemed_at;

      // User tracking
      if (!userRedemptionCounts[uId]) {
        userRedemptionCounts[uId] = {
          count: 0,
          name: uName,
          email: uEmail,
          location: uLoc,
          firstRedeemed: rDate,
          lastRedeemed: rDate
        };
      }
      userRedemptionCounts[uId].count += 1;
      if (new Date(rDate) < new Date(userRedemptionCounts[uId].firstRedeemed)) {
        userRedemptionCounts[uId].firstRedeemed = rDate;
      }
      if (new Date(rDate) > new Date(userRedemptionCounts[uId].lastRedeemed)) {
        userRedemptionCounts[uId].lastRedeemed = rDate;
      }

      // Location tracking
      const cleanLoc = uLoc.trim() || "Unspecified Location";
      if (!locationCounts[cleanLoc]) {
        locationCounts[cleanLoc] = { count: 0, uniqueUsers: new Set() };
      }
      locationCounts[cleanLoc].count += 1;
      locationCounts[cleanLoc].uniqueUsers.add(uId);

      // Coupon tracking
      const rId = r.reward_id;
      couponRedemptionCounts[rId] = (couponRedemptionCounts[rId] || 0) + 1;
    });

    const uniqueUsersList = Object.keys(userRedemptionCounts);
    const totalUniqueCustomers = uniqueUsersList.length;

    // New vs Returning customers
    const returningCustomers = uniqueUsersList.filter(uId => userRedemptionCounts[uId].count >= 2).length;
    const newCustomersAcquired = uniqueUsersList.filter(uId => userRedemptionCounts[uId].count === 1).length;

    // Key Rates
    const conversionRate = totalViews > 0 ? Number(((totalRedemptions / totalViews) * 100).toFixed(1)) : 0;
    const repeatCustomerRate = totalUniqueCustomers > 0 ? Number(((returningCustomers / totalUniqueCustomers) * 100).toFixed(1)) : 0;
    const avgRedemptionsPerCustomer = totalUniqueCustomers > 0 ? Number((totalRedemptions / totalUniqueCustomers).toFixed(1)) : 0;

    // Format Locations array (sorted by redemptions desc)
    const locations = Object.entries(locationCounts)
      .map(([name, data]) => ({
        location: name,
        redemptions: data.count,
        uniqueCustomers: data.uniqueUsers.size,
        percentage: totalRedemptions > 0 ? Math.round((data.count / totalRedemptions) * 100) : 0
      }))
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5); // top 5 active locations

    // Format Coupon Engagement array
    const couponEngagement = rewards.map((r: any) => {
      const redCount = couponRedemptionCounts[r.reward_id] || 0;
      const cViews = r.views || 0;
      const rate = cViews > 0 ? Number(((redCount / cViews) * 100).toFixed(1)) : 0;
      return {
        reward_id: r.reward_id,
        title: r.title,
        category: r.category,
        views: cViews,
        redemptions: redCount,
        conversionRate: rate
      };
    }).sort((a: any, b: any) => b.redemptions - a.redemptions);

    // Recent Redemptions
    const recentRedemptions = safeRedemptions.slice(0, 10).map((r: any) => {
      const reward = rewards.find((rw: any) => rw.reward_id === r.reward_id);
      const email = (r.User as any)?.email || "";
      const maskedEmail = email ? `${email.split('@')[0].slice(0, 3)}***@${email.split('@')[1]}` : "N/A";
      return {
        redemption_id: r.redemption_id,
        couponTitle: reward?.title || "Unknown Coupon",
        customerName: (r.User as any)?.name || "Customer",
        customerEmail: maskedEmail,
        location: (r.User as any)?.location || "Unspecified",
        code: r.code,
        redeemed_at: r.redeemed_at
      };
    });

    return NextResponse.json({
      totalViews,
      totalRedemptions,
      totalUniqueCustomers,
      newCustomersAcquired,
      returningCustomers,
      conversionRate,
      repeatCustomerRate,
      avgRedemptionsPerCustomer,
      locations,
      couponEngagement,
      recentRedemptions
    });

  } catch (error: any) {
    console.error("Error in GET /api/business/analytics:", error);
    if (error.message?.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
