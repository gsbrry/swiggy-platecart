import { z } from "zod";

export const uuid = z.string().uuid();

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// Free-text field guard: printable, trimmed, bounded length.
export const safeText = (max = 200) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .regex(/^[\p{L}\p{N}\s\-.,()'&/]+$/u, "unsupported characters");

export const dietType = z.enum(["veg", "nonveg", "vegan", "keto", "jain", "glutenfree"]);
export const goal = z.enum(["loss", "gain", "maintain"]);
export const mealType = z.enum(["breakfast", "lunch", "dinner"]);
export const wasteLevel = z.enum(["none", "some", "most"]);
