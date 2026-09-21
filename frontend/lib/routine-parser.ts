export interface ParsedRoutine {
  hasRoutine: boolean;
  morningRoutine: string[];
  nightRoutine: string[];
  ingredients: { name: string; purpose: string }[];
  products: { name: string; price?: string; reason?: string }[];
  cautions: string[];
  summary: string;
  rawText: string;
}

export function parseRoutineResponse(text: string): ParsedRoutine {
  if (!text) {
    return {
      hasRoutine: false,
      morningRoutine: [],
      nightRoutine: [],
      ingredients: [],
      products: [],
      cautions: [],
      summary: "",
      rawText: "",
    };
  }

  const lines = text.split("\n");
  const morning: string[] = [];
  const night: string[] = [];
  const ingredients: { name: string; purpose: string }[] = [];
  const products: { name: string; price?: string; reason?: string }[] = [];
  const cautions: string[] = [];
  let summary = "";

  type Section = "none" | "morning" | "night" | "ingredients" | "products" | "cautions" | "summary";
  let currentSection: Section = "none";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    const lower = line.toLowerCase();

    // Section header detection
    if (
      lower.includes("morning routine") ||
      lower.includes("am routine") ||
      lower.includes("day routine") ||
      (lower.includes("morning") && (line.startsWith("#") || line.startsWith("**")))
    ) {
      currentSection = "morning";
      continue;
    } else if (
      lower.includes("night routine") ||
      lower.includes("pm routine") ||
      lower.includes("evening routine") ||
      (lower.includes("night") && (line.startsWith("#") || line.startsWith("**")))
    ) {
      currentSection = "night";
      continue;
    } else if (
      lower.includes("active ingredient") ||
      lower.includes("key ingredient") ||
      lower.includes("recommended ingredient") ||
      lower.includes("key actives")
    ) {
      currentSection = "ingredients";
      continue;
    } else if (
      lower.includes("product recommendation") ||
      lower.includes("recommended product") ||
      lower.includes("products to consider") ||
      lower.includes("budget pick")
    ) {
      currentSection = "products";
      continue;
    } else if (
      lower.includes("precaution") ||
      lower.includes("patch test") ||
      lower.includes("warning") ||
      lower.includes("important tip") ||
      lower.includes("sun protection tip")
    ) {
      currentSection = "cautions";
      continue;
    }

    // Step or item extraction
    const cleanItem = line.replace(/^[\*\-\•\d+\.]+\s*/, "").replace(/\*\*/g, "").trim();

    if (!cleanItem) continue;

    if (currentSection === "morning") {
      if (line.match(/^(\d+[\.\)]|\*|\-|\•)/)) {
        morning.push(cleanItem);
      } else if (line.startsWith("Step") || line.startsWith("1.") || line.startsWith("2.")) {
        morning.push(cleanItem);
      }
    } else if (currentSection === "night") {
      if (line.match(/^(\d+[\.\)]|\*|\-|\•)/)) {
        night.push(cleanItem);
      } else if (line.startsWith("Step") || line.startsWith("1.") || line.startsWith("2.")) {
        night.push(cleanItem);
      }
    } else if (currentSection === "ingredients") {
      if (line.match(/^(\d+[\.\)]|\*|\-|\•)/)) {
        const parts = cleanItem.split(/[:–—\-]/);
        if (parts.length >= 2) {
          ingredients.push({
            name: parts[0].trim(),
            purpose: parts.slice(1).join(" - ").trim(),
          });
        } else {
          ingredients.push({ name: cleanItem, purpose: "Supports skin barrier & targets concerns" });
        }
      }
    } else if (currentSection === "products") {
      if (line.match(/^(\d+[\.\)]|\*|\-|\•)/)) {
        // Extract price if present (e.g., ₹499 or Rs. 499)
        const priceMatch = cleanItem.match(/(₹|Rs\.?\s?)\s*(\d+[,\d]*)/i);
        const price = priceMatch ? `₹${priceMatch[2]}` : undefined;
        const nameAndReason = cleanItem.replace(/\((₹|Rs\.?).*?\)/gi, "");
        const parts = nameAndReason.split(/[:–—\-]/);
        products.push({
          name: parts[0].trim(),
          price,
          reason: parts.length > 1 ? parts.slice(1).join(" - ").trim() : undefined,
        });
      }
    } else if (currentSection === "cautions") {
      if (line.match(/^(\d+[\.\)]|\*|\-|\•)/)) {
        cautions.push(cleanItem);
      }
    } else {
      if (!summary && line.length > 30 && !line.startsWith("#")) {
        summary = line;
      }
    }
  }

  // Determine if this is a structured routine response
  const hasRoutine =
    morning.length > 0 ||
    night.length > 0 ||
    ingredients.length > 0 ||
    products.length > 0;

  return {
    hasRoutine,
    morningRoutine: morning,
    nightRoutine: night,
    ingredients,
    products,
    cautions,
    summary,
    rawText: text,
  };
}
