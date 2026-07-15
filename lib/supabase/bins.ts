import { supabaseAdmin } from "@/lib/supabase-server";
import { BinDocument } from "@/types/find-bins";

const TABLE = "Bin";

/**
 * Creates a new crowdsourced waste-bin row in Supabase.
 */
export async function createBin(
  userId: string,
  binData: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    locationType: string;
    photoUrl: string;
  }
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .insert({
      name: binData.name,
      address: binData.address,
      latitude: binData.latitude,
      longitude: binData.longitude,
      locationType: binData.locationType,
      photoUrl: binData.photoUrl,
      addedBy: userId,
      createdAt: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("❌ createBin failed:", error);
    throw new Error(error?.message || "Failed to create bin");
  }

  return data.id;
}

/**
 * Fetches all bins from Supabase.
 */
export async function fetchBins(): Promise<BinDocument[]> {
  const { data, error } = await supabaseAdmin
    .from(TABLE)
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("❌ fetchBins failed:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    locationType: row.locationType,
    photoUrl: row.photoUrl,
    addedBy: row.addedBy,
    createdAt: row.createdAt,
  }));
}

/**
 * Deletes a waste-bin row from Supabase.
 */
export async function deleteBin(binId: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TABLE).delete().eq("id", binId);
  if (error) {
    console.error("❌ deleteBin failed:", error);
    throw new Error(error.message);
  }
}
