import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, Product, InsertProduct, products, extractionHistory, ExtractionHistory, InsertExtractionHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createProduct(product: InsertProduct) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.insert(products).values(product);
  return result;
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserProducts(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
  return result;
}

export async function updateProduct(id: number, updates: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.update(products).set(updates).where(eq(products.id, id));
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  await db.delete(products).where(eq(products.id, id));
}

export async function searchProducts(userId: number, query: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const result = await db
    .select()
    .from(products)
    .where(
      sql`${products.userId} = ${userId} AND (
        ${products.name} LIKE ${`%${query}%`} OR
        ${products.sku} LIKE ${`%${query}%`} OR
        ${products.brand} LIKE ${`%${query}%`} OR
        ${products.category} LIKE ${`%${query}%`}
      )`
    )
    .orderBy(desc(products.createdAt));
  return result;
}

export async function createExtractionHistory(data: InsertExtractionHistory): Promise<ExtractionHistory | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create extraction history: database not available");
    return null;
  }

  try {
    const result = await db.insert(extractionHistory).values(data);
    const id = result[0].insertId;
    const history = await db.select().from(extractionHistory).where(eq(extractionHistory.id, Number(id))).limit(1);
    return history.length > 0 ? history[0] : null;
  } catch (error) {
    console.error("[Database] Failed to create extraction history:", error);
    return null;
  }
}

export async function getExtractionHistory(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get extraction history: database not available");
    return [];
  }

  try {
    return await db
      .select()
      .from(extractionHistory)
      .where(eq(extractionHistory.userId, userId))
      .orderBy(desc(extractionHistory.createdAt))
      .limit(limit)
      .offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get extraction history:", error);
    return [];
  }
}

export async function getExtractionHistoryCount(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get extraction history count: database not available");
    return 0;
  }

  try {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(extractionHistory)
      .where(eq(extractionHistory.userId, userId));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get extraction history count:", error);
    return 0;
  }
}

// TODO: add feature queries here as your schema grows.
