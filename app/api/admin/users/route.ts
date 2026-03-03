import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Admin users API called');
    
    const { userId } = await auth();
    console.log('👤 Requesting user ID:', userId);

    if (!userId) {
      console.error('❌ No userId found');
      return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();
    console.log('✅ Supabase client created');

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    console.log('Admin user query result:', { adminUser, adminError });

    if (adminError) {
      console.error('❌ Admin check error:', adminError);
      return NextResponse.json(
        { error: "User not found", details: adminError.message },
        { status: 404 }
      );
    }

    if (!adminUser) {
      console.error('❌ Admin user not found in database');
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log('👤 User role:', adminUser.role);

    if (adminUser.role !== "ADMIN") {
      console.error('❌ User is not admin. Role:', adminUser.role);
      return NextResponse.json(
        { error: "Forbidden: Admin access required", currentRole: adminUser.role },
        { status: 403 }
      );
    }

    console.log('✅ Admin verified, fetching users...');

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Fetch all users with submission counts
    const { data: users, error: usersError } = await supabase
      .from("User")
      .select("*")
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Users query result:', { usersCount: users?.length || 0, usersError });

    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: usersError.message },
        { status: 500 }
      );
    }

    console.log('✅ Users fetched:', users?.length || 0);

    // Fetch submission counts for each user
    const { data: submissions, error: submissionsError } = await supabase
      .from("Submission")
      .select("userId, status");

    console.log('Submissions query result:', { submissionsCount: submissions?.length || 0, submissionsError });

    if (submissionsError) {
      console.error('⚠️ Error fetching submissions:', submissionsError);
    }

    console.log('📊 Submissions fetched:', submissions?.length || 0);

    // Create submission count map
    const submissionMap = new Map<string, { total: number; verified: number; pending: number; rejected: number }>();
    
    submissions?.forEach((sub) => {
      if (!submissionMap.has(sub.userId)) {
        submissionMap.set(sub.userId, { total: 0, verified: 0, pending: 0, rejected: 0 });
      }
      const stats = submissionMap.get(sub.userId)!;
      stats.total++;
      if (sub.status === 'VERIFIED') stats.verified++;
      else if (sub.status === 'PENDING') stats.pending++;
      else if (sub.status === 'REJECTED') stats.rejected++;
    });

    // Enhance users with submission counts
    const enhancedUsers = users?.map((user) => {
      const submissionStats = submissionMap.get(user.id) || { total: 0, verified: 0, pending: 0, rejected: 0 };
      return {
        ...user,
        totalSubmissions: submissionStats.total,
        verifiedSubmissions: submissionStats.verified,
        pendingSubmissions: submissionStats.pending,
        rejectedSubmissions: submissionStats.rejected,
      };
    }) || [];

    // Calculate statistics
    const totalUsers = enhancedUsers?.length || 0;
    const activeUsers = enhancedUsers?.filter(u => u.status === 'ACTIVE').length || 0;
    
    // Users joined in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newThisWeek = enhancedUsers?.filter(u => 
      new Date(u.createdAt) >= sevenDaysAgo
    ).length || 0;

    // Top contributors (users with most verified submissions)
    const topContributors = enhancedUsers?.filter(u => 
      u.verifiedSubmissions >= 5
    ).length || 0;

    console.log('✅ Returning data:', {
      usersCount: enhancedUsers?.length || 0,
      totalUsers,
      activeUsers,
      newThisWeek,
      topContributors
    });

    return NextResponse.json({
      users: enhancedUsers,
      stats: {
        totalUsers,
        activeUsers,
        newThisWeek,
        topContributors,
      },
    });
  } catch (error) {
    console.error("💥 Error in admin users route:", error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}