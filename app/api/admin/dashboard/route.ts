

import { NextRequest, NextResponse } from "next/server";
//import { auth } from "@clerk/nextjs/server"; 
//import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic"; 
export const runtime = "nodejs"; 

/**
 * GET: Fetch admin dashboard statistics
 */
export async function GET(_req: NextRequest) { 
  try {
    console.log('🔍 Admin dashboard API called');
    
    // Auth is commented, which is okay for testing only
    // const { userId } = await auth();
    // console.log('👤 Requesting user ID:', userId);

    // if (!userId) {
    //   console.error('❌ No userId found');
    //   return NextResponse.json({ error: "Unauthorized - No user ID" }, { status: 401 });
    // }

    // Create Supabase server client (commented out, so data-fetching is not live, but fine for a stub)
    //const supabase = await createSupabaseServerClient();
    console.log('✅ Supabase client created');

    // Returns hardcoded dashboard data (good for fallback/test, not for production)
    return NextResponse.json({
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        newThisWeek: 0,
        topContributors: 0,
        recentSubmissions: 0,
        totalPoints: 0,
      },
      users: [],
    });
  } catch (error) {
    console.error("💥 Error in admin dashboard route:", error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: "Failed to fetch dashboard data",
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

