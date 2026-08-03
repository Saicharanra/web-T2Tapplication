import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Haversine formula — calculate distance in km between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GET: Fetch user's own submissions ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limitNum = parseInt(searchParams.get("limit") || "20");

    let query = supabaseAdmin
      .from("waste_submissions")
      .select(`
        id, user_id, category, weight, location, latitude, longitude,
        image_url, image_path, image_size, image_mime_type,
        points_awarded, status, ai_confidence, rejection_reason, notes,
        verified_at, created_at, updated_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limitNum);

    if (status) query = query.eq("status", status.toUpperCase());

    const { data: submissions, error } = await query;

    if (error) {
      console.error("❌ Error fetching submissions:", error);
      return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
    }

    // Shape response to match frontend expectations
    const shaped = (submissions || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      wasteType: s.category,
      weight: s.weight,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      imageUrl: s.image_url,
      imagePath: s.image_path,
      imageSize: s.image_size,
      imageMimeType: s.image_mime_type,
      pointsAwarded: s.points_awarded,
      status: s.status,
      aiConfidence: s.ai_confidence,
      rejectionReason: s.rejection_reason,
      notes: s.notes,
      verifiedAt: s.verified_at,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      user: { name: session.name || "Eco Warrior", email: session.email || "" },
    }));

    return NextResponse.json({ submissions: shaped }, { status: 200 });
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to fetch submissions" }, { status });
  }
}

// ─── POST: Create new waste submission ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await verifySession(req);
    const userId = session.uid;

    const body = await req.json();
    const {
      wasteType,
      imageUrl,
      imagePath,
      imageSize,
      imageMimeType,
      location,
      submissionId,
      latitude,
      longitude,
    } = body;

    if (!wasteType || !imageUrl || !imagePath || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedLat = latitude != null ? Number(latitude) : null;
    const parsedLng = longitude != null ? Number(longitude) : null;
    const id = submissionId || crypto.randomUUID();

    // Insert into Supabase waste_submissions
    const { data: submission, error: insertError } = await supabaseAdmin
      .from("waste_submissions")
      .insert({
        id,
        user_id: userId,
        category: wasteType,
        image_url: imageUrl,
        image_path: imagePath,
        image_size: imageSize || 0,
        image_mime_type: imageMimeType || "image/jpeg",
        location,
        latitude: parsedLat,
        longitude: parsedLng,
        status: "PENDING",
        points_awarded: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("❌ Error creating submission:", insertError);
      return NextResponse.json({ error: "Failed to create submission", details: insertError.message }, { status: 500 });
    }

    // 🤖 Auto-verify via ML service (fire-and-forget)
    try {
      const mlUrl = process.env.ML_SERVICE_URL;
      if (mlUrl) {
        fetch(`${mlUrl.replace(/\/$/, "")}/verify/${id}`, { method: "POST" }).catch((e) =>
          console.error("⚠️ ML auto-verify call failed:", e)
        );
      }
    } catch (_) {}

    // 📣 In-App Notification
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        email: session.email,
        type: "submission_received",
        title: "Submission Received",
        message: "Your disposal submission has been received and is pending review.",
        read: false,
        created_at: new Date().toISOString(),
      });
    } catch (notifErr) {
      console.warn("⚠️ Failed to insert submission notification:", notifErr);
    }

    // 🗺️ Auto-map waste bin (50-meter grouping threshold)
    if (parsedLat != null && parsedLng != null && !isNaN(parsedLat) && !isNaN(parsedLng)) {
      try {
        const { data: bins } = await supabaseAdmin.from("bins").select("id, latitude, longitude");
        const nearby = (bins || []).find(
          (b: any) =>
            b.latitude != null &&
            b.longitude != null &&
            calculateDistance(parsedLat, parsedLng, Number(b.latitude), Number(b.longitude)) < 0.05
        );

        if (!nearby) {
          await supabaseAdmin.from("bins").insert({
            id: crypto.randomUUID(),
            name: `${wasteType || "Waste"} Disposal Point`,
            address: location,
            latitude: parsedLat,
            longitude: parsedLng,
            location_type: "collection_point",
            photo_url: imageUrl,
            added_by: userId,
            created_at: new Date().toISOString(),
          });
        }
      } catch (binErr) {
        console.warn("⚠️ Bin mapping error:", binErr);
      }
    }

    return NextResponse.json(
      {
        submission: {
          ...submission,
          userId: submission.user_id,
          wasteType: submission.category,
          imageUrl: submission.image_url,
          user: { name: session.name, email: session.email },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to create submission" }, { status });
  }
}
