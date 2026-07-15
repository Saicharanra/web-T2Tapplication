import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function verifyAdmin(req: NextRequest) {
  const decodedToken = await verifySession(req);
  const userId = decodedToken.uid;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const userDoc = await adminDb.collection("users").doc(userId).get();
  if (!userDoc.exists || !["ADMIN","OWNER"].includes(userDoc.data()?.role)) {
    throw new Error("Forbidden");
  }

  return userId;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin privilege
    await verifyAdmin(req);

    // 2. Fetch from Python ML microservice
    const rawMicroserviceUrl = process.env.ML_MICROSERVICE_URL || "http://127.0.0.1:8000/api/predict";
    const pythonBaseUrl = new URL(rawMicroserviceUrl).origin;

    // Call info and status endpoints in parallel
    const [infoRes, statusRes] = await Promise.all([
      fetch(`${pythonBaseUrl}/api/model/info`, { cache: 'no-store' }),
      fetch(`${pythonBaseUrl}/api/model/status`, { cache: 'no-store' })
    ]);

    let info = { model_loaded: false, categories: [], model_path: '', model_exists: false };
    let status = { is_training: false, progress: 0, epoch: 0, total_epochs: 0, loss: 0.0, accuracy: 0.0, status: 'idle', message: 'Not running' };

    if (infoRes.ok) {
      info = await infoRes.json();
    }
    if (statusRes.ok) {
      status = await statusRes.json();
    }

    return NextResponse.json({
      success: true,
      info,
      status
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/model-tuning:", error.message);
    
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: "ML service is unreachable. Please make sure the Python server is running.",
      details: error.message
    }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin privilege
    await verifyAdmin(req);

    const body = await req.json();

    // 2. Forward train request to Python ML microservice
    const rawMicroserviceUrl = process.env.ML_MICROSERVICE_URL || "http://127.0.0.1:8000/api/predict";
    const pythonBaseUrl = new URL(rawMicroserviceUrl).origin;

    const trainRes = await fetch(`${pythonBaseUrl}/api/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        epochs: body.epochs || 25,
        batch_size: body.batch_size || 32,
        learning_rate: body.learning_rate || 0.001
      })
    });

    if (!trainRes.ok) {
      const errText = await trainRes.text();
      return NextResponse.json({ success: false, error: errText }, { status: trainRes.status });
    }

    const result = await trainRes.json();
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/model-tuning:", error.message);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    return NextResponse.json({
      success: false,
      error: "Failed to communicate with ML service.",
      details: error.message
    }, { status: 502 });
  }
}

