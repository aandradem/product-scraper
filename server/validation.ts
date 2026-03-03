import { ScrapedProductData } from "./scraper";

export interface FieldQualityScore {
  field: string;
  score: number; // 0-100
  confidence: "low" | "medium" | "high";
  issues: string[];
  suggestions: string[];
}

export interface DataQualityReport {
  overallScore: number; // 0-100
  fieldScores: Record<string, FieldQualityScore>;
  criticalIssues: string[];
  warnings: string[];
  summary: string;
  timestamp: Date;
}

/**
 * Validate and score individual fields
 */
function validateField(
  fieldName: string,
  value: unknown
): FieldQualityScore {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Check if field exists and is not empty
  if (value === null || value === undefined || value === "") {
    score = 0;
    issues.push("Field is empty or missing");
    suggestions.push(`Manually add ${fieldName} information`);
    return {
      field: fieldName,
      score,
      confidence: "low",
      issues,
      suggestions,
    };
  }

  // Field-specific validation
  switch (fieldName) {
    case "name":
      if (typeof value !== "string") {
        score -= 30;
        issues.push("Name is not a string");
      } else if (value.length < 3) {
        score -= 40;
        issues.push("Name is too short (< 3 characters)");
        suggestions.push("Provide a more descriptive product name");
      } else if (value.length > 500) {
        score -= 20;
        issues.push("Name is too long (> 500 characters)");
      }
      break;

    case "description":
      if (typeof value !== "string") {
        score -= 20;
        issues.push("Description is not a string");
      } else if (value.length < 10) {
        score -= 40;
        issues.push("Description is too short (< 10 characters)");
        suggestions.push("Add more detailed product description");
      } else if (value.length > 10000) {
        score -= 15;
        issues.push("Description is very long (> 10000 characters)");
      }
      break;

    case "price":
      if (typeof value !== "string") {
        score -= 30;
        issues.push("Price is not a string");
      } else {
        // Check for valid price format
        const priceRegex = /[\d.,]+/;
        if (!priceRegex.test(value)) {
          score -= 50;
          issues.push("Price does not contain numeric value");
          suggestions.push("Ensure price includes a numeric amount");
        }
        // Check for currency symbol
        const currencyRegex = /[R$€¥£]/;
        if (!currencyRegex.test(value)) {
          score -= 20;
          issues.push("Price may be missing currency symbol");
          suggestions.push("Include currency symbol (R$, €, etc.)");
        }
      }
      break;

    case "originalPrice":
      if (value && typeof value === "string") {
        const priceRegex = /[\d.,]+/;
        if (!priceRegex.test(value)) {
          score -= 30;
          issues.push("Original price does not contain numeric value");
        }
      }
      break;

    case "sku":
      if (typeof value !== "string") {
        score -= 20;
        issues.push("SKU is not a string");
      } else if (value.length < 2) {
        score -= 40;
        issues.push("SKU is too short");
        suggestions.push("SKU should be at least 2 characters");
      } else if (value.length > 100) {
        score -= 20;
        issues.push("SKU is too long");
      }
      break;

    case "category":
      if (typeof value !== "string") {
        score -= 20;
        issues.push("Category is not a string");
      } else if (value.length < 2) {
        score -= 30;
        issues.push("Category is too short");
      }
      break;

    case "brand":
      if (typeof value !== "string") {
        score -= 20;
        issues.push("Brand is not a string");
      } else if (value.length < 2) {
        score -= 30;
        issues.push("Brand is too short");
      }
      break;

    case "images":
      if (!Array.isArray(value)) {
        score -= 40;
        issues.push("Images is not an array");
      } else if (value.length === 0) {
        score -= 50;
        issues.push("No images found");
        suggestions.push("Add product images from the website");
      } else if (value.length === 1) {
        score -= 20;
        issues.push("Only one image found");
        suggestions.push("Try to extract more product images");
      } else if (value.length > 50) {
        score -= 10;
        issues.push("Too many images (> 50)");
      } else {
        // Validate image URLs
        const validImages = value.filter(
          (img) => typeof img === "string" && (img.startsWith("http") || img.startsWith("/"))
        );
        if (validImages.length < value.length) {
          score -= 15;
          issues.push(`${value.length - validImages.length} invalid image URLs`);
        }
      }
      break;

    case "rating":
      if (value) {
        if (typeof value !== "string" && typeof value !== "number") {
          score -= 30;
          issues.push("Rating is not a string or number");
        } else {
          const ratingNum = typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
            score -= 40;
            issues.push("Rating is out of valid range (0-5)");
            suggestions.push("Ensure rating is between 0 and 5");
          }
        }
      }
      break;

    case "reviewCount":
      if (value) {
        if (typeof value !== "number") {
          score -= 20;
          issues.push("Review count is not a number");
        } else if (value < 0) {
          score -= 40;
          issues.push("Review count is negative");
        }
      }
      break;

    case "weight":
      if (value && typeof value === "string") {
        const weightRegex = /[\d.,]+\s*(g|kg|lb|oz|mg)/i;
        if (!weightRegex.test(value)) {
          score -= 30;
          issues.push("Weight may be missing unit (g, kg, lb, etc.)");
          suggestions.push("Include weight unit (g, kg, lb, oz, mg)");
        }
      }
      break;

    case "dimensions":
      if (value && typeof value === "object") {
        const dims = value as Record<string, unknown>;
        const requiredDims = ["height", "width", "length"];
        const foundDims = Object.keys(dims).filter((k) => requiredDims.includes(k.toLowerCase()));
        if (foundDims.length === 0) {
          score -= 40;
          issues.push("No dimension values found");
          suggestions.push("Add height, width, and length dimensions");
        } else if (foundDims.length < 3) {
          score -= 20;
          issues.push(`Only ${foundDims.length} of 3 dimensions found`);
        }
      }
      break;

    case "availability":
      if (typeof value !== "string") {
        score -= 30;
        issues.push("Availability is not a string");
      } else {
        const validStatuses = ["in stock", "out of stock", "available", "unavailable", "pre-order"];
        const isValid = validStatuses.some((status) =>
          value.toLowerCase().includes(status)
        );
        if (!isValid) {
          score -= 20;
          issues.push("Availability status is unclear");
          suggestions.push("Use standard status: in stock, out of stock, available, unavailable, pre-order");
        }
      }
      break;

    case "specifications":
      if (value && typeof value === "object") {
        const specs = value as Record<string, unknown>;
        const specCount = Object.keys(specs).length;
        if (specCount === 0) {
          score -= 30;
          issues.push("No specifications found");
          suggestions.push("Extract product specifications from the page");
        } else if (specCount < 3) {
          score -= 15;
          issues.push(`Only ${specCount} specifications found`);
        }
      }
      break;

    case "nutritionalInfo":
      if (value && typeof value === "object") {
        const nutrition = value as Record<string, unknown>;
        const infoCount = Object.keys(nutrition).length;
        if (infoCount === 0) {
          score -= 20;
          issues.push("No nutritional information found");
          suggestions.push("Extract nutritional facts if available on the page");
        } else if (infoCount < 5) {
          score -= 10;
          issues.push(`Only ${infoCount} nutritional values found`);
        }
      }
      break;

    case "metaTitle":
      if (typeof value !== "string") {
        score -= 15;
        issues.push("Meta title is not a string");
      } else if (value.length < 5) {
        score -= 30;
        issues.push("Meta title is too short");
      } else if (value.length > 160) {
        score -= 20;
        issues.push("Meta title exceeds recommended length (160 chars)");
      }
      break;

    case "metaDescription":
      if (typeof value !== "string") {
        score -= 15;
        issues.push("Meta description is not a string");
      } else if (value.length < 10) {
        score -= 30;
        issues.push("Meta description is too short");
      } else if (value.length > 160) {
        score -= 20;
        issues.push("Meta description exceeds recommended length (160 chars)");
      }
      break;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine confidence level
  let confidence: "low" | "medium" | "high" = "high";
  if (score < 50) {
    confidence = "low";
  } else if (score < 75) {
    confidence = "medium";
  }

  return {
    field: fieldName,
    score,
    confidence,
    issues,
    suggestions,
  };
}

/**
 * Generate quality report for extracted product data
 */
export function generateQualityReport(data: ScrapedProductData): DataQualityReport {
  const fieldScores: Record<string, FieldQualityScore> = {};
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Define which fields are critical
  const criticalFields = ["name", "price", "images"];
  const importantFields = ["description", "sku", "category", "brand"];

  // Validate each field
  const fieldsToValidate = [
    "name",
    "description",
    "price",
    "originalPrice",
    "sku",
    "category",
    "brand",
    "images",
    "rating",
    "reviewCount",
    "weight",
    "dimensions",
    "availability",
    "specifications",
    "nutritionalInfo",
    "metaTitle",
    "metaDescription",
  ];

  for (const field of fieldsToValidate) {
    const value = (data as Record<string, unknown>)[field];
    const fieldScore = validateField(field, value);
    fieldScores[field] = fieldScore;

    // Categorize issues
    if (criticalFields.includes(field) && fieldScore.score < 50) {
      criticalIssues.push(`${field}: ${fieldScore.issues.join(", ")}`);
    } else if (importantFields.includes(field) && fieldScore.score < 50) {
      warnings.push(`${field}: ${fieldScore.issues.join(", ")}`);
    }
  }

  // Calculate overall score
  const scores = Object.values(fieldScores).map((fs) => fs.score);
  const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;

  // Generate summary
  let summary = "";
  if (overallScore >= 80) {
    summary = "Excellent data quality. Most fields are complete and well-formatted.";
  } else if (overallScore >= 60) {
    summary = "Good data quality. Some fields could be improved or completed.";
  } else if (overallScore >= 40) {
    summary = "Fair data quality. Several fields need attention or completion.";
  } else {
    summary = "Poor data quality. Many fields are missing or incomplete.";
  }

  return {
    overallScore,
    fieldScores,
    criticalIssues,
    warnings,
    summary,
    timestamp: new Date(),
  };
}

/**
 * Get quality score for a specific field
 */
export function getFieldScore(data: ScrapedProductData, fieldName: string): FieldQualityScore {
  const value = (data as Record<string, unknown>)[fieldName];
  return validateField(fieldName, value);
}

/**
 * Get color indicator for quality score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-300";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-300";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-red-100 text-red-800 border-red-300";
}

/**
 * Get confidence badge color
 */
export function getConfidenceColor(confidence: "low" | "medium" | "high"): string {
  switch (confidence) {
    case "high":
      return "bg-emerald-100 text-emerald-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-rose-100 text-rose-800";
  }
}
