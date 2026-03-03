import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
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
      
      const { scrapeProductFromUrl } = await import("./scraper");
      const { createProduct, getProductById } = await import("./db");
      
      const sanitizeString = (str: string | undefined): string | null => {
        if (!str) return null;
        return String(str).substring(0, 5000);
      };
      
      try {
        const { data } = await scrapeProductFromUrl(input.url);
        
        const result = await createProduct({
          userId: ctx.user.id,
          sourceUrl: input.url,
          name: sanitizeString(data.name),
          description: sanitizeString(data.description),
          price: sanitizeString(data.price),
          currency: sanitizeString(data.currency),
          images: data.images && data.images.length > 0 ? JSON.stringify(data.images.slice(0, 20)) : null,
          specifications: data.specifications ? JSON.stringify(data.specifications) : null,
          nutritionalInfo: data.nutritionalInfo ? JSON.stringify(data.nutritionalInfo) : null,
          metaTitle: sanitizeString(data.metaTitle),
          metaDescription: sanitizeString(data.metaDescription),
          metaKeywords: sanitizeString(data.metaKeywords),
          rawHtml: null,
          extractedData: JSON.stringify(data),
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
  }),
});


export type AppRouter = typeof appRouter;
