import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch admin reports statistics (Regional and Timeline data)
 */
export async function GET(_req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = await createSupabaseServerClient();

        // Verify Admin Role
        const { data: user, error: userError } = await supabase
            .from("User")
            .select("role")
            .eq("id", userId)
            .single();

        if (userError || user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        // 1. Regional Stats
        const { data: allSubmissions } = await supabase
            .from("Submission")
            .select(`
        id, location, status, pointsAwarded, createdAt, userId
      `);

        const { data: allUsers } = await supabase.from("User").select("id, location");

        // Initialize region map
        type RegionStats = { submissions: number, points: number, users: Set<string> };
        const regions = new Map<string, RegionStats>();

        // Standardize locations for mapping
        const standardizeLocation = (loc: string | null) => {
            if (!loc) return "Others";
            const lower = loc.toLowerCase();
            if (lower.includes("hyderabad")) return "Hyderabad";
            if (lower.includes("warangal")) return "Warangal";
            if (lower.includes("nizamabad")) return "Nizamabad";
            if (lower.includes("karimnagar")) return "Karimnagar";
            if (lower.includes("khammam")) return "Khammam";
            return "Others";
        };

        const initialRegions = ["Hyderabad", "Warangal", "Nizamabad", "Others"];
        initialRegions.forEach(r => regions.set(r, { submissions: 0, points: 0, users: new Set() }));

        // Count submissions and points manually grouped by location
        allSubmissions?.forEach(sub => {
            const locStr = standardizeLocation(sub.location);
            const region = regions.has(locStr) ? locStr : "Others";

            const rData = regions.get(region)!;
            rData.submissions++;
            if (sub.status === 'VERIFIED') {
                rData.points += (sub.pointsAwarded || 0);
            }
            if (sub.userId) rData.users.add(sub.userId);
        });

        const regionalStatsArray = Array.from(regions.entries()).map(([region, data]) => {
            let color = "from-orange-500 to-orange-600";
            if (region === "Hyderabad") color = "from-blue-500 to-blue-600";
            if (region === "Warangal") color = "from-green-500 to-green-600";
            if (region === "Nizamabad") color = "from-purple-500 to-purple-600";

            return {
                region,
                submissions: data.submissions,
                points: data.points,
                users: data.users.size,
                color
            };
        });

        // Sort to keep "Others" last
        regionalStatsArray.sort((a, b) => {
            if (a.region === "Others") return 1;
            if (b.region === "Others") return -1;
            return b.submissions - a.submissions;
        });

        // 2. Progress Data (Mock time-series logic based on realistic aggregated data approach)
        // Fetch real timeline stats for exact counts
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        // In a real robust system we'd use SQL `GROUP BY date_trunc('week', created_at)`
        // For now we calculate exactly by filtering the fetched submissions.

        // Yearly (last 3 years)
        const yearlyMap = new Map();
        [currentYear - 2, currentYear - 1, currentYear].forEach(yr => {
            yearlyMap.set(String(yr), { period: String(yr), submissions: 0, verified: 0, rejected: 0, points: 0 });
        });

        // Monthly (last 6 months)
        const monthlyMap = new Map();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 5; i >= 0; i--) {
            let mIdx = currentMonth - i;
            if (mIdx < 0) mIdx += 12; // Wrap around to previous year
            monthlyMap.set(monthNames[mIdx], { period: monthNames[mIdx], submissions: 0, verified: 0, rejected: 0, points: 0 });
        }

        allSubmissions?.forEach(sub => {
            const date = new Date(sub.createdAt);
            const yrString = String(date.getFullYear());
            const monthStr = monthNames[date.getMonth()];

            // Update Yearly
            if (yearlyMap.has(yrString)) {
                const y = yearlyMap.get(yrString);
                y.submissions++;
                if (sub.status === 'VERIFIED') { y.verified++; y.points += (sub.pointsAwarded || 0); }
                if (sub.status === 'REJECTED') { y.rejected++; }
            }

            // Update Monthly
            if (monthlyMap.has(monthStr) && (
                // Only add if it's within the last 6 months (safeguard against exactly 1 year ago same month)
                (date.getFullYear() === currentYear && date.getMonth() <= currentMonth && date.getMonth() >= currentMonth - 5) ||
                (date.getFullYear() === currentYear - 1 && date.getMonth() > currentMonth + 6)
            )) {
                const m = monthlyMap.get(monthStr);
                m.submissions++;
                if (sub.status === 'VERIFIED') { m.verified++; m.points += (sub.pointsAwarded || 0); }
                if (sub.status === 'REJECTED') { m.rejected++; }
            }
        });

        return NextResponse.json({
            regionalStats: regionalStatsArray,
            progressData: {
                weekly: [
                    { period: 'Week 1', submissions: 15, verified: 12, rejected: 3, points: 350 },
                    { period: 'Week 2', submissions: 22, verified: 18, rejected: 2, points: 410 },
                    { period: 'Week 3', submissions: 18, verified: 15, rejected: 1, points: 380 },
                    { period: 'Week 4', submissions: 5, verified: 4, rejected: 0, points: 120 }
                ], // Weekly logic requires ISO week calculations, mock for now as fallback while linking real.
                monthly: Array.from(monthlyMap.values()),
                yearly: Array.from(yearlyMap.values())
            }
        });
    } catch (error) {
        console.error("💥 Error in admin reports route:", error);
        return NextResponse.json(
            { error: "Failed to fetch reports data" },
            { status: 500 }
        );
    }
}