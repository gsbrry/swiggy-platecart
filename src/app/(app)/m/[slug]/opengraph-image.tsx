import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export const alt = "Meal plan on Planetto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Payload = {
  menu: { title: string; period: string; diet: string; rating_avg: number; rating_count: number };
  owner: { display_name: string };
  items: { day_index: number; meal: string; dish_name: string | null; is_eatout: boolean }[];
};

/** WhatsApp / social preview card for a shared menu. Reads anonymously, so private menus never render. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: Payload | null = null;
  if (/^[a-z0-9]{6,20}$/.test(slug)) {
    const supabase = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
    const res = await supabase.rpc("menu_by_slug", { p_slug: slug });
    data = (res.data as unknown as Payload) ?? null;
  }

  const title = data?.menu.title ?? "Plan your week of meals";
  const dishes = (data?.items ?? [])
    .filter((i) => i.dish_name && i.day_index === 0)
    .map((i) => i.dish_name as string)
    .slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #FFF6EF 0%, #FFE3CC 55%, #FFD0C8 100%)",
          color: "#2B1D1A",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 700 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#FF8A1F,#E63946)", display: "flex" }} />
          Planetto
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {data && (
            <div style={{ display: "flex", fontSize: 28, color: "#C2410C", fontWeight: 700, textTransform: "uppercase" }}>
              {data.menu.period} menu · {data.menu.diet}
            </div>
          )}
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          {dishes.length > 0 && <div style={{ display: "flex", fontSize: 32, color: "#6F5F5A" }}>{dishes.join("  ·  ")}</div>}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#6F5F5A" }}>
          <span>{data ? `by ${data.owner.display_name}` : "Free meal planner"}</span>
          <span>
            {data && data.menu.rating_count > 0 ? `★ ${Number(data.menu.rating_avg).toFixed(1)} (${data.menu.rating_count})` : "Copy it into your week"}
          </span>
        </div>
      </div>
    ),
    size,
  );
}
