import { AppNav } from "@/components/app-nav";
import { CartView } from "@/components/cart/cart-view";
import type { MealSource } from "@/components/cart/cart-view";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget, mockSlots } from "@/lib/mock";

export const dynamic = "force-dynamic";

/** Build a map of templateId -> primary meal source label (e.g. "Paneer Bhurji + Roti"). */
function templateSourceMap(): Record<string, MealSource> {
  const slots = mockSlots();
  const bySource: Record<string, MealSource> = {};
  for (const s of slots) {
    if (s.isEatout || !s.templateId || !s.template) continue;
    if (!bySource[s.templateId]) {
      bySource[s.templateId] = {
        templateId: s.templateId,
        dishName: s.template.dishName,
      };
    }
  }
  return bySource;
}

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to see your cart.
        </div>
      </div>
    );
  }

  const mock = isMockMode();
  const templateIds = Array.from(
    new Set(
      mockSlots()
        .filter((s) => !s.isEatout && s.templateId)
        .map((s) => s.templateId as string),
    ),
  );
  const sources = templateSourceMap();

  const spentGroceries = mock ? mockBudget.spentGroceries : 0;
  const spentEatout = mock ? mockBudget.spentEatout : 0;
  const totalSpent = spentGroceries + spentEatout;
  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 0;

  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <AppNav
        avatarInitials={(user.name ?? "U").slice(0, 2).toUpperCase()}
        spent={totalSpent}
        budget={monthlyBudget}
      />
      <CartView templateIds={templateIds} sources={sources} />
    </div>
  );
}
