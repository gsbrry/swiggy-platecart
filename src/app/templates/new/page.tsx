import { AppNav } from "@/components/app-nav";
import { TemplateForm } from "@/components/templates/new/template-form";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget } from "@/lib/mock";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to author a template.
        </div>
      </div>
    );
  }

  const mock = isMockMode();
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
      <TemplateForm mockMode={mock} />
    </div>
  );
}
