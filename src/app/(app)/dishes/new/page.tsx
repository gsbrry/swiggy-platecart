import { DishForm } from "@/components/dishes/dish-form";
import { getMe } from "@/lib/auth";

export const metadata = { title: "New dish" };

export default async function NewDishPage() {
  const me = await getMe();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-[28px] font-semibold leading-tight">New dish</h1>
      <DishForm
        initial={{
          id: null,
          name: "",
          description: "",
          diet: me?.settings.diet ?? "veg",
          meal_types: [],
          cook_minutes: "",
          steps: "",
          tags: "",
          is_public: false,
          ingredients: [{ name: "", quantity: "", unit: "" }],
        }}
      />
    </div>
  );
}
