import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/notifications/sendEmail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Secure POST proxy API to dispatch Resend emails server-side.
 * Resolves frontend API credentials leaks by verifying standard Session auth tokens.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse request payload
    const body = await req.json();
    const { to, subject, templateName, templateProps } = body;

    if (!to || !subject || !templateName || !templateProps) {
      return NextResponse.json({ error: "Missing required email payload fields." }, { status: 400 });
    }

    // 3. Process isomorphic send (triggers direct Server SDK)
    const result = await sendEmail(to, subject, templateName, templateProps);

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (error: any) {
    console.error("❌ Secure proxy email route failed:", error);
    const status = error.message?.startsWith("Unauthorized") ? 401 : 500;
    return NextResponse.json({ error: error.message || "Failed to deliver transactional email." }, { status });
  }
}
