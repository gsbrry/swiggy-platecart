import { ScreenStub } from "@/components/screen-stub";

export default function MealPlanPage() {
  return (
    <ScreenStub
      title="Weekly meal plan"
      description="Assign templates to breakfast, lunch and dinner slots across the week."
      apis={[
        "GET /api/meal-plans/current",
        "PATCH /api/meal-plans/[id]/slots",
        "GET /api/templates",
        "POST /api/templates/[id]/fork",
        "POST /api/cart/build",
      ]}
    />
  );
}
