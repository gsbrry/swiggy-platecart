import { SiteFooter, SiteHeader } from "@/components/marketing/site-chrome";
import { getUserId } from "@/lib/supabase/server";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const userId = await getUserId();
  return (
    <div className="min-h-dvh">
      <SiteHeader signedIn={!!userId} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
