import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_POINTS: Record<string, number> = {
  "Plastic Bottles": 15,
  "Paper Waste": 10,
  "Metal Cans": 25,
  "Glass Bottles": 20,
  "Cardboard": 12,
  "E-Waste": 50,
  "Organic Waste": 18,
  "Mixed Recyclables": 8
};

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    if (!decodedToken.uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settingsDoc = await adminDb.collection("settings").doc("pointsConfig").get();
    const pointsConfig = settingsDoc.exists ? settingsDoc.data() : DEFAULT_POINTS;

    return NextResponse.json({ pointsConfig });
  } catch (error: any) {
    console.error("Error fetching points settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (!userDoc.exists || !["ADMIN","OWNER"].includes(userDoc.data()?.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { pointsConfig } = await req.json();

    if (!pointsConfig) {
      return NextResponse.json({ error: "pointsConfig is required" }, { status: 400 });
    }

    await adminDb.collection("settings").doc("pointsConfig").set(pointsConfig, { merge: true });

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("Error updating points settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

