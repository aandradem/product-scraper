import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Products table with complete VTEX standard fields
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourceUrl: text("sourceUrl").notNull(),
  
  // === PRODUTO (Obrigatório) ===
  productName: text("productName"),
  productDescription: text("productDescription"),
  productReferenceCode: varchar("productReferenceCode", { length: 255 }),
  productKeywords: text("productKeywords"),
  productMetaTitle: text("productMetaTitle"),
  productMetaDescription: text("productMetaDescription"),
  productShowOnWebsite: boolean("productShowOnWebsite").default(true),
  productShowWithoutStock: boolean("productShowWithoutStock").default(false),
  productLaunchDate: timestamp("productLaunchDate"),
  productActive: boolean("productActive").default(true),
  
  // === DEPARTAMENTO E CATEGORIA ===
  departmentId: varchar("departmentId", { length: 100 }),
  departmentName: varchar("departmentName", { length: 255 }),
  categoryId: varchar("categoryId", { length: 100 }),
  categoryName: varchar("categoryName", { length: 255 }),
  
  // === MARCA ===
  brandId: varchar("brandId", { length: 100 }),
  brandName: varchar("brandName", { length: 255 }),
  
  // === SKU (Código do Produto) ===
  skuId: varchar("skuId", { length: 100 }),
  skuCode: varchar("skuCode", { length: 100 }),
  skuEan: varchar("skuEan", { length: 100 }),
  skuReferenceCode: varchar("skuReferenceCode", { length: 255 }),
  skuManufacturerCode: varchar("skuManufacturerCode", { length: 255 }),
  skuActive: boolean("skuActive").default(true),
  skuActivateIfPossible: boolean("skuActivateIfPossible").default(true),
  
  // === DIMENSÕES (Medidas) ===
  height: varchar("height", { length: 50 }),
  heightReal: varchar("heightReal", { length: 50 }),
  width: varchar("width", { length: 50 }),
  widthReal: varchar("widthReal", { length: 50 }),
  length: varchar("length", { length: 50 }),
  lengthReal: varchar("lengthReal", { length: 50 }),
  weight: varchar("weight", { length: 50 }),
  weightReal: varchar("weightReal", { length: 50 }),
  unitOfMeasure: varchar("unitOfMeasure", { length: 50 }),
  unitMultiplier: varchar("unitMultiplier", { length: 50 }),
  cubicWeight: varchar("cubicWeight", { length: 50 }),
  
  // === PREÇO E DISPONIBILIDADE ===
  price: varchar("price", { length: 100 }),
  originalPrice: varchar("originalPrice", { length: 100 }),
  currency: varchar("currency", { length: 10 }),
  loyaltyValue: varchar("loyaltyValue", { length: 100 }),
  availability: varchar("availability", { length: 50 }),
  availabilityQuantity: int("availabilityQuantity"),
  estimatedArrivalDate: timestamp("estimatedArrivalDate"),
  
  // === COMERCIAL ===
  commercialCondition: varchar("commercialCondition", { length: 255 }),
  stores: text("stores"),
  
  // === RELACIONAMENTOS ===
  accessories: text("accessories"),
  similar: text("similar"),
  suggestions: text("suggestions"),
  showTogether: text("showTogether"),
  attachments: text("attachments"),
  
  // === MÍDIA ===
  images: text("images"),
  
  // === ESPECIFICAÇÕES E CAMPOS CUSTOMIZADOS ===
  specifications: text("specifications"),
  customFields: text("customFields"),
  nutritionalInfo: text("nutritionalInfo"),
  variants: text("variants"),
  
  // === AVALIAÇÕES ===
  rating: varchar("rating", { length: 10 }),
  reviewCount: int("reviewCount"),
  reviews: text("reviews"),
  
  // === METADADOS ===
  rawHtml: text("rawHtml"),
  extractedData: text("extractedData"),
  status: mysqlEnum("status", ["pending", "success", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Specifications table for storing custom VTEX specifications
 */
export const specifications = mysqlTable("specifications", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  specificationId: varchar("specificationId", { length: 100 }),
  specificationName: varchar("specificationName", { length: 255 }).notNull(),
  specificationValue: text("specificationValue"),
  specificationFieldType: varchar("specificationFieldType", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Specification = typeof specifications.$inferSelect;
export type InsertSpecification = typeof specifications.$inferInsert;
