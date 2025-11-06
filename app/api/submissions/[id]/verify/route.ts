import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Verify or reject submission
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    // Await auth() for Next.js 15 compatibility
    const authResult = await auth();
    const { userId } = authResult;

    console.log('🔍 Verify/Reject request from:', userId, 'for submission:', params.id);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create Supabase server client
    const supabase = await createSupabaseServerClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, role, name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN") {
      console.error('❌ User is not admin. Role:', user.role);
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    console.log('✅ Admin verified:', user.name);

    const body = await req.json();
    const { status, points, rejectionReason } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    if (status === "VERIFIED" && !points) {
      return NextResponse.json(
        { error: "Points required for verification" },
        { status: 400 }
      );
    }

    console.log('📝 Updating submission:', params.id, 'to status:', status);

    // Get current submission to find the user
    const { data: currentSubmission, error: fetchError } = await supabase
      .from('Submission')
      .select('userId, wasteType, pointsAwarded')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentSubmission) {
      console.error('❌ Submission not found:', fetchError);
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    console.log('📦 Current submission user:', currentSubmission.userId);

    // Update submission status
    const { data: submission, error: updateError } = await supabase
      .from('Submission')
      .update({
        status,
        pointsAwarded: status === 'VERIFIED' ? points : 0,
        verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
        assignedAdminId: userId,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update submission', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ Submission updated:', submission.id, 'Status:', submission.status);

    // If verified, update user points and create history
    if (status === 'VERIFIED' && points > 0) {
      console.log('💰 Awarding', points, 'points to user:', currentSubmission.userId);

      // Get current user points
      const { data: userData, error: userFetchError } = await supabase
        .from('User')
        .select('points, name, email')
        .eq('id', currentSubmission.userId)
        .single();

      if (userFetchError) {
        console.error('❌ Error fetching user:', userFetchError);
      } else {
        console.log('👤 User before update:', userData.name, 'Points:', userData.points);

        // Update user points
        const newPoints = (userData.points || 0) + points;
        const { data: updatedUser, error: pointsUpdateError } = await supabase
          .from('User')
          .update({ points: newPoints })
          .eq('id', currentSubmission.userId)
          .select()
          .single();

        if (pointsUpdateError) {
          console.error('❌ Error updating user points:', pointsUpdateError);
        } else {
          console.log('✅ User points updated:', updatedUser.name, 'New points:', updatedUser.points);
        }

        // Create points history record
        const { error: historyError } = await supabase
          .from('PointsHistory')
          .insert({
            userId: currentSubmission.userId,
            submissionId: submission.id,
            points: points,
            description: `Points earned from ${currentSubmission.wasteType} recycling`,
            type: 'EARNED',
          });

        if (historyError) {
          console.error('❌ Error creating points history:', historyError);
        } else {
          console.log('✅ Points history created');
        }
      }
    }

    console.log('🎉 Verification complete!');

    return NextResponse.json({
      submission,
      message: status === 'VERIFIED' 
        ? `Submission verified! ${points} points awarded.`
        : 'Submission rejected.'
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error in verify route:", error);
    return NextResponse.json(
      { error: "Failed to verify submission", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
