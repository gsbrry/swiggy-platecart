import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Pencil, Trash2 } from "lucide-react";

import { AddToPlanButton, ForkButton, ReportButton } from "@/components/dishes/dish-actions";
import { DietDot } from "@/components/ui/diet-dot";
import { deleteDish } from "@/lib/actions/dishes";
import { todayIso } from "@/lib/dates";
import { DIET_LABEL, MEAL_LABEL, type Diet, type Meal } from "@/lib/labels";
import { createClient, getUserId } from "@/lib/supabase/server";
import { zUuid } from "@/lib/validation";

export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!zUuid.safeParse(id).success) notFound();
  const supabase = await createClient();
  const userId = await getUserId();
  const { data: dish } = await supabase
    .from("dishes")
    .select("id, name, description, diet, meal_types, tags, cook_minutes, steps, is_public, owner_id, fork_count, forked_from, owner:profiles(display_name, username), dish_ingredients(name, quantity, unit, position)")
    .eq("id", id)
    .maybeSingle();
  if (!dish) notFound();

  const mine = !!userId && dish.owner_id === userId;
  const ingredients = [...(dish.dish_ingredients ?? [])].sort((a, b) => a.position - b.position);
  const author = dish.owner_id ? dish.owner?.display_name ?? "A Planetto cook" : "Planetto Kitchen";
  const mealTypes = dish.meal_types as Meal[];

  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <Link href={mine ? "/dishes?tab=mine" : "/dishes"} className="text-sm font-medium text-ink-orange hover:underline">
        ← Dishes
      </Link>
      <header className="glass space-y-3 p-6">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <DietDot diet={dish.diet as Diet} /> {DIET_LABEL[dish.diet as Diet]}
          {dish.cook_minutes && (
            <span className="inline-flex items-center gap-1">
              · <Clock className="h-4 w-4" /> {dish.cook_minutes} min
            </span>
          )}
          {mealTypes.length > 0 && <span>· {mealTypes.map((m) => MEAL_LABEL[m]).join(", ")}</span>}
        </div>
        <h1 className="text-[28px] font-semibold leading-tight sm:text-[40px]">{dish.name}</h1>
        <p className="text-sm text-ink-muted">
          by {author}
          {dish.owner?.username && <> · @{dish.owner.username}</>}
          {mine && !dish.is_public && " · private"}
        </p>
        {dish.description && <p className="whitespace-pre-line text-ink">{dish.description}</p>}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <AddToPlanButton dishId={dish.id} today={todayIso()} defaultMeal={mealTypes[0] ?? "lunch"} signedIn={!!userId} />
          {mine ? (
            <>
              <Link href={`/dishes/${dish.id}/edit`} className="btn-secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={deleteDish}>
                <input type="hidden" name="id" value={dish.id} />
                <button className="btn-ghost text-danger hover:bg-danger/5">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </form>
            </>
          ) : (
            <ForkButton dishId={dish.id} signedIn={!!userId} />
          )}
        </div>
      </header>

      {dish.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dish.tags.map((t) => (
            <span key={t} className="rounded-full bg-white px-2.5 py-1 text-sm text-ink-muted">{t}</span>
          ))}
        </div>
      )}

      <section className="surface-solid p-6">
        <h2 className="text-lg font-semibold">Ingredients <span className="text-sm font-normal text-ink-muted">(for 2 people)</span></h2>
        {ingredients.length ? (
          <ul className="mt-3 divide-y divide-hairline">
            {ingredients.map((i) => (
              <li key={i.position} className="flex justify-between gap-4 py-2.5">
                <span className="capitalize">{i.name}</span>
                <span className="text-ink-muted">{i.quantity ? `${Number(i.quantity)} ${i.unit ?? ""}` : ""}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-muted">No ingredients added yet.</p>
        )}
      </section>

      {dish.steps && (
        <section className="surface-solid p-6">
          <h2 className="text-lg font-semibold">How to make it</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{dish.steps}</p>
        </section>
      )}

      {!mine && dish.owner_id && <ReportButton type="dish" id={dish.id} signedIn={!!userId} />}
    </article>
  );
}
