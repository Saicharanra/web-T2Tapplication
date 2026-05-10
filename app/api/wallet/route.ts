import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Fetch user's wallet data including points and transaction history
 */
export async function GET(_req: NextRequest) {  // Keep underscore prefix to indicate intentionally unused
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('💰 Fetching wallet data for user:', userId);

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Get user's current points
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('points, name, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('👤 User:', user.name, 'Current points:', user.points);

    // Get all points history with submission details
    const { data: history, error: historyError } = await supabase
      .from('PointsHistory')
      .select(`
        *,
        submission:Submission(wasteType)
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (historyError) {
      console.error('❌ Error fetching history:', historyError);
    }

    console.log('📊 Transaction history count:', history?.length || 0);

    // Calculate stats
    const transactions = history || [];
    const totalEarned = transactions
      .filter(t => t.type === 'EARNED' || t.type === 'BONUS')
      .reduce((sum, t) => sum + t.points, 0);

    const totalRedeemed = Math.abs(transactions
      .filter(t => t.type === 'REDEEMED')
      .reduce((sum, t) => sum + t.points, 0));

    // Calculate points earned this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthPoints = transactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt);
        return transactionDate >= firstDayOfMonth && (t.type === 'EARNED' || t.type === 'BONUS');
      })
      .reduce((sum, t) => sum + t.points, 0);

    console.log('✅ Wallet stats calculated:', {
      totalPoints: user.points,
      totalEarned,
      totalRedeemed,
      thisMonthPoints,
      transactionCount: transactions.length
    });

    return NextResponse.json({
      totalPoints: user.points || 0,
      thisMonthPoints,
      totalEarned,
      totalRedeemed,
      transactions: transactions.map(t => ({
        id: t.id,
        points: t.points,
        description: t.description || `Points from recycling`,
        type: t.type,
        createdAt: t.createdAt,
        submission: t.submission,
      })),
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in wallet route:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}
