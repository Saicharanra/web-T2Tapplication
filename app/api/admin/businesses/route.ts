import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET: Fetch all registered businesses (role = 'OWNER')
 */
export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { data: businesses, error } = await supabaseAdmin
      .from("User")
      .select("id, name, email, role, status, joinedAt, imageUrl")
      .eq("role", "OWNER")
      .order("joinedAt", { ascending: false });

    if (error) {
      console.error("Error fetching businesses:", error);
      return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 });
    }

    return NextResponse.json({ businesses: businesses || [] });

  } catch (error: any) {
    console.error("Error in GET /api/admin/businesses:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT: Approve or Suspend a Business account status
 */
export async function PUT(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    if (!userId || userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { businessId, status } = body;

    if (!businessId || !status) {
      return NextResponse.json({ error: "businessId and status are required" }, { status: 400 });
    }

    if (!["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("User")
      .update({
        status,
        updatedAt: new Date().toISOString()
      })
      .eq("id", businessId)
      .eq("role", "OWNER")
      .select("*")
      .single();

    if (updateError || !updatedUser) {
      console.error("Error updating business status:", updateError);
      return NextResponse.json({ error: "Failed to update business status" }, { status: 500 });
    }

    // Notify user
    try {
      await supabaseAdmin
        .from("Notification")
        .insert({
          userId: businessId,
          email: updatedUser.email,
          type: "account_status_changed",
          title: `Account ${status === 'ACTIVE' ? 'Approved' : 'Suspended'}`,
          message: `Your T2T Business Partner Account status has been updated to: ${status}.`,
          read: false,
          createdAt: new Date().toISOString()
        });
    } catch (notifErr) {
      console.warn("Notification insert failed:", notifErr);
    }

    return NextResponse.json({
      message: `Business status successfully updated to ${status}!`,
      business: updatedUser
    });

  } catch (error: any) {
    console.error("Error in PUT /api/admin/businesses:", error);
    if (error.message.startsWith("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
