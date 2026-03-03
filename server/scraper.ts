import { invokeLLM } from "./_core/llm";

export interface ScrapedProductData {
  name?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  currency?: string;
  sku?: string;
  ean?: string;
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
  height?: string;
  width?: string;
  length?: string;
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
    const truncatedHtml = html.substring(0, 50000);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting product information from e-commerce HTML pages, especially VTEX and Brazilian e-commerce platforms.

Analyze the provided HTML and extract ALL available product information comprehensively.

Return a JSON object with the following structure:
{
  "name": "Product name",
  "description": "Product description or summary",
  "price": "Current price (just the number or with currency symbol)",
  "originalPrice": "Original price before discount (if available)",
  "currency": "Currency code (BRL, USD, EUR, etc.) or empty string",
  "sku": "Product SKU or code",
  "category": "Product category path (e.g., Electronics > Smartphones)",
  "brand": "Product brand/manufacturer",
  "availability": "Availability status (in stock, out of stock, pre-order, etc.)",
  "availabilityQuantity": "Quantity available as number",
  "images": ["URL1", "URL2", ...],
  "specifications": {"spec_name": "spec_value", ...},
  "nutritionalInfo": {"nutrient_name": "nutrient_value", ...},
  "variants": [{"variant_name": "variant_value", ...}],
  "rating": "Average rating (e.g., 4.5)",
  "reviewCount": "Number of reviews as number",
  "reviews": [{"author": "name", "rating": "5", "text": "review text"}],
  "metaTitle": "Page title from meta tags",
  "metaDescription": "Page description from meta tags",
  "metaKeywords": "Page keywords from meta tags",
  "weight": "Product weight (e.g., 500g, 1kg)",
  "dimensions": {"height": "10cm", "width": "5cm", "depth": "3cm"},
  "shippingTime": "Estimated shipping time (e.g., 2-5 business days)"
}

Rules:
- Extract ALL specifications and nutritional information found
- For images, extract full URLs (absolute URLs, not relative)
- Look for VTEX-specific patterns and common Brazilian e-commerce structures
- Extract price with and without discount if available
- Extract all product variants/options
- Extract ratings and reviews if available
- If a field is not found, omit it or use null
- Be precise and extract exact values from the HTML
- Handle different HTML structures intelligently`,
        },
        {
          role: "user",
          content: `Extract comprehensive product information from this HTML: ${truncatedHtml}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction_vtex",
          strict: true,
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
              specifications: { type: "object", additionalProperties: { type: "string" } },
              nutritionalInfo: { type: "object", additionalProperties: { type: "string" } },
              variants: { type: "array", items: { type: "object" } },
              rating: { type: "string" },
              reviewCount: { type: "number" },
              reviews: { type: "array", items: { type: "object" } },
              metaTitle: { type: "string" },
              metaDescription: { type: "string" },
              metaKeywords: { type: "string" },
              weight: { type: "string" },
              dimensions: { type: "object", additionalProperties: { type: "string" } },
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
