import { invokeLLM } from "./_core/llm";

export interface ScrapedProductData {
  name?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  currency?: string;
  sku?: string;
  category?: string;
  brand?: string;
  availability?: string;
  availabilityQuantity?: number;
  images?: string[];
  specifications?: Record<string, string | number>;
  nutritionalInfo?: Record<string, string | number>;
  variants?: Array<Record<string, string>>;
  rating?: string;
  reviewCount?: number;
  reviews?: Array<Record<string, string>>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  weight?: string;
  dimensions?: Record<string, string>;
  shippingTime?: string;
}

/**
 * Fetch HTML content from a URL with error handling
 */
export async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("text/html")) {
      throw new Error("Response is not HTML content");
    }

    const html = await response.text();
    if (!html || html.length === 0) {
      throw new Error("Empty HTML response");
    }

    return html;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    throw error;
  }
}

/**
 * Use LLM to intelligently extract product data from HTML
 * Optimized for VTEX and other Brazilian e-commerce platforms
 */
export async function extractProductDataWithLLM(
  html: string,
  sourceUrl: string
): Promise<ScrapedProductData> {
  try {
    const truncatedHtml = html.substring(0, 80000);

    const systemPrompt = `You are an expert at extracting product information from e-commerce HTML pages, especially VTEX and Brazilian e-commerce platforms.

ANALYZE THE HTML VERY CAREFULLY AND EXTRACT ALL AVAILABLE PRODUCT INFORMATION COMPREHENSIVELY.

Return ONLY a valid JSON object with this structure (omit fields not found):
{
  "name": "Complete product name/title",
  "description": "Full product description with all details",
  "price": "Current price with currency symbol (e.g., R$ 26,90)",
  "originalPrice": "Original price before discount if available",
  "currency": "Currency code or symbol (BRL, R$, etc.)",
  "sku": "Product SKU/code",
  "category": "Full category path",
  "brand": "Product brand/manufacturer",
  "availability": "Stock status (Em Estoque, Fora de Estoque, etc.)",
  "availabilityQuantity": "Quantity as number",
  "images": ["image_url_1", "image_url_2"],
  "specifications": {"spec_name": "spec_value"},
  "nutritionalInfo": {"nutrient": "value"},
  "variants": [{"option": "value"}],
  "rating": "Rating number (e.g., 4.5)",
  "reviewCount": "Number of reviews",
  "reviews": [{"author": "name", "rating": "5", "text": "review"}],
  "metaTitle": "Page title",
  "metaDescription": "Page description",
  "metaKeywords": "Page keywords",
  "weight": "Weight with unit (e.g., 450g, 1kg)",
  "dimensions": {"height": "value", "width": "value", "length": "value"},
  "shippingTime": "Shipping time (e.g., 2-5 dias uteis)"
}

CRITICAL EXTRACTION RULES:
1. EXTRACT EVERY VISIBLE PIECE OF INFORMATION
2. For name: Get the complete product title/name
3. For description: Extract FULL description, not just summary
4. For price: Include currency symbol exactly as shown (R$ 26,90 not 26.90)
5. For specifications: Look in tables, lists, accordion sections, data attributes
6. For nutritional info: Extract from nutrition labels/tables completely
7. For images: Get ALL product images with absolute URLs
8. For weight/dimensions: Include units exactly (450,0000 GRM, 10cm, etc.)
9. For variants: Extract all color, size, flavor options
10. For ratings: Look for star ratings and review counts
11. Search for VTEX data-* attributes and JSON-LD structured data
12. Extract from meta tags, H1, product details sections
13. Return ONLY valid JSON - no markdown, no extra text
14. If field not found, omit it from response
15. Be thorough and extract EVERYTHING available on the page`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Extract ALL product information from this HTML page. Be comprehensive and extract every detail available:\n\n${truncatedHtml}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction_vtex",
          strict: false,
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              price: { type: "string" },
              originalPrice: { type: "string" },
              currency: { type: "string" },
              sku: { type: "string" },
              category: { type: "string" },
              brand: { type: "string" },
              availability: { type: "string" },
              availabilityQuantity: { type: "number" },
              images: { type: "array", items: { type: "string" } },
              specifications: { type: "object" },
              nutritionalInfo: { type: "object" },
              variants: { type: "array" },
              rating: { type: "string" },
              reviewCount: { type: "number" },
              reviews: { type: "array" },
              metaTitle: { type: "string" },
              metaDescription: { type: "string" },
              metaKeywords: { type: "string" },
              weight: { type: "string" },
              dimensions: { type: "object" },
              shippingTime: { type: "string" },
            },
            required: [],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    const extractedData = JSON.parse(contentStr) as ScrapedProductData;
    return extractedData;
  } catch (error) {
    console.error("Error extracting product data with LLM:", error);
    throw new Error(
      `Failed to extract product data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Main function to scrape product from URL
 */
export async function scrapeProductFromUrl(url: string): Promise<{
  data: ScrapedProductData;
  html: string;
}> {
  const html = await fetchHtmlContent(url);
  const data = await extractProductDataWithLLM(html, url);
  return { data, html };
}
