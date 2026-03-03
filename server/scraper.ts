import { invokeLLM } from "./_core/llm";

export interface ScrapedProductData {
  name?: string;
  description?: string;
  price?: string;
  currency?: string;
  images?: string[];
  specifications?: Record<string, string | number>;
  nutritionalInfo?: Record<string, string | number>;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

/**
 * Fetch HTML content from a URL with error handling
 */
export async function fetchHtmlContent(url: string): Promise<string> {
  try {
    // Validate URL format
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
 * The LLM analyzes the structure and extracts relevant fields
 * even when the HTML structure varies between different e-commerce sites
 */
export async function extractProductDataWithLLM(
  html: string,
  sourceUrl: string
): Promise<ScrapedProductData> {
  try {
    // Truncate HTML if too large (keep first 50KB for LLM)
    const truncatedHtml = html.substring(0, 50000);

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting product information from e-commerce HTML pages.

Analyze the provided HTML and extract product information. Be thorough and extract ALL available data.

Return a JSON object with the following structure:
{
  "name": "Product name",
  "description": "Product description or summary",
  "price": "Price value (just the number or with currency symbol)",
  "currency": "Currency code (USD, BRL, EUR, etc.) or empty string if not found",
  "images": ["URL1", "URL2", ...],
  "specifications": {"spec_name": "spec_value", ...},
  "nutritionalInfo": {"nutrient_name": "nutrient_value", ...},
  "metaTitle": "Page title from meta tags",
  "metaDescription": "Page description from meta tags",
  "metaKeywords": "Page keywords from meta tags"
}

Rules:
- Extract ALL specifications and nutritional information found
- For images, extract full URLs (absolute URLs, not relative)
- If a field is not found, omit it or use null
- Be precise and extract exact values from the HTML
- Look for common e-commerce patterns like product-info, product-details, specs, nutrition-table, etc.
- Handle different HTML structures and class names intelligently`,
        },
        {
          role: "user",
          content: `Extract product information from this HTML: ${truncatedHtml}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Product name" },
              description: { type: "string", description: "Product description" },
              price: { type: "string", description: "Price value" },
              currency: { type: "string", description: "Currency code" },
              images: {
                type: "array",
                items: { type: "string" },
                description: "Product image URLs",
              },
              specifications: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Product specifications",
              },
              nutritionalInfo: {
                type: "object",
                additionalProperties: { type: "string" },
                description: "Nutritional information",
              },
              metaTitle: { type: "string", description: "Meta title" },
              metaDescription: { type: "string", description: "Meta description" },
              metaKeywords: { type: "string", description: "Meta keywords" },
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
 * Main scraping function that combines fetching and LLM extraction
 */
export async function scrapeProductFromUrl(
  url: string
): Promise<{ data: ScrapedProductData; html: string }> {
  try {
    // Fetch HTML
    const html = await fetchHtmlContent(url);

    // Extract data using LLM
    const data = await extractProductDataWithLLM(html, url);

    return { data, html };
  } catch (error) {
    throw error;
  }
}
