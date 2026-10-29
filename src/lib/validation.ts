import { z } from "zod";

import { DIETS, MEALS, PERIODS } from "@/lib/labels";
import { isIsoDate } from "@/lib/dates";

export const zUuid = z.string().uuid();
export const zDate = z.string().refine(isIsoDate, "Invalid date");
export const zMeal = z.enum(MEALS as [string, ...string[]]).transform((v) => v as (typeof MEALS)[number]);
export const zDiet = z.enum(DIETS as [string, ...string[]]).transform((v) => v as (typeof DIETS)[number]);
export const zPeriod = z.enum(PERIODS as [string, ...string[]]).transform((v) => v as (typeof PERIODS)[number]);
export const zVisibility = z.enum(["private", "link", "public"]);

/** Plain, single-line user text: trims, collapses whitespace, strips control characters. */
export const zText = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(min, min === 1 ? "Required" : `At least ${min} characters`).max(max, `At most ${max} characters`));

/** Multi-line text (descriptions, steps, reviews): keeps newlines, strips other control chars. */
export const zLongText = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").replace(/\n{3,}/g, "\n\n").trim())
    .pipe(z.string().max(max, `At most ${max} characters`));

export const zTags = (maxCount: number) =>
  z
    .array(z.string())
    .transform((tags) =>
      Array.from(
        new Set(
          tags
            .map((t) => t.toLowerCase().trim().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").slice(0, 24))
            .filter(Boolean),
        ),
      ).slice(0, maxCount),
    );
