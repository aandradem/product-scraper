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
  tables?: Array<Record<string, string>>;
  attributes?: Record<string, string>;
  allText?: string;
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
 * Optimized for VTEX, webscraper.io, and other e-commerce platforms
 */
export async function extractProductDataWithLLM(
  html: string,
  sourceUrl: string
): Promise<ScrapedProductData> {
  try {
    const truncatedHtml = html.substring(0, 100000);

    const systemPrompt = `You are an expert at extracting product information from e-commerce HTML pages.
    
EXTRACT ABSOLUTELY EVERYTHING from the page:
- All text content (tables, lists, paragraphs)
- All product attributes and specifications
- All images and media
- All prices and availability info
- All reviews and ratings
- All structured data (JSON-LD, microdata)
- All metadata
- All dimensions, weight, shipping info

Return ONLY a valid JSON object with this structure:
{
  "name": "Complete product name",
  "description": "Full detailed description with all text",
  "price": "Current price with currency",
  "originalPrice": "Original price if available",
  "currency": "Currency code",
  "sku": "Product SKU",
  "category": "Full category path",
  "brand": "Brand name",
  "availability": "Stock status",
  "availabilityQuantity": 0,
  "images": ["url1", "url2"],
  "specifications": {"key": "value"},
  "nutritionalInfo": {"nutrient": "value"},
  "variants": [{"option": "value"}],
  "rating": "4.5",
  "reviewCount": 0,
  "reviews": [{"author": "name", "rating": "5", "text": "review"}],
  "metaTitle": "Page title",
  "metaDescription": "Page description",
  "metaKeywords": "keywords",
  "weight": "Weight with unit",
  "dimensions": {"height": "value", "width": "value"},
  "shippingTime": "Shipping time",
  "tables": [{"header": "value"}],
  "attributes": {"attr": "value"},
  "allText": "All visible text from page"
}

CRITICAL RULES:
1. EXTRACT EVERYTHING - no field is too small or unimportant
2. Look in ALL sections: headers, tables, lists, accordion, modals, data attributes
3. For images: extract ALL product images with absolute URLs
4. For specifications: extract from tables, lists, dl/dt/dd, data-* attributes
5. For nutritional info: extract complete nutrition facts tables
6. For text: include ALL visible text content in "allText" field
7. For tables: extract all table data into "tables" array
8. For attributes: extract all HTML attributes and data-* values
9. For price: keep original format with currency symbol
10. For dimensions: include units exactly as shown
11. Search JSON-LD, microdata, VTEX data, structured data
12. Extract from meta tags, og:*, twitter:*, schema.org
13. Return ONLY valid JSON - no markdown, no extra text, no comments
14. If field not found, omit it (don't use null)
15. Be THOROUGH - extract EVERY piece of information available`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Extract ABSOLUTELY ALL product information from this HTML page. Extract every detail, every table, every attribute, every piece of text. Be comprehensive:\n\n${truncatedHtml}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction_complete",
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
              tables: { type: "array" },
              attributes: { type: "object" },
              allText: { type: "string" },
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
}> {
  const html = await fetchHtmlContent(url);
  const data = await extractProductDataWithLLM(html, url);
  return { data };
}
