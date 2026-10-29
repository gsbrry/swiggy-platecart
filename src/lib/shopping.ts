export type Line = { name: string; quantity: number | null; unit: string | null };
export type ListItem = { key: string; name: string; quantity: number | null; unit: string | null; dishes: string[] };

/** Merge ingredient lines by name+unit and scale from the 2-person recipe base to the household. */
export function buildShoppingList(
  meals: { dish: string; ingredients: Line[] }[],
  householdSize: number,
): ListItem[] {
  const factor = householdSize / 2;
  const map = new Map<string, ListItem>();
  for (const meal of meals) {
    for (const ing of meal.ingredients) {
      const name = ing.name.trim().toLowerCase();
      if (!name) continue;
      const unit = ing.unit?.trim().toLowerCase() || null;
      const key = `${name}|${unit ?? ""}`;
      const cur = map.get(key) ?? { key, name, quantity: null, unit, dishes: [] };
      if (ing.quantity != null) cur.quantity = (cur.quantity ?? 0) + Number(ing.quantity) * factor;
      if (!cur.dishes.includes(meal.dish)) cur.dishes.push(meal.dish);
      map.set(key, cur);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatQty(q: number | null, unit: string | null): string {
  if (q == null) return "";
  const rounded = q >= 10 ? Math.round(q) : Math.round(q * 4) / 4;
  return `${rounded}${unit ? ` ${unit}` : ""}`;
}
