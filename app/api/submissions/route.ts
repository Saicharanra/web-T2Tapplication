import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: Fetch user's submissions
export async function GET(req: NextRequest) {
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // Optional status filter

    // Build query
    let query = supabase
      .from('Submission')
      .select(`
        *,
        user:User!userId(
          name,
          email,
          level
        )
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submissions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// POST: Create new submission
export async function POST(req: NextRequest) {
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    console.log('📝 Creating submission for user:', userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    const body = await req.json();
    const {
      wasteType,
      imageUrl,
      imagePath,
      imageSize,
      imageMimeType,
      location,
      submissionId,
    } = body;

    console.log('📦 Submission payload:', {
      submissionId,
      userId,
      wasteType,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      imagePath,
      location,
    });

    // Validate required fields
    if (!wasteType || !imageUrl || !imagePath || !location) {
      console.error('❌ Missing required fields:', {
        hasWasteType: !!wasteType,
        hasImageUrl: !!imageUrl,
        hasImagePath: !!imagePath,
        hasLocation: !!location,
      });
      return NextResponse.json(
        { error: "Missing required fields", details: { wasteType: !!wasteType, imageUrl: !!imageUrl, imagePath: !!imagePath, location: !!location } },
        { status: 400 }
      );
    }

    // Check if user exists in database
    console.log('👤 Checking if user exists...');
    const { data: userCheck, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !userCheck) {
      console.error('❌ User not found in database:', userError);
      return NextResponse.json(
        { 
          error: 'User not found in database. Please sign out and sign in again, or contact admin.',
          details: userError?.message,
          userId: userId
        },
        { status: 404 }
      );
    }

    console.log('✅ User exists:', userCheck);

    // Insert submission into database
    console.log('💾 Inserting submission into database...');
    const { data: submission, error } = await supabase
      .from('Submission')
      .insert({
        id: submissionId || crypto.randomUUID(),
        userId,
        wasteType,
        imageUrl,
        imagePath,
        imageSize,
        imageMimeType,
        location,
        status: 'PENDING',
        pointsAwarded: 0,
      })
      .select(
        `
        *,
        user:User!userId(
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: 'Failed to create submission',
          message: error.message,
          code: error.code,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    console.log('✅ Submission created successfully:', submission.id);
    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error("❌ Unexpected error creating submission:", error);
    return NextResponse.json(
      { 
        error: "Failed to create submission",
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
