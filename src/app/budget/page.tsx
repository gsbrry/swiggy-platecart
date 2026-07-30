import { ScreenStub } from "@/components/screen-stub";

export default function BudgetPage() {
  return (
    <ScreenStub
      title="Budget tracker"
      description="Month-to-date spend split by groceries and eating out."
      apis={["GET /api/budget/summary"]}
    />
  );
}
