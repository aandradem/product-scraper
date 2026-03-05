import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { qualityRouter } from "./quality-router";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  quality: qualityRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  products: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const { getUserProducts } = await import("./db");
      return getUserProducts(ctx.user.id);
    }),
    
    getById: publicProcedure.input((val: unknown) => {
      if (typeof val === "number" && val > 0 && Number.isInteger(val)) {
        return val;
      }
      throw new Error("Invalid product ID");
    }).query(async ({ input }) => {
      const { getProductById } = await import("./db");
      const product = await getProductById(input);
      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    }),
    
    scrape: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "url" in val && typeof (val as any).url === "string") {
        return { url: (val as any).url };
      }
      throw new Error("Invalid URL input");
    }).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      
      const { fetchHtmlContent, extractProductDataWithLLM } = await import("./scraper");
      const { createProduct, getProductById } = await import("./db");
      
      const sanitizeString = (str: string | undefined, maxLength: number = 500): string | null => {
        if (!str) return null;
        return String(str).substring(0, maxLength);
      };
      
      try {
        const html = await fetchHtmlContent(input.url);
        const data = await extractProductDataWithLLM(html, input.url);
        
        const result = await createProduct({
          userId: ctx.user.id,
          sourceUrl: input.url,
          name: sanitizeString(data.name),
          description: sanitizeString(data.description),
          price: sanitizeString(data.price),
          originalPrice: sanitizeString(data.originalPrice),
          currency: sanitizeString(data.currency),
          sku: sanitizeString(data.sku),
          category: sanitizeString(data.category),
          brand: sanitizeString(data.brand),
          availability: sanitizeString(data.availability),
          availabilityQuantity: data.availabilityQuantity || null,
          images: data.images && data.images.length > 0 ? JSON.stringify(data.images.slice(0, 20)) : null,
          specifications: data.specifications ? JSON.stringify(data.specifications) : null,
          nutritionalInfo: data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null,
          variants: data.variants ? JSON.stringify(data.variants) : null,
          rating: sanitizeString(data.rating),
          reviewCount: data.reviewCount || null,
          reviews: data.reviews ? JSON.stringify(data.reviews.slice(0, 10)) : null,
          metaTitle: sanitizeString(data.metaTitle),
          metaDescription: sanitizeString(data.metaDescription),
          metaKeywords: sanitizeString(data.metaKeywords),
          weight: sanitizeString(data.weight, 100),
          dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
          shippingTime: sanitizeString(data.shippingTime),
          rawHtml: null,
          extractedData: JSON.stringify(data).substring(0, 65000),
          status: "success",
        });
        
        const createdProduct = await getProductById((result as any).insertId);
        return { success: true, product: createdProduct };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Scraping error:", error);
        
        try {
          const { createProduct: createErrorProduct } = await import("./db");
          await createErrorProduct({
            userId: ctx.user.id,
            sourceUrl: input.url,
            status: "error",
            errorMessage: sanitizeString(errorMessage),
          });
        } catch (dbError) {
          console.error("Failed to save error product:", dbError);
        }
        
        throw new Error(`Scraping failed: ${errorMessage}`);
      }
    }),
    
    update: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "id" in val) {
        return val as any;
      }
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      
      const { updateProduct, getProductById } = await import("./db");
      const product = await getProductById(input.id);
      
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found or unauthorized");
      }
      
      const updates: any = { ...input };
      delete updates.id;
      
      if (updates.images && typeof updates.images === "object") {
        updates.images = JSON.stringify(updates.images);
      }
      if (updates.specifications && typeof updates.specifications === "object") {
        updates.specifications = JSON.stringify(updates.specifications);
      }
      if (updates.nutritionalInfo && typeof updates.nutritionalInfo === "object") {
        updates.nutritionalInfo = JSON.stringify(updates.nutritionalInfo);
      }
      
      return updateProduct(input.id, updates);
    }),
    
    delete: publicProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input");
    }).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      
      const { deleteProduct, getProductById } = await import("./db");
      const product = await getProductById(input);
      
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found or unauthorized");
      }
      
      await deleteProduct(input);
      return { success: true };
    }),
    
    search: publicProcedure.input((val: unknown) => {
      if (typeof val === "object" && val !== null && "query" in val) {
        return { query: String((val as any).query || "") };
      }
      throw new Error("Invalid search input");
    }).query(async ({ input, ctx }) => {
      if (!ctx.user) return [];
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return [];
      
      const { products } = await import("../drizzle/schema");
      const { like, and, eq } = await import("drizzle-orm");
      
      const query = `%${input.query}%`;
      const results = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.userId, ctx.user.id),
            like(products.name, query)
          )
        )
        .limit(20);
      
      return results;
    }),
    
    duplicate: publicProcedure.input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid product ID");
    }).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      
      const { getProductById, createProduct } = await import("./db");
      const original = await getProductById(input);
      
      if (!original || original.userId !== ctx.user.id) {
        throw new Error("Product not found or unauthorized");
      }
      
      const duplicated = await createProduct({
        userId: ctx.user.id,
        sourceUrl: original.sourceUrl,
        name: original.name ? `${original.name} (Cópia)` : null,
        description: original.description,
        price: original.price,
        originalPrice: original.originalPrice,
        currency: original.currency,
        sku: original.sku,
        category: original.category,
        brand: original.brand,
        availability: original.availability,
        availabilityQuantity: original.availabilityQuantity,
        images: original.images,
        specifications: original.specifications,
        nutritionalInfo: original.nutritionalInfo,
        variants: original.variants,
        rating: original.rating,
        reviewCount: original.reviewCount,
        reviews: original.reviews,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        metaKeywords: original.metaKeywords,
        weight: original.weight,
        dimensions: original.dimensions,
        shippingTime: original.shippingTime,
        status: "success",
      });
      
      return { success: true, product: duplicated };
    }),
    
    batchScrape: publicProcedure.input((val: unknown) => {
      if (Array.isArray(val)) {
        return val.filter(url => typeof url === "string").slice(0, 50);
      }
      throw new Error("Invalid URLs input");
    }).mutation(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      
      const { fetchHtmlContent, extractProductDataWithLLM } = await import("./scraper");
      const { createProduct } = await import("./db");
      
      const results = {
        success: [] as any[],
        failed: [] as { url: string; error: string }[],
      };
      
      const sanitizeString = (str: string | undefined, maxLength: number = 500): string | null => {
        if (!str) return null;
        return String(str).substring(0, maxLength);
      };
      
      const maxConcurrent = 5;
      for (let i = 0; i < input.length; i += maxConcurrent) {
        const batch = input.slice(i, i + maxConcurrent);
        
        await Promise.all(
          batch.map(async (url) => {
            try {
              const html = await fetchHtmlContent(url);
              const data = await extractProductDataWithLLM(html, url);
              
              const result = await createProduct({
                userId: ctx.user!.id,
                sourceUrl: url,
                name: sanitizeString(data.name),
                description: sanitizeString(data.description),
                price: sanitizeString(data.price),
                originalPrice: sanitizeString(data.originalPrice),
                currency: sanitizeString(data.currency),
                sku: sanitizeString(data.sku),
                category: sanitizeString(data.category),
                brand: sanitizeString(data.brand),
                availability: sanitizeString(data.availability),
                availabilityQuantity: data.availabilityQuantity || null,
                images: data.images && data.images.length > 0 ? JSON.stringify(data.images.slice(0, 20)) : null,
                specifications: data.specifications ? JSON.stringify(data.specifications) : null,
                nutritionalInfo: data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null,
                variants: data.variants ? JSON.stringify(data.variants) : null,
                rating: sanitizeString(data.rating),
                reviewCount: data.reviewCount || null,
                reviews: data.reviews ? JSON.stringify(data.reviews.slice(0, 10)) : null,
                metaTitle: sanitizeString(data.metaTitle),
                metaDescription: sanitizeString(data.metaDescription),
                metaKeywords: sanitizeString(data.metaKeywords),
                weight: sanitizeString(data.weight, 100),
                dimensions: data.dimensions ? JSON.stringify(data.dimensions) : null,
                shippingTime: sanitizeString(data.shippingTime),
                rawHtml: null,
                extractedData: JSON.stringify(data).substring(0, 65000),
                status: "success",
              });
              
              results.success.push({ url, id: (result as any).insertId });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              results.failed.push({ url, error: errorMessage });
            }
          })
        );
      }
      
      return results;
    }),
    

    
    getQualityReport: publicProcedure.input((val: unknown) => {
      if (typeof val === "number" && val > 0 && Number.isInteger(val)) {
        return val;
      }
      throw new Error("Invalid product ID");
    }).query(async ({ input, ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const { getProductById } = await import("./db");
      const { generateQualityReport } = await import("./validation");
      
      const product = await getProductById(input);
      if (!product || product.userId !== ctx.user.id) {
        throw new Error("Product not found or unauthorized");
      }
      
      const extractedData = product.extractedData ? JSON.parse(product.extractedData) : {};
      const report = generateQualityReport(extractedData);
      return report;
    }),
    
    history: router({
      list: publicProcedure.input((val: unknown) => {
        const obj = val as any;
        const limit = typeof obj?.limit === "number" ? Math.min(obj.limit, 100) : 50;
        const offset = typeof obj?.offset === "number" ? Math.max(obj.offset, 0) : 0;
        return { limit, offset };
      }).query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const { getExtractionHistory, getExtractionHistoryCount } = await import("./db");
        const [items, total] = await Promise.all([
          getExtractionHistory(ctx.user.id, input.limit, input.offset),
          getExtractionHistoryCount(ctx.user.id),
        ]);
        return { items, total, limit: input.limit, offset: input.offset };
      }),
    }),
  }),
});


export type AppRouter = typeof appRouter;
