import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Define types for Clerk webhook events
interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    image_url?: string;
    public_metadata?: {
      role?: string;
    };
    unsafe_metadata?: {
      role?: string;
    };
  };
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("========================================");
  console.log("🔔 Clerk webhook triggered at:", new Date().toISOString());
  console.log("========================================");

  try {
    // STEP 1: Check environment variables
    console.log("[1/5] Checking environment variables...");
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error("❌ CLERK_WEBHOOK_SECRET is missing!");
      return NextResponse.json({ error: "CLERK_WEBHOOK_SECRET not configured" }, { status: 500 });
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing!");
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ NEXT_PUBLIC_SUPABASE_URL is missing!");
      return NextResponse.json({ error: "NEXT_PUBLIC_SUPABASE_URL not configured" }, { status: 500 });
    }
    console.log("✅ All environment variables present");

    // Create Supabase admin client with service key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // STEP 2: Get headers - CORRECTLY AWAITED
    console.log("[2/5] Reading Svix headers...");
    const headerPayload = await headers(); // This is correctly awaited
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("❌ Missing Svix headers:", { svix_id, svix_timestamp, svix_signature });
      return NextResponse.json({ error: "Missing Svix headers" }, { status: 400 });
    }
    console.log("✅ Svix headers received");

    // STEP 3: Get payload
    console.log("[3/5] Reading request payload...");
    const payload = await req.text();
    console.log("✅ Payload received, length:", payload.length);

    // STEP 4: Verify webhook signature
    console.log("[4/5] Verifying webhook signature...");
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    
    const event = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;

    console.log("✅ Signature verified successfully!");
    console.log("📋 Event type:", event.type);
    console.log("📋 User ID:", event.data?.id);

    // STEP 5: Process event
    console.log("[5/5] Processing event...");
    
    const user = event.data;
    const id = user.id;
    const email = user.email_addresses?.[0]?.email_address || "";
    const name = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
    const image = user.image_url || "";
    
    // Extract role from Clerk metadata (public_metadata.role or unsafe_metadata.role)
    const clerkRole = user.public_metadata?.role || user.unsafe_metadata?.role || "USER";
    const role = (clerkRole === "ADMIN" || clerkRole === "USER") ? clerkRole : "USER";

    console.log("👤 User data:", { id, email, name, hasImage: !!image, role, clerkMetadata: user.public_metadata });

    if (event.type === "user.created") {
      console.log("🆕 Handling user.created event...");
      const { data, error } = await supabaseAdmin.from("User").upsert(
        [{
          id,
          name,
          email,
          imageUrl: image,
          role: role, // Use role from Clerk metadata
          level: "BRONZE",
          points: 0,
          status: "ACTIVE",
        }],
        { onConflict: "id" }
      );
      
      if (error) {
        console.error("❌ Supabase upsert error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("✅ User created in Supabase:", id);
      console.log("📊 Database response:", data);
    }

    if (event.type === "user.updated") {
      console.log("🔄 Handling user.updated event...");
      
      const { error } = await supabaseAdmin
        .from("User")
        .update({ 
          name, 
          email, 
          imageUrl: image,
          role: role // Sync role updates from Clerk
        })
        .eq("id", id);
      
      if (error) {
        console.error("❌ Supabase update error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("✅ User updated:", id);
    }

    if (event.type === "user.deleted") {
      console.log("🗑️ Handling user.deleted event...");
      
      const { error } = await supabaseAdmin.from("User").delete().eq("id", id);
      
      if (error) {
        console.error("❌ Supabase delete error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("✅ User deleted:", id);
    }

    console.log("========================================");
    console.log("✅ Webhook processed successfully!");
    console.log("========================================");
    
    return NextResponse.json({ 
      success: true,
      eventType: event.type,
      userId: id,
      timestamp: new Date().toISOString()
    }, { status: 200 });
    
  } catch (err: unknown) {
    console.error("========================================");
    console.error("❌❌❌ WEBHOOK ERROR ❌❌❌");
    console.error("Error name:", (err as Error).name);
    console.error("Error message:", (err as Error).message);
    console.error("Error stack:", (err as Error).stack);
    console.error("========================================");
    
    return NextResponse.json({ 
      success: false,
      error: (err as Error).message || "Unknown error",
      errorType: (err as Error).name || "Error",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}