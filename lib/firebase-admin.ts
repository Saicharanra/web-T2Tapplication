import { supabaseAdmin } from "./supabase-server";

// Helper to convert Firestore collection names to Supabase table names
function getTableName(collection: string): string {
  switch (collection) {
    case "users":
      return "User";
    case "submissions":
      return "Submission";
    case "pointsHistory":
      return "PointsHistory";
    case "rewards":
      return "Reward";
    case "redemptions":
      return "RewardRedemption";
    case "notifications":
      return "Notification";
    case "bins":
      return "Bin";
    default:
      return collection;
  }
}

// Convert Firestore fields to Postgres columns
function toPostgres(table: string, data: any): any {
  if (!data) return data;
  const result: any = {};

  const schemas: Record<string, string[]> = {
    User: ["id", "name", "email", "password", "role", "level", "points", "status", "location", "imageUrl", "joinedAt", "updatedAt"],
    Submission: ["id", "userId", "wasteType", "imageUrl", "imagePath", "imageSize", "imageMimeType", "pointsAwarded", "status", "location", "createdAt", "verifiedAt", "assignedAdminId", "rejectionReason"],
    PointsHistory: ["id", "userId", "submissionId", "points", "createdAt"],
    Notification: ["id", "userId", "email", "type", "title", "message", "read", "createdAt"],
    Bin: ["id", "name", "address", "latitude", "longitude", "locationType", "photoUrl", "addedBy", "createdAt"],
    Reward: ["reward_id", "title", "description", "points_required", "image_url", "status", "category", "stock", "created_at", "updated_at"],
    RewardRedemption: ["redemption_id", "user_id", "reward_id", "code_id", "code", "redeemed_at", "expires_at", "status", "used_at", "updated_at"],
  };

  const allowedColumns = schemas[table] || [];

  for (const [key, value] of Object.entries(data)) {
    let val = value;
    if (value instanceof Date || (value && typeof value === "object" && typeof (value as any).toISOString === "function")) {
      val = (value as any).toISOString();
    } else if (value && typeof value === "object" && "toDate" in value) {
      val = (value as any).toDate().toISOString();
    }

    if (allowedColumns.length === 0 || allowedColumns.includes(key)) {
      result[key] = val;
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
      (key.toLowerCase().endsWith("at") || key.toLowerCase().endsWith("date") || key === "created_at" || key === "updated_at") &&
      typeof value === "string"
    ) {
      val = mockTimestamp(value);
    }

    result[key] = val;
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
    if (error) throw new Error(error.message);
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
    if (error) throw new Error(error.message);
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
      const col = toPostgres(table, { [w.field]: null });
      const dbCol = Object.keys(col)[0] || w.field;

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
      const col = toPostgres(table, { [this.orderField]: null });
      const dbCol = Object.keys(col)[0] || this.orderField;
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
      .from("User")
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
      photoURL: data.imageUrl,
    };
  },
  async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from("User")
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
      photoURL: data.imageUrl,
    };
  },
  async deleteUser(uid: string) {
    const { error } = await supabaseAdmin.from("User").delete().eq("id", uid);
    if (error) {
      throw new Error(error.message);
    }
  },
};
export { verifySession } from "./auth";
