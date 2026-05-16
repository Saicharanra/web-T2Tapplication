import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limitNum = parseInt(searchParams.get('limit') || "20");

    let query: any = adminDb.collection("submissions").where("userId", "==", userId);

    if (status) {
      query = query.where("status", "==", status);
    }

    // Fetch all for the user and sort in memory to avoid missing index errors
    // (Only recommended for smaller datasets per user)
    const submissionsSnapshot = await query.get();
    
    // Fetch user data once
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    const allSubmissions = submissionsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort in memory: Newest first
    allSubmissions.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // Apply limit
    const slicedSubmissions = allSubmissions.slice(0, limitNum).map((sub: any) => ({
      ...sub,
      createdAt: sub.createdAt?.toDate?.() || sub.createdAt,
      user: userData ? {
        name: userData.name,
        email: userData.email,
        level: userData.level
      } : null
    }));

    return NextResponse.json({ submissions: slicedSubmissions }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!wasteType || !imageUrl || !imagePath || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let userDoc = await adminDb.collection("users").doc(userId).get();
    let userData = userDoc.exists ? userDoc.data() : null;

    if (!userDoc.exists) {
      console.log(`👤 User ${userId} not found in database. Creating basic profile...`);
      // Get user from Auth to get their email/name if possible
      try {
        const { adminAuth } = require("@/lib/firebase-admin");
        const userAuth = await adminAuth.getUser(userId);
        
        userData = {
          name: userAuth.displayName || userAuth.email?.split('@')[0] || "User",
          email: userAuth.email || "",
          role: "USER",
          level: "BRONZE",
          points: 0,
          status: "ACTIVE",
          joinedAt: new Date(),
          updatedAt: new Date(),
        };

        await adminDb.collection("users").doc(userId).set(userData);
        console.log(`✅ Basic profile created for ${userId}`);
      } catch (authError) {
        console.error("❌ Error fetching user from Auth or creating profile:", authError);
        return NextResponse.json(
          { error: "User profile not found and could not be created automatically." },
          { status: 404 }
        );
      }
    }

    const id = submissionId || adminDb.collection("submissions").doc().id;

    const submissionData = {
      id,
      userId,
      wasteType,
      imageUrl,
      imagePath,
      imageSize: imageSize || 0,
      imageMimeType: imageMimeType || 'image/jpeg',
      location,
      status: 'PENDING',
      pointsAwarded: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`📝 Storing submission ${id} for user ${userId}`);
    await adminDb.collection("submissions").doc(id).set(submissionData);

    const submissionWithUser = {
      ...submissionData,
      user: {
        name: userData?.name,
        email: userData?.email
      }
    };

    return NextResponse.json({ submission: submissionWithUser }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating submission:", error);
    
    // Provide more specific error info
    const errorMessage = error.message || "Failed to create submission";
    const status = error.code === 'permission-denied' ? 403 : 500;

    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create submission",
        details: errorMessage
      },
      { status }
    );
  }
}
