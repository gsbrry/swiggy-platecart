import { MOCK_TEMPLATES } from "@/components/templates/mock-templates";
import type { BrowserTemplate } from "@/components/templates/types";

/**
 * Local extension of BrowserTemplate to carry ownership + visibility metadata
 * that "My Templates" needs. Kept scoped to this screen — the shared browser
 * type stays lean.
 */
export type MineTemplate = BrowserTemplate & {
  origin: "created" | "forked";
  visibility: "public" | "private";
  forkedFromCreator?: string;
};

const MINE_MAP: Record<
  string,
  Pick<MineTemplate, "origin" | "visibility" | "forkedFromCreator">
> = {
  // Four I created
  "t-oats": { origin: "created", visibility: "public" },
  "t-khichdi": { origin: "created", visibility: "public" },
  "t-poha": { origin: "created", visibility: "private" },
  "t-sprout": { origin: "created", visibility: "public" },
  // Two I forked from other creators
  "t-tofu": {
    origin: "forked",
    visibility: "private",
    forkedFromCreator: "@arjun.eats",
  },
  "t-yogurt": {
    origin: "forked",
    visibility: "public",
    forkedFromCreator: "@meera.fit",
  },
};

/** Snapshot of the current user's templates for mock mode. */
export function getMineTemplates(): MineTemplate[] {
  return MOCK_TEMPLATES.flatMap((t) => {
    const meta = MINE_MAP[t.id];
    if (!meta) return [];
    return [{ ...t, ...meta }];
  });
}
