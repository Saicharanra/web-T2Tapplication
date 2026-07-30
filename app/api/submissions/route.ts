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

    // Fetch user data once
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    let slicedSubmissions: any[] = [];
    
    try {
      // 1. Try highly optimized composite index query (newest first)
      let query: any = adminDb.collection("submissions")
        .where("userId", "==", userId);

      if (status) {
        query = query.where("status", "==", status);
      }

      query = query.orderBy("createdAt", "desc").limit(limitNum);
      const submissionsSnapshot = await query.get();
      
      slicedSubmissions = submissionsSnapshot.docs.map((doc: any) => {
        const subData = doc.data();
        return {
          id: doc.id,
          ...subData,
          createdAt: subData.createdAt?.toDate?.() || subData.createdAt,
          user: userData ? {
            name: userData.name,
            email: userData.email,
            level: userData.level
          } : null
        };
      });
    } catch (indexErr) {
      console.warn("⚠️ Submissions index is missing or building. Falling back to in-memory sort...", indexErr);
      
      // 2. Fallback: Query equality filters and sort in-memory
      let query: any = adminDb.collection("submissions").where("userId", "==", userId);

      if (status) {
        query = query.where("status", "==", status);
      }

      const submissionsSnapshot = await query.get();
      const allSubmissions = submissionsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort in-memory: Newest first
      allSubmissions.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      slicedSubmissions = allSubmissions.slice(0, limitNum).map((sub: any) => ({
        ...sub,
        createdAt: sub.createdAt?.toDate?.() || sub.createdAt,
        user: userData ? {
          name: userData.name,
          email: userData.email,
          level: userData.level
        } : null
      }));
    }

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
      latitude,
      longitude,
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

    const parsedLat = latitude !== undefined && latitude !== null ? Number(latitude) : null;
    const parsedLng = longitude !== undefined && longitude !== null ? Number(longitude) : null;

    const submissionData = {
      id,
      userId,
      wasteType,
      imageUrl,
      imagePath,
      imageSize: imageSize || 0,
      imageMimeType: imageMimeType || 'image/jpeg',
      location,
      latitude: parsedLat,
      longitude: parsedLng,
      status: 'PENDING',
      pointsAwarded: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log(`📝 Storing submission ${id} for user ${userId}`);
    await adminDb.collection("submissions").doc(id).set(submissionData);

    // 🤖 Auto-verify with the ML model (fire-and-forget — the user isn't blocked).
    // The ML service downloads the image, identifies the waste object, checks for
    // duplicates, and writes VERIFIED/REJECTED + per-category points straight into
    // Supabase. Wrapped so it can never break submission creation.
    try {
      const mlUrl = process.env.ML_SERVICE_URL;
      if (mlUrl) {
        fetch(`${mlUrl.replace(/\/$/, "")}/verify/${id}`, { method: "POST" })
          .catch((e) => console.error("⚠️ ML auto-verify call failed:", e));
      }
    } catch (mlErr) {
      console.error("⚠️ ML auto-verify dispatch error:", mlErr);
    }

    // Coordinated Notifications (In-App + Transactional Resend Emails)
    try {
      if (userData && userData.email) {
        const email = userData.email;
        const name = userData.name || "Eco Partner";
        const { sendEmail } = await import("@/lib/notifications/sendEmail");

        // A: Log In-App Notification
        await adminDb.collection("notifications").add({
          userId,
          email,
          type: "submission_received",
          title: "Submission Received",
          message: "Your disposal submission has been successfully received and is pending review.",
          read: false,
          createdAt: new Date(),
        });

        // B: Send Resend Email
        await sendEmail(email, "Disposal Submission Received", "received", {
          name,
          wasteType,
          location,
        });
      }
    } catch (notifErr) {
      console.error("⚠️ Failed to dispatch post-submission notifications:", notifErr);
    }

    // Dynamic Automatic Shared Waste-Bin Mapping and Grouping (50 meters threshold)
    if (parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng)) {
      try {
        const binsSnapshot = await adminDb.collection("bins").get();
        let nearbyBinFound = false;

        for (const doc of binsSnapshot.docs) {
          const binData = doc.data();
          if (binData.latitude !== undefined && binData.longitude !== undefined) {
            const dist = calculateDistance(
              parsedLat,
              parsedLng,
              Number(binData.latitude),
              Number(binData.longitude)
            );
            // 50 meters grouping threshold (0.05 km)
            if (dist < 0.05) {
              nearbyBinFound = true;
              console.log(`📌 Automatic Grouping: disposal matches existing bin spot: ${doc.id}`);
              break;
            }
          }
        }

        if (!nearbyBinFound) {
          const newBinId = adminDb.collection("bins").doc().id;
          const newBinData = {
            id: newBinId,
            name: `${wasteType || "Waste"} Disposal Point`,
            address: location || "Community disposal area",
            latitude: parsedLat,
            longitude: parsedLng,
            locationType: "collection_point",
            photoUrl: imageUrl || "",
            addedBy: userId,
            createdAt: new Date(),
          };

          await adminDb.collection("bins").doc(newBinId).set(newBinData);
          console.log(`🆕 Automatic Mapped Bin: registered new crowdsourced waste point: ${newBinId}`);
        }
      } catch (err) {
        console.error("⚠️ Error processing automatic shared bin network:", err);
      }
    }

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

// Haversine formula to calculate exact distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

