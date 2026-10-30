import { notFound } from "next/navigation";

import { DishForm } from "@/components/dishes/dish-form";
import { requireUserId } from "@/lib/auth";
import type { Diet, Meal } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { zUuid } from "@/lib/validation";

export const metadata = { title: "Edit dish" };

export default async function EditDishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!zUuid.safeParse(id).success) notFound();
  const userId = await requireUserId(`/dishes/${id}/edit`);
  const supabase = await createClient();
  const { data: d } = await supabase
    .from("dishes")
    .select("id, name, description, diet, meal_types, tags, cook_minutes, steps, is_public, dish_ingredients(name, quantity, unit, position)")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();
  if (!d) notFound();
  const ingredients = [...d.dish_ingredients].sort((a, b) => a.position - b.position);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-[28px] font-semibold leading-tight">Edit dish</h1>
      <DishForm
        initial={{
          id: d.id,
          name: d.name,
          description: d.description ?? "",
          diet: d.diet as Diet,
          meal_types: d.meal_types as Meal[],
          cook_minutes: d.cook_minutes ? String(d.cook_minutes) : "",
          steps: d.steps ?? "",
          tags: d.tags.join(", "),
          is_public: d.is_public,
          ingredients: ingredients.length
            ? ingredients.map((i) => ({ name: i.name, quantity: i.quantity ? String(Number(i.quantity)) : "", unit: i.unit ?? "" }))
            : [{ name: "", quantity: "", unit: "" }],
        }}
      />
    </div>
  );
}
