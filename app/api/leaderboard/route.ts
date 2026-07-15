import { NextRequest, NextResponse } from "next/server";
import { verifySession, adminDb } from "@/lib/firebase-admin";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const decodedToken = await verifySession(req);
    const userId = decodedToken.uid;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all users to calculate accurate rank
    // For large datasets, this would need an index and offset/limit
    // But for initial scale, fetching and sorting in-memory is more robust
    const usersSnapshot = await adminDb.collection("users").get();
    
    let allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any));

    // Sort by points descending
    allUsers.sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));

    // Map to the format expected by the frontend
    const fullLeaderboard = allUsers.map((user, index) => {
      const name = user.name || "Eco Warrior";
      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

      return {
        rank: index + 1,
        id: user.id,
        name: name,
        email: user.email || "",
        points: Number(user.points) || 0,
        level: user.level || "BRONZE",
        submissions: 0, // We'll fill this below for top users
        avatar: initials,
        joinedAt: user.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Get top 50 for the list
    const top50 = fullLeaderboard.slice(0, 50);

    // Get current user's rank
    const userIndex = fullLeaderboard.findIndex(u => u.id === userId);
    let currentUser = userIndex !== -1 ? fullLeaderboard[userIndex] : null;

    // Enhance top users and current user with submission counts
    // (Doing this selectively to avoid massive amounts of count queries)
    const usersToEnhance = [...top50];
    if (currentUser && !top50.find(u => u.id === userId)) {
      usersToEnhance.push(currentUser);
    }

    await Promise.all(usersToEnhance.map(async (u) => {
      try {
        const subSnapshot = await adminDb.collection("submissions")
          .where("userId", "==", u.id)
          .count()
          .get();
        u.submissions = subSnapshot.data().count;
      } catch (e) {
        console.warn(`⚠️ Could not count submissions for user ${u.id}`);
      }
    }));

    return NextResponse.json({
      leaderboard: top50,
      currentUser,
      total: fullLeaderboard.length,
    });
  } catch (error: any) {
    console.error("💥 Leaderboard Server Error:", error);
    if (error.message.startsWith('Unauthorized')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

