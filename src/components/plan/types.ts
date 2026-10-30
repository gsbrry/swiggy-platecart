import type { Diet, Meal } from "@/lib/labels";

export type SlotDish = { id: string; name: string; diet: Diet; cook_minutes: number | null };
export type PlanSlot = { date: string; meal: Meal; isEatout: boolean; dish: SlotDish | null };
export type DishOption = { id: string; name: string; diet: Diet; meal_types: Meal[]; cook_minutes: number | null; mine: boolean };
