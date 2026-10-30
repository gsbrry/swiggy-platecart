import Link from "next/link";

export const metadata = {
  title: "About",
  description: "Why Planetto exists and what we promise the people who use it.",
};

const PROMISES: [string, string][] = [
  ["Free to plan", "Planning, shopping lists and sharing stay free. If paid menus arrive, you'll always see the price first."],
  ["Your kitchen, your data", "Your diet, household and plan are private. Data is stored in India, never sold, and you can delete everything from the Me page."],
  ["Honest ratings", "Only people who used a menu can rate it, once. We don't buy, fake or hide reviews."],
  ["Food, not medicine", "Menus are ideas from home cooks. For medical diets, talk to a doctor or dietitian."],
];

export default function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pb-12 pt-12 sm:px-6 lg:pt-20">
        <p className="text-sm font-semibold text-ink-orange">About Planetto</p>
        <h1 className="mt-3 text-balance text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
          The question every Indian home asks, <span className="text-accent">three times a day.</span>
        </h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink">
          <p>&ldquo;What should we cook today?&rdquo; It sounds small. Asked 21 times a week, it becomes the most tiring part of running a kitchen, more than the cooking itself.</p>
          <p>
            Recipe apps help with one dish. Delivery apps help when there&apos;s no plan. Nothing helped with the <em>week</em>: deciding once, buying once, and letting everyone at home know what&apos;s coming.
          </p>
          <p>
            Planetto is that week. You plan breakfast, lunch and dinner in a few minutes, the shopping list adds itself up, and the plan goes to the family as a link. When you run out of ideas, you borrow a week from another home cook, and rate it so the next person knows what works.
          </p>
          <p>It&apos;s built for Indian kitchens first: dal and sabzi before pasta, Jain and no onion-garlic diets treated as normal, and quantities sized for real households.</p>
        </div>
      </section>

      <section aria-labelledby="promises" className="border-y border-hairline bg-white/60">
        <div className="mx-auto max-w-app px-4 py-16 sm:px-6">
          <h2 id="promises" className="text-[32px] font-semibold leading-tight">What we promise</h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {PROMISES.map(([t, d]) => (
              <div key={t}>
                <dt className="text-xl font-semibold">{t}</dt>
                <dd className="mt-1.5 max-w-md text-ink-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h2 className="text-[28px] font-semibold">Talk to us</h2>
        <p className="mt-3 text-lg text-ink-muted">
          Ideas, bugs, a dish we should add, or a menu you&apos;d like to publish: write to{" "}
          <a href="mailto:hello@obio.in" className="font-medium text-ink-orange underline">hello@obio.in</a>.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up" className="btn-primary h-[52px] px-7 text-base">Plan my first week</Link>
          <Link href="/creators" className="btn-secondary h-[52px] px-7 text-base">Publish a menu</Link>
        </div>
      </section>
    </>
  );
}
