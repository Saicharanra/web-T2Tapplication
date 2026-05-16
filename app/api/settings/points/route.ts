import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

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
    // Public route - anyone can see the points configuration
    const settingsDoc = await adminDb.collection("settings").doc("pointsConfig").get();
    const pointsConfig = settingsDoc.exists ? settingsDoc.data() : DEFAULT_POINTS;

    return NextResponse.json({ pointsConfig });
  } catch (error: any) {
    console.error("Error fetching points settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
