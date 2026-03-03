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
  structuredData?: Record<string, unknown>;
  cssSelectors?: Record<string, string>;
}

/**
 * Fetch HTML content from a URL with error handling
 */
export async function fetchHtmlContent(url: string): Promise<string> {
  try {
    const urlObj = new URL(url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
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
 * Extract structured data from HTML (JSON-LD, microdata, Open Graph)
 */
function extractStructuredData(html: string): Record<string, unknown> {
  const structuredData: Record<string, unknown> = {};
  
  try {
    // Extract JSON-LD
    const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    const jsonLdArray = [];
    
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1]);
        jsonLdArray.push(data);
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    if (jsonLdArray.length > 0) {
      structuredData.jsonLd = jsonLdArray;
    }
    
    // Extract Open Graph tags
    const ogRegex = /<meta\s+property="og:([^"]+)"\s+content="([^"]*)"/gi;
    const ogData: Record<string, string> = {};
    
    while ((match = ogRegex.exec(html)) !== null) {
      ogData[match[1]] = match[2];
    }
    
    if (Object.keys(ogData).length > 0) {
      structuredData.openGraph = ogData;
    }
  } catch (e) {
    // Continue if structured data extraction fails
  }
  
  return structuredData;
}

/**
 * Extract tables from HTML
 */
function extractTables(html: string): Array<Record<string, string>> {
  const tables: Array<Record<string, string>> = [];
  
  try {
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let match;
    
    while ((match = tableRegex.exec(html)) !== null) {
      const tableHtml = match[1];
      const rows: Array<Record<string, string>> = [];
      
      // Extract rows
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;
      
      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        const cells: string[] = [];
        let cellMatch;
        
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          const cellText = cellMatch[1]
            .replace(/<[^>]*>/g, "")
            .trim();
          if (cellText) {
            cells.push(cellText);
          }
        }
        
        if (cells.length > 0) {
          const rowObj: Record<string, string> = {};
          cells.forEach((cell, idx) => {
            rowObj[`col_${idx}`] = cell;
          });
          rows.push(rowObj);
        }
      }
      
      if (rows.length > 0) {
        tables.push(...rows);
      }
    }
  } catch (e) {
    // Continue if table extraction fails
  }
  
  return tables;
}

/**
 * Extract all visible text from HTML
 */
function extractAllText(html: string): string {
  try {
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    return text.substring(0, 5000); // Limit to 5000 chars
  } catch (e) {
    return "";
  }
}

/**
 * Use LLM to intelligently extract product data from HTML
 * Optimized for webscraper.io patterns and multiple e-commerce platforms
 */
export async function extractProductDataWithLLM(
  html: string,
  sourceUrl: string
): Promise<ScrapedProductData> {
  try {
    // Extract structured data first
    const structuredData = extractStructuredData(html);
    const tables = extractTables(html);
    const allText = extractAllText(html);
    
    // Limit HTML size for LLM
    const truncatedHtml = html.substring(0, 120000);

    const systemPrompt = `You are an expert product data extraction system using webscraper.io patterns.

EXTRACTION STRATEGY:
1. Look for product name in: h1, h2, meta[property="og:title"], title tag, .product-name, [data-product-name]
2. Look for price in: .price, [data-price], .product-price, span with currency symbols
3. Look for images in: img[src], picture source, [data-src], [data-image], og:image
4. Look for SKU in: [data-sku], .sku, .product-id, data attributes
5. Look for specifications in: tables, dl/dt/dd, ul/li with labels, data attributes
6. Look for availability in: .availability, [data-availability], stock status text
7. Look for category in: breadcrumb, [data-category], meta tags
8. Look for brand in: .brand, [data-brand], meta tags
9. Look for ratings in: .rating, [data-rating], star elements, review count
10. Look for weight/dimensions in: specifications, tables, product details

RETURN ONLY VALID JSON with extracted data:
{
  "name": "Product name",
  "description": "Full description",
  "price": "Price with currency",
  "originalPrice": "Original price if on sale",
  "currency": "Currency code",
  "sku": "SKU/Product ID",
  "category": "Category path",
  "brand": "Brand name",
  "availability": "In stock/Out of stock",
  "availabilityQuantity": 0,
  "images": ["image_urls"],
  "specifications": {"key": "value"},
  "nutritionalInfo": {"nutrient": "value"},
  "variants": [{"option": "value"}],
  "rating": "4.5",
  "reviewCount": 0,
  "reviews": [{"author": "name", "rating": "5", "text": "review text"}],
  "metaTitle": "Page title",
  "metaDescription": "Page description",
  "metaKeywords": "keywords",
  "weight": "Weight with unit",
  "dimensions": {"height": "value", "width": "value"},
  "shippingTime": "Shipping time",
  "tables": [{"header": "value"}],
  "attributes": {"attr": "value"},
  "allText": "All visible text"
}

CRITICAL RULES:
- Extract EVERYTHING available on the page
- Keep original format for prices (with currency symbols)
- Include units for weight/dimensions
- Extract ALL images with absolute URLs
- Look in data attributes, meta tags, JSON-LD, microdata
- Return ONLY valid JSON - no markdown, no extra text
- Omit fields if not found (don't use null)
- Be comprehensive and thorough`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Extract all product information from this e-commerce page. Use webscraper.io patterns to find data in tables, lists, data attributes, and meta tags. Be thorough and extract EVERYTHING:\n\nURL: ${sourceUrl}\n\nHTML:\n${truncatedHtml}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_extraction_webscraper",
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
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const extractedData = JSON.parse(content) as ScrapedProductData;
    
    // Merge with pre-extracted structured data and tables
    return {
      ...extractedData,
      structuredData: structuredData,
      tables: tables.length > 0 ? tables : extractedData.tables,
      allText: allText || extractedData.allText,
    };
  } catch (error) {
    console.error("[Scraper] Error extracting product data:", error);
    throw new Error(
      `Failed to extract product data: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
