import { AppNav } from "@/components/app-nav";
import { getMineTemplates } from "@/components/my-templates/mock-mine";
import { MyTemplatesBrowser } from "@/components/my-templates/my-templates-browser";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget } from "@/lib/mock";

export const dynamic = "force-dynamic";

export default async function MyTemplatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to view your templates.
        </div>
      </div>
    );
  }

  const mock = isMockMode();

  // Real mode would hit GET /api/templates?creator_id=me — that endpoint is
  // still a stub, so today we serve the canned "mine" slice in both modes.
  const templates = mock ? getMineTemplates() : getMineTemplates();

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
      <MyTemplatesBrowser templates={templates} />
    </div>
  );
}
