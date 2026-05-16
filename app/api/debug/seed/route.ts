import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    // 1. Seed Rewards
    const rewards = [
      {
        title: "Eco-Friendly Tote Bag",
        description: "A durable, reusable tote bag made from 100% recycled cotton.",
        points_required: 200,
        image_url: "🛍️",
        status: "Active",
        category: "Merchandise",
        stock: 50,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: "Plant a Tree",
        description: "We will plant a tree in your name in a reforestation project.",
        points_required: 500,
        image_url: "🌳",
        status: "Active",
        category: "Environment",
        stock: 999,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        title: "$10 Amazon Gift Card",
        description: "Get a $10 Amazon gift card for your sustainable efforts.",
        points_required: 1000,
        image_url: "💳",
        status: "Active",
        category: "Gift Cards",
        stock: 10,
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];

    for (const reward of rewards) {
      await adminDb.collection("rewards").add(reward);
    }

    // 2. Create a system admin user (Placeholder)
    await adminDb.collection("users").doc("system-admin").set({
      name: "System Admin",
      email: "admin@trash2treasure.com",
      role: "ADMIN",
      level: "PLATINUM",
      points: 9999,
      status: "ACTIVE",
      joinedAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. Create initial collections by adding a dummy document to each
    await adminDb.collection("submissions").doc("schema-init").set({
      userId: "system-admin",
      wasteType: "Plastic",
      status: "VERIFIED",
      location: "Initial Seed",
      createdAt: new Date(),
      pointsAwarded: 0
    });

    await adminDb.collection("redemptions").doc("schema-init").set({
      user_id: "system-admin",
      reward_id: "seed-reward",
      redeemed_at: new Date(),
      status: "ACTIVE"
    });

    await adminDb.collection("pointsHistory").doc("schema-init").set({
      userId: "system-admin",
      points: 0,
      description: "Database initialized",
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: "Database seeded successfully! Collections should now appear in Firebase Console.",
      collectionsCreated: ["rewards", "users", "submissions", "redemptions", "pointsHistory"]
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
