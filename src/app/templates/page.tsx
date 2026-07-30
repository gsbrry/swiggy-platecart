import { AppNav } from "@/components/app-nav";
import { MOCK_TEMPLATES } from "@/components/templates/mock-templates";
import { TemplateBrowser } from "@/components/templates/template-browser";
import type { BrowserTemplate } from "@/components/templates/types";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget } from "@/lib/mock";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to browse templates.
        </div>
      </div>
    );
  }

  const mock = isMockMode();

  // Real mode hits GET /api/templates?lane=... — that endpoint is still a stub,
  // so today we fall back to the canned mock list in both modes.
  const templates: BrowserTemplate[] = mock ? MOCK_TEMPLATES : MOCK_TEMPLATES;

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
      <TemplateBrowser templates={templates} />
    </div>
  );
}
