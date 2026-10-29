import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { MOCK_TEMPLATES } from "@/components/templates/mock-templates";
import { TemplateDetailView } from "@/components/templates/detail/template-detail";
import { getTemplateDetail } from "@/components/templates/detail/mock-details";
import type { BrowserTemplate } from "@/components/templates/types";
import { getCurrentUser } from "@/lib/current-user";
import { isMockMode, mockBudget } from "@/lib/mock";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
};

export default async function TemplateDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <div className="mx-auto max-w-[1100px] px-6 py-10 text-sm text-[var(--sw-muted)]">
          Please sign in to view templates.
        </div>
      </div>
    );
  }

  const mock = isMockMode();
  const spentGroceries = mock ? mockBudget.spentGroceries : 0;
  const spentEatout = mock ? mockBudget.spentEatout : 0;
  const totalSpent = spentGroceries + spentEatout;
  const monthlyBudget = user.monthlyBudget ? Number(user.monthlyBudget) : 0;
  const avatarInitials = (user.name ?? "U").slice(0, 2).toUpperCase();

  const template = MOCK_TEMPLATES.find((t) => t.id === params.id);

  if (!template) {
    return (
      <div className="min-h-screen bg-[var(--sw-page)]">
        <AppNav
          avatarInitials={avatarInitials}
          spent={totalSpent}
          budget={monthlyBudget}
        />
        <div className="mx-auto max-w-[720px] px-6 py-16 text-center">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
            404
          </div>
          <h1 className="mb-2 text-2xl font-bold text-[var(--sw-charcoal)]">
            Template not found
          </h1>
          <p className="mb-6 text-sm text-[var(--sw-muted)]">
            We couldn&apos;t find a template with id{" "}
            <code className="rounded bg-[var(--sw-page)] px-1.5 py-0.5 font-mono text-xs text-[var(--sw-charcoal)]">
              {params.id}
            </code>
            . It may have been removed or renamed.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 rounded-lg bg-appetite px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  const detail = getTemplateDetail(template.id);

  const similar: BrowserTemplate[] = MOCK_TEMPLATES.filter(
    (t) => t.id !== template.id && t.mealType === template.mealType,
  )
    .sort((a, b) => b.forkCount - a.forkCount)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--sw-page)]">
      <AppNav
        avatarInitials={avatarInitials}
        spent={totalSpent}
        budget={monthlyBudget}
      />
      <TemplateDetailView
        template={template}
        detail={detail}
        similar={similar.map((s) => ({
          id: s.id,
          dishName: s.dishName,
          tags: s.tags,
          kcal: s.kcal,
          prepMinutes: s.prepMinutes,
          forkCount: s.forkCount,
        }))}
      />
    </div>
  );
}
