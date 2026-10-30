import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Diet, Meal, Period, Visibility } from "@/lib/labels";

export type MenuItem = {
  id: string;
  day_index: number;
  meal: Meal;
  is_eatout: boolean;
  dish_name: string | null;
  dish_diet: Diet | null;
  ingredients: { name: string; quantity: number | null; unit: string | null }[];
};

export type MenuDetail = {
  menu: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    period: Period;
    days: number;
    visibility: Visibility;
    diet: Diet;
    tags: string[];
    rating_avg: number;
    rating_count: number;
    get_count: number;
    created_at: string;
  };
  owner: { display_name: string; username: string | null };
  is_owner: boolean;
  items: MenuItem[];
};

const SLUG = /^[a-z0-9]{6,20}$/;

/** Menu by share slug via the menu_by_slug RPC (works for link-only menus without exposing them in lists). */
export async function loadMenu(slug: string): Promise<MenuDetail | null> {
  if (!SLUG.test(slug)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("menu_by_slug", { p_slug: slug });
  if (error || !data) return null;
  return data as unknown as MenuDetail;
}
