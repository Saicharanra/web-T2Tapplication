import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET: Fetch current user's profile data
 */
export async function GET(_req: NextRequest) {  // Keep underscore prefix to indicate intentionally unused
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Fetch user data from database
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("Error in profile route:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
