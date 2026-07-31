import { supabaseAdmin } from "./supabase-server";

// Helper to convert Firestore collection names to Supabase table names
function getTableName(collection: string): string {
  switch (collection) {
    case "users":
    case "User":
      return "users";
    case "submissions":
    case "Submission":
    case "waste_submissions":
      return "waste_submissions";
    case "pointsHistory":
    case "PointsHistory":
    case "points_history":
      return "points_history";
    case "rewards":
    case "Reward":
    case "coupons":
      return "coupons";
    case "redemptions":
    case "RewardRedemption":
    case "coupon_redemptions":
      return "coupon_redemptions";
    case "notifications":
    case "Notification":
      return "notifications";
    case "bins":
    case "Bin":
      return "bins";
    case "otp":
    case "OTP":
    case "otp_codes":
      return "otp_codes";
    default:
      return collection;
  }
}

// Field mapping dictionary from legacy camelCase fields to Postgres snake_case columns
const FIELD_TO_POSTGRES: Record<string, string> = {
  userId: "user_id",
  binId: "bin_id",
  wasteType: "category",
  imageUrl: "image_url",
  imagePath: "image_path",
  imageSize: "image_size",
  imageMimeType: "image_mime_type",
  pointsAwarded: "points_awarded",
  aiConfidence: "ai_confidence",
  assignedAdminId: "assigned_admin_id",
  rejectionReason: "rejection_reason",
  verifiedAt: "verified_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
  joinedAt: "joined_at",
  avatarUrl: "avatar_url",
  locationType: "location_type",
  fillPercentage: "fill_percentage",
  photoUrl: "photo_url",
  addedBy: "added_by",
  lastCleared: "last_cleared",
  submissionId: "submission_id",
  transactionType: "transaction_type",
  expiresAt: "expires_at",
  redeemedAt: "redeemed_at",
  wasteSubmitted: "waste_submitted",
};

const POSTGRES_TO_FIELD: Record<string, string> = {
  user_id: "userId",
  bin_id: "binId",
  category: "wasteType",
  image_url: "imageUrl",
  image_path: "imagePath",
  image_size: "imageSize",
  image_mime_type: "imageMimeType",
  points_awarded: "pointsAwarded",
  ai_confidence: "aiConfidence",
  assigned_admin_id: "assignedAdminId",
  rejection_reason: "rejectionReason",
  verified_at: "verifiedAt",
  created_at: "createdAt",
  updated_at: "updatedAt",
  joined_at: "joinedAt",
  avatar_url: "avatarUrl",
  location_type: "locationType",
  fill_percentage: "fillPercentage",
  photo_url: "photoUrl",
  added_by: "addedBy",
  last_cleared: "lastCleared",
  submission_id: "submissionId",
  transaction_type: "transactionType",
  expires_at: "expiresAt",
  redeemed_at: "redeemedAt",
  waste_submitted: "wasteSubmitted",
};

function toPostgresColumn(field: string): string {
  return FIELD_TO_POSTGRES[field] || field;
}

// Convert Firestore fields to Postgres columns
function toPostgres(table: string, data: any): any {
  if (!data) return data;
  const result: any = {};

  const schemas: Record<string, string[]> = {
    users: ["id", "name", "email", "phone", "role", "level", "points", "status", "location", "city", "state", "avatar_url", "waste_submitted", "joined_at", "created_at", "updated_at"],
    waste_submissions: ["id", "user_id", "bin_id", "category", "weight", "location", "image_url", "image_path", "image_size", "image_mime_type", "points_awarded", "status", "ai_confidence", "assigned_admin_id", "rejection_reason", "notes", "verified_at", "created_at", "updated_at"],
    points_history: ["id", "user_id", "submission_id", "points", "transaction_type", "description", "created_at"],
    notifications: ["id", "user_id", "email", "type", "title", "message", "read", "created_at", "updated_at"],
    bins: ["id", "name", "location", "address", "latitude", "longitude", "location_type", "capacity", "fill_percentage", "status", "photo_url", "added_by", "last_cleared", "created_at", "updated_at"],
    coupons: ["id", "business_id", "title", "description", "coupon_code", "discount_type", "discount_value", "reward_points_required", "maximum_redemptions", "current_redemptions", "stock", "banner_url", "image_url", "start_date", "expiry_date", "status", "created_at", "updated_at"],
    coupon_redemptions: ["id", "coupon_id", "customer_id", "business_id", "voucher_code", "redeemed_at", "verification_status", "verified_by", "visit_confirmed", "points_used", "created_at", "updated_at"],
  };

  const allowedColumns = schemas[table] || [];

  for (const [key, value] of Object.entries(data)) {
    let val = value;
    if (value instanceof Date || (value && typeof value === "object" && typeof (value as any).toISOString === "function")) {
      val = (value as any).toISOString();
    } else if (value && typeof value === "object" && "toDate" in value) {
      val = (value as any).toDate().toISOString();
    }

    const pgCol = toPostgresColumn(key);

    if (allowedColumns.length === 0 || allowedColumns.includes(pgCol)) {
      result[pgCol] = val;
    }
  }
  return result;
}

// Convert Postgres columns to Firestore fields
function fromPostgres(table: string, data: any): any {
  if (!data) return data;
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    let val = value;
    // Map timestamp strings to mock Firestore timestamps
    if (
      (key.toLowerCase().endsWith("at") || key.toLowerCase().endsWith("date") || key === "created_at" || key === "updated_at" || key === "joined_at" || key === "verified_at") &&
      typeof value === "string"
    ) {
      val = mockTimestamp(value);
    }

    // Always keep Postgres key
    result[key] = val;

    // Set aliased camelCase key for Firestore compatibility
    const camelKey = POSTGRES_TO_FIELD[key];
    if (camelKey && camelKey !== key) {
      result[camelKey] = val;
    }
  }
  return result;
}

function mockTimestamp(dateStr: string) {
  const date = new Date(dateStr);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1e6,
    toString: () => date.toString(),
    toISOString: () => date.toISOString(),
    toJSON: () => date.toISOString(),
  };
}

class DocumentSnapshot {
  constructor(public id: string, private dataObj: any, public ref: DocumentReference) {}
  get exists() {
    return !!this.dataObj;
  }
  data() {
    return this.dataObj;
  }
}

class QuerySnapshot {
  constructor(public docs: DocumentSnapshot[]) {}
  get size() {
    return this.docs.length;
  }
  get empty() {
    return this.docs.length === 0;
  }
  forEach(callback: (doc: DocumentSnapshot) => void) {
    this.docs.forEach(callback);
  }
}

// Local storage files for non-database collections like settings
let settingsMemory: Record<string, any> = {
  pointsConfig: {
    "Plastic Bottles": 15,
    "Paper Waste": 10,
    "Metal Cans": 25,
    "Glass Bottles": 20,
    "Cardboard": 12,
    "E-Waste": 50,
    "Organic Waste": 18,
    "Mixed Recyclables": 8,
    PLASTIC: 15,
    GLASS: 20,
    PAPER: 10,
    METAL: 25,
    ORGANIC: 5,
    OTHER: 8,
  },
};

class DocumentReference {
  constructor(public collection: string, public id: string) {}

  async get() {
    const table = getTableName(this.collection);
    if (table === "settings") {
      const data = settingsMemory[this.id];
      return new DocumentSnapshot(this.id, data, this);
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select("*")
      .eq("id", this.id)
      .maybeSingle();

    if (error || !data) {
      return new DocumentSnapshot(this.id, null, this);
    }
    return new DocumentSnapshot(this.id, fromPostgres(table, data), this);
  }

  async set(data: any, options?: { merge?: boolean }) {
    const table = getTableName(this.collection);
    if (table === "settings") {
      settingsMemory[this.id] = options?.merge
        ? { ...settingsMemory[this.id], ...data }
        : data;
      return;
    }

    const pgData = toPostgres(table, data);
    pgData.id = this.id;

    const { error } = await supabaseAdmin.from(table).upsert(pgData);
    if (!error) return;

    // Fallback for waste_submissions if flat schema columns (e.g., 'category') do not exist in DB
    if (table === "waste_submissions") {
      const rawCategory = data.wasteType || data.category || "Plastic";
      let catId = data.category_id || null;

      // Try matching category_id from name
      if (!catId && rawCategory) {
        try {
          const matchName = rawCategory.toLowerCase().includes("paper") ? "Paper"
            : rawCategory.toLowerCase().includes("metal") ? "Metal"
            : rawCategory.toLowerCase().includes("glass") ? "Glass"
            : rawCategory.toLowerCase().includes("e-waste") || rawCategory.toLowerCase().includes("electronic") ? "E-Waste"
            : rawCategory.toLowerCase().includes("organic") ? "Organic"
            : "Plastic";

          const { data: catRow } = await supabaseAdmin
            .from("waste_categories")
            .select("id")
            .eq("name", matchName)
            .maybeSingle();

          if (catRow) catId = catRow.id;
        } catch (e) {}
      }

      if (!catId) {
        catId = "760e315a-07c3-4d48-bc48-92a54827dea1"; // Plastic category ID default
      }

      const masterPgData: any = {
        id: this.id,
        user_id: data.userId || data.user_id,
        category_id: catId,
        weight_kg: Number(data.weight_kg || data.weight || 1.0),
        points_earned: Number(data.pointsEarned || data.points_earned || data.pointsAwarded || data.points_awarded || 0),
        payout_amount: Number(data.payout_amount || data.payoutAmount || 0.00),
        image_url: data.imageUrl || data.image_url || null,
        status: (data.status || "pending").toLowerCase(),
        created_at: data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: masterErr } = await supabaseAdmin.from(table).upsert(masterPgData);
      if (!masterErr) return;
      throw new Error(masterErr.message);
    }

    throw new Error(error.message);
  }

  async update(data: any) {
    const table = getTableName(this.collection);
    if (table === "settings") {
      settingsMemory[this.id] = { ...settingsMemory[this.id], ...data };
      return;
    }

    const pgData = toPostgres(table, data);
    const { error } = await supabaseAdmin
      .from(table)
      .update(pgData)
      .eq("id", this.id);

    if (!error) return;

    // Fallback for waste_submissions master schema update
    if (table === "waste_submissions") {
      const updateData: any = { updated_at: new Date().toISOString() };
      if (data.status) updateData.status = data.status.toLowerCase();
      if (data.pointsEarned !== undefined || data.pointsAwarded !== undefined) {
        updateData.points_earned = Number(data.pointsEarned ?? data.pointsAwarded ?? 0);
      }
      if (data.weight_kg !== undefined || data.weight !== undefined) {
        updateData.weight_kg = Number(data.weight_kg ?? data.weight ?? 0);
      }

      const { error: masterErr } = await supabaseAdmin
        .from(table)
        .update(updateData)
        .eq("id", this.id);

      if (!masterErr) return;
      throw new Error(masterErr.message);
    }

    throw new Error(error.message);
  }

  async delete() {
    const table = getTableName(this.collection);
    const { error } = await supabaseAdmin.from(table).delete().eq("id", this.id);
    if (error) throw new Error(error.message);
  }
}

class Query {
  private wheres: Array<{ field: string; op: string; value: any }> = [];
  private orderField: string | null = null;
  private orderDirection: "asc" | "desc" = "asc";
  private limitCount: number | null = null;

  constructor(public collection: string) {}

  where(field: string, op: string, value: any) {
    this.wheres.push({ field, op, value });
    return this;
  }

  orderBy(field: string, direction: "asc" | "desc" = "asc") {
    this.orderField = field;
    this.orderDirection = direction;
    return this;
  }

  select(...fields: string[]) {
    return this;
  }

  count() {
    return {
      get: async () => {
        const snap = await this.get();
        return {
          data: () => ({
            count: snap.size
          })
        };
      }
    };
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }


  async get() {
    const table = getTableName(this.collection);
    let builder = supabaseAdmin.from(table).select("*");

    for (const w of this.wheres) {
      // Map where filters to Supabase query builder
      const dbCol = toPostgresColumn(w.field);

      let val = w.value;
      if (val instanceof Date || (val && typeof val === "object" && typeof (val as any).toISOString === "function")) {
        val = (val as any).toISOString();
      }

      if (w.op === "==" || w.op === "=") {
        builder = builder.eq(dbCol, val);
      } else if (w.op === ">") {
        builder = builder.gt(dbCol, val);
      } else if (w.op === "<") {
        builder = builder.lt(dbCol, val);
      } else if (w.op === ">=") {
        builder = builder.gte(dbCol, val);
      } else if (w.op === "<=") {
        builder = builder.lte(dbCol, val);
      } else if (w.op === "array-contains") {
        builder = builder.contains(dbCol, [val]);
      }
    }

    if (this.orderField) {
      const dbCol = toPostgresColumn(this.orderField);
      builder = builder.order(dbCol, { ascending: this.orderDirection === "asc" });
    }

    if (this.limitCount !== null) {
      builder = builder.limit(this.limitCount);
    }

    const { data, error } = await builder;
    if (error) {
      throw new Error(error.message);
    }

    const docs = (data || []).map((row: any) => {
      const docId = row.id || row.reward_id || row.redemption_id || "";
      const ref = new DocumentReference(this.collection, String(docId));
      return new DocumentSnapshot(String(docId), fromPostgres(table, row), ref);
    });

    return new QuerySnapshot(docs);
  }
}

class CollectionReference extends Query {
  constructor(collection: string) {
    super(collection);
  }

  doc(id?: string) {
    const docId = id || crypto.randomUUID();
    return new DocumentReference(this.collection, docId);
  }

  async add(data: any) {
    const table = getTableName(this.collection);
    const pgData = toPostgres(table, data);
    const { data: inserted, error } = await supabaseAdmin
      .from(table)
      .insert(pgData)
      .select("*")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message || "Failed to add document");
    }

    const docId = inserted.id || inserted.reward_id || inserted.redemption_id || "";
    return new DocumentReference(this.collection, String(docId));
  }
}

class WriteBatch {
  private operations: Array<() => Promise<void>> = [];

  set(docRef: DocumentReference, data: any, options?: any) {
    this.operations.push(() => docRef.set(data, options));
  }

  update(docRef: DocumentReference, data: any) {
    this.operations.push(() => docRef.update(data));
  }

  delete(docRef: DocumentReference) {
    this.operations.push(() => docRef.delete());
  }

  async commit() {
    for (const op of this.operations) {
      await op();
    }
  }
}

// Exported Firestore Database interface compatible with adminDb
export const adminDb = {
  collection(name: string) {
    return new CollectionReference(name);
  },
  batch() {
    return new WriteBatch();
  },
  async getAll(...docRefs: DocumentReference[]) {
    return Promise.all(docRefs.map(ref => ref.get()));
  },
  async runTransaction(callback: (transaction: any) => Promise<any>) {
    // Transaction wrapper for sequential updates
    const operations: Array<() => Promise<void>> = [];
    const transaction = {
      async get(docRef: DocumentReference) {
        return docRef.get();
      },
      set(docRef: DocumentReference, data: any, options?: any) {
        operations.push(() => docRef.set(data, options));
      },
      update(docRef: DocumentReference, data: any) {
        operations.push(() => docRef.update(data));
      },
      delete(docRef: DocumentReference) {
        operations.push(() => docRef.delete());
      },
    };
    const result = await callback(transaction);
    for (const op of operations) {
      await op();
    }
    return result;
  },
};

// Exported Firebase Admin Auth interface compatible with adminAuth
export const adminAuth = {
  async getUser(uid: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (error || !data) {
      throw new Error("auth/user-not-found");
    }

    return {
      uid: data.id,
      displayName: data.name,
      email: data.email,
      photoURL: data.avatar_url || data.imageUrl,
    };
  },
  async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !data) {
      throw new Error("auth/user-not-found");
    }

    return {
      uid: data.id,
      displayName: data.name,
      email: data.email,
      photoURL: data.avatar_url || data.imageUrl,
    };
  },
  async deleteUser(uid: string) {
    const { error } = await supabaseAdmin.from("users").delete().eq("id", uid);
    if (error) {
      throw new Error(error.message);
    }
  },
};
export { verifySession } from "./auth";
