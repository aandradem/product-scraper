import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table for storing scraped e-commerce product data with VTEX fields
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceUrl: text("sourceUrl").notNull(),
  
  // Basic product info
  name: text("name"),
  description: text("description"),
  price: varchar("price", { length: 100 }),
  originalPrice: varchar("originalPrice", { length: 100 }),
  currency: varchar("currency", { length: 10 }),
  
  // VTEX specific fields
  sku: varchar("sku", { length: 100 }),
  category: text("category"),
  brand: varchar("brand", { length: 255 }),
  availability: varchar("availability", { length: 50 }),
  availabilityQuantity: int("availabilityQuantity"),
  
  // Product details
  images: text("images"),
  specifications: text("specifications"),
  nutritionalInfo: text("nutritionalInfo"),
  variants: text("variants"),
  
  // Ratings and reviews
  rating: varchar("rating", { length: 10 }),
  reviewCount: int("reviewCount"),
  reviews: text("reviews"),
  
  // SEO and metadata
  metaTitle: text("metaTitle"),
  metaDescription: text("metaDescription"),
  metaKeywords: text("metaKeywords"),
  
  // Shipping and dimensions
  weight: varchar("weight", { length: 50 }),
  dimensions: text("dimensions"),
  shippingTime: varchar("shippingTime", { length: 100 }),
  
  // Additional fields
  rawHtml: text("rawHtml"),
  extractedData: text("extractedData"),
  status: mysqlEnum("status", ["pending", "success", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
