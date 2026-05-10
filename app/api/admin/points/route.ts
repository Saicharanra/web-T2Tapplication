import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { TABLES } from "@/lib/db-tables";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch admin points history and statistics
 */
export async function GET(_req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();

        // Verify Admin Role
        const { data: user, error: userError } = await supabase
            .from(TABLES.USERS)
            .select("role")
            .eq("id", userId)
            .single();

        if (userError || user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 1. Fetch Verified Submissions for Transaction History & Stats
        const { data: verifiedSubmissions } = await supabase
            .from(TABLES.SUBMISSIONS)
            .select(`
         id, wasteType, location, pointsAwarded, createdAt,
         user:${TABLES.USERS}!userId(name, email, role)
       `)
            .eq('status', 'VERIFIED')
            .order("updatedAt", { ascending: false });


        // Calculate Stats
        let totalPoints = 0;
        const usersPointsMap = new Map<string, number>();

        const transactions = verifiedSubmissions?.map(sub => {
            const pts = Math.floor(sub.pointsAwarded || 0); // floor to ensure no decimals just in case
            totalPoints += pts;

            // Track for Top Earner
            const userObj = sub.user as any;
            const u = Array.isArray(userObj) ? userObj[0] : userObj;
            const userName = u?.name || "Unknown";
            usersPointsMap.set(userName, (usersPointsMap.get(userName) || 0) + pts);

            return {
                id: sub.id,
                user: userName,
                role: u?.role || "USER",
                email: u?.email || "",
                action: "points_awarded",
                amount: pts,
                wasteType: sub.wasteType || "",
                date: new Date(sub.createdAt).toLocaleDateString()
            };
        }) || [];

        // Today's distribution
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayDist = verifiedSubmissions?.filter(s => new Date(s.createdAt) >= today).reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0) || 0;

        // Top Earner
        let topEarner = "None";
        let topMax = 0;
        for (const [name, pts] of usersPointsMap.entries()) {
            if (pts > topMax) {
                topMax = pts;
                topEarner = name;
            }
        }

        // Average per submission
        const txCount = transactions.length || 1; // avoid / 0
        const avgPerSub = Math.round(totalPoints / txCount);

        return NextResponse.json({
            stats: {
                totalDistributed: totalPoints,
                todayDistribution: todayDist,
                topEarner,
                averagePerSubmission: avgPerSub
            },
            transactions: transactions.slice(0, 50) // Return last 50 transactions for table
        });
    } catch (error) {
        console.error("💥 Error in admin points route:", error);
        return NextResponse.json(
            { error: "Failed to fetch points data" },
            { status: 500 }
        );
    }
}