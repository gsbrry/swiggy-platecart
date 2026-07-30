// SERVER-SIDE ONLY. Never import from client components.
// The Swiggy MCP client holds a privileged API key; leaking it into a client
// bundle would compromise the tenant. All callers must be server actions,
// route handlers, or other server-only modules.

import { randomUUID } from "node:crypto";

const API_KEY = process.env.SWIGGY_MCP_API_KEY;
const BASE_URL = process.env.SWIGGY_MCP_BASE_URL;

if (!API_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SWIGGY_MCP_API_KEY is required in production");
  }
  // eslint-disable-next-line no-console
  console.warn("[swiggy-mcp] SWIGGY_MCP_API_KEY not set — running stub responses");
}

export type CartItem = {
  ingredient_name: string;
  quantity: number;
  unit: string;
  instamart_search_hint?: string | null;
};

export type CartAddResponse = {
  ok: true;
  order_ref: string;
};

export const swiggyMcp = {
  async cartAdd({ items }: { items: CartItem[] }): Promise<CartAddResponse> {
    // TODO: replace stub with real MCP call once schema is confirmed
    // eslint-disable-next-line no-console
    console.info("[swiggy-mcp] cartAdd stub", {
      itemCount: items.length,
      baseUrl: BASE_URL ?? "unset",
    });
    return { ok: true, order_ref: `stub-${randomUUID()}` };
  },
};
