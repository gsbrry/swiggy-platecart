export type MealType = "breakfast" | "lunch" | "dinner";

export type SlotTemplate = {
  id: string;
  dishName: string;
  tags: string[];
};

export type SlotView = {
  id: string;
  dayOfWeek: number; // 1..7 Mon..Sun
  mealType: MealType;
  isEatout: boolean;
  templateId: string | null;
  template: SlotTemplate | null;
};

export type PickerTemplate = {
  id: string;
  dishName: string;
  tags: string[];
  avgKcal: number;
  prepMinutes: number;
  forks: number;
  /** Filter chip keys the template belongs to (all, veg, highprot, light, quick). */
  filters: string[];
};
