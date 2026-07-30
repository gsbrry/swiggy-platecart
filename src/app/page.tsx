import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ChartLine,
  Check,
  Coins,
  GitFork,
  Heart,
  Leaf,
  Mic,
  ShoppingBasket,
  Sparkles,
  Trash2,
  Utensils,
} from "lucide-react";

export const metadata = {
  title: "PlateCart — Plan the week. Fill the cart. Cook without chaos.",
  description:
    "PlateCart turns a week of home cooking into a 60-second plan — with your Instamart cart already loaded and your budget on autopilot.",
};

export default function LandingPage() {
  return (
    <div className="bg-white text-[var(--sw-charcoal)]">
      <TopNav />
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <FeaturesGrid />
      <Numbers />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}

/* ─────────────────────────── Top nav ─────────────────────────── */

function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--sw-border)] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-[58px] max-w-[1160px] items-center justify-between px-6">
        <Link
          href="/"
          className="text-[19px] font-bold tracking-tight text-[var(--sw-charcoal)]"
        >
          Plate<em className="not-italic text-[var(--sw-orange)]">Cart</em>
        </Link>
        <nav className="hidden gap-1 md:flex" aria-label="Primary">
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#how">How it works</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full bg-[var(--sw-orange)] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[var(--sw-muted)] hover:bg-[var(--sw-page)] hover:text-[var(--sw-charcoal)]"
    >
      {children}
    </a>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#FFF8F2] via-white to-white" />
      <div className="mx-auto max-w-[1160px] px-6 pb-20 pt-14 md:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sw-orange)]/25 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--sw-orange)]">
              <Sparkles className="h-3 w-3" /> Made for Indian home cooks
            </span>
            <h1 className="mt-5 text-[38px] font-bold leading-[1.08] tracking-tight text-[var(--sw-charcoal)] md:text-[54px]">
              Plan the week.
              <br />
              Fill the cart.
              <br />
              <span className="text-[var(--sw-orange)]">Cook without the chaos.</span>
            </h1>
            <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-[var(--sw-muted)] md:text-[17px]">
              PlateCart turns a messy week of home cooking into a 60-second plan —
              with the grocery cart already loaded on Instamart and your monthly
              budget on autopilot. No spreadsheets. No 8pm panic.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sw-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sw-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)]"
              >
                See the demo
              </Link>
              <span className="text-[12px] text-[var(--sw-muted)]">
                No credit card. No app to install.
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-[var(--sw-muted)]">
              <TrustItem>Free during launch</TrustItem>
              <TrustItem>Works with Instamart</TrustItem>
              <TrustItem>Veg, Jain, Keto & more</TrustItem>
            </div>
          </div>

          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check className="h-3.5 w-3.5 text-[var(--sw-green)]" />
      {children}
    </span>
  );
}

/** Small illustrative "meal plan" preview — pure Tailwind, no images. */
function HeroMockup() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const meals: Array<{ day: number; dish: string; type: string }> = [
    { day: 0, dish: "Moong Poha", type: "Breakfast" },
    { day: 1, dish: "Veg Khichdi", type: "Lunch" },
    { day: 2, dish: "Paneer Bhurji", type: "Dinner" },
    { day: 4, dish: "Banana Oats", type: "Breakfast" },
  ];
  return (
    <div className="relative">
      <div className="absolute -left-6 -top-6 h-40 w-40 rounded-full bg-[var(--sw-orange)]/10 blur-2xl" />
      <div className="relative rounded-2xl border border-[var(--sw-border)] bg-white p-5 shadow-xl shadow-black/[0.04]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--sw-muted)]">
              This week
            </p>
            <p className="text-sm font-bold text-[var(--sw-charcoal)]">Mon 28 Jul – Sun 3 Aug</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--sw-orange)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--sw-orange)]">
            <Check className="h-3 w-3" /> Cart ready
          </span>
        </div>
        <div className="mb-3 grid grid-cols-7 gap-1.5 text-center">
          {days.map((d, i) => (
            <div
              key={i}
              className={`rounded-md py-1 text-[10px] font-bold ${
                i === 0
                  ? "bg-[var(--sw-orange)] text-white"
                  : "bg-[var(--sw-page)] text-[var(--sw-muted)]"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {meals.map((m) => (
            <div
              key={`${m.day}-${m.type}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white">
                <Utensils className="h-4 w-4 text-[var(--sw-orange)]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--sw-muted)]">
                  {m.type}
                </p>
                <p className="text-[13px] font-bold text-[var(--sw-charcoal)]">{m.dish}</p>
              </div>
              <Check className="h-4 w-4 text-[var(--sw-green)]" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[var(--sw-border)] pt-3">
          <span className="text-[11px] font-medium text-[var(--sw-muted)]">
            Instamart cart • 14 items
          </span>
          <span className="text-[13px] font-bold text-[var(--sw-charcoal)]">₹1,230</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Problem ─────────────────────────── */

const PAINS: Array<{ q: string; a: string }> = [
  {
    q: "\"What are we cooking this week?\"",
    a: "Every Sunday I start from scratch. Random Google searches, screenshots of recipes I never open again.",
  },
  {
    q: "\"Half the veggies rot in the fridge.\"",
    a: "I over-buy spinach and coriander every single time. Then I feel guilty when it turns to compost.",
  },
  {
    q: "\"My grocery bill keeps climbing.\"",
    a: "₹15,000 gone by the 20th and I can't tell where. Groceries? Eat-outs? A bit of both?",
  },
  {
    q: "\"New recipe = new shopping list.\"",
    a: "Trying anything new means reading through the ingredients twice, then adding them one by one on the app.",
  },
];

function ProblemSection() {
  return (
    <section className="border-t border-[var(--sw-border)] bg-[var(--sw-page)]">
      <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sw-orange)]">
            Sound familiar?
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight md:text-[36px]">
            Cooking dinner shouldn&apos;t feel like a project.
          </h2>
          <p className="mt-3 text-[15px] text-[var(--sw-muted)]">
            You&apos;re not lazy. You&apos;re just juggling four things at once —
            deciding, shopping, cooking, and cleaning up. PlateCart handles the
            first two so you can focus on the ones that matter.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {PAINS.map((p) => (
            <div
              key={p.q}
              className="rounded-xl border border-[var(--sw-border)] bg-white p-6 shadow-sm"
            >
              <p className="text-[17px] font-bold text-[var(--sw-charcoal)]">{p.q}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--sw-muted)]">{p.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── How it works ─────────────────────────── */

const STEPS = [
  {
    n: "01",
    icon: Calendar,
    title: "Plan your week in 60 seconds",
    body: "Pick meals from a library of 340+ Indian home recipes tuned to your goal (loss, gain, maintain), diet (veg, jain, keto, glutenfree), and household size. Fork what others in your neighbourhood are cooking.",
  },
  {
    n: "02",
    icon: ShoppingBasket,
    title: "Your cart fills itself",
    body: "Every ingredient across every meal gets aggregated automatically. One tap and it lands in your Swiggy Instamart cart — with the quantities right-sized for your family, not the recipe author's.",
  },
  {
    n: "03",
    icon: Utensils,
    title: "Cook without thinking",
    body: "Open the day, see what's for lunch, follow the steps. We track what you cooked, what you ate out, and quietly nudge you when you're heading over budget or wasting food.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-[var(--sw-border)] bg-white">
      <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sw-orange)]">
            How it works
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight md:text-[36px]">
            Three steps. One habit. Zero mental load.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative rounded-xl border border-[var(--sw-border)] bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--sw-orange)]/10">
                  <s.icon className="h-5 w-5 text-[var(--sw-orange)]" />
                </div>
                <span className="text-[11px] font-bold text-[var(--sw-muted)]">{s.n}</span>
              </div>
              <h3 className="text-[17px] font-bold text-[var(--sw-charcoal)]">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--sw-muted)]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Features ─────────────────────────── */

const FEATURES = [
  {
    icon: Calendar,
    title: "Weekly meal planning",
    body: "A drag-and-drop 7-day × 3-meal grid. Drop templates, mark eat-outs, copy last week in one click.",
  },
  {
    icon: ShoppingBasket,
    title: "Instamart cart in one tap",
    body: "Aggregated ingredients, deduped by unit, sent to your Swiggy Instamart cart. No copy-pasting.",
  },
  {
    icon: Mic,
    title: "Voice ordering",
    body: "Say \"paneer bhurji\" — we find matching templates, scale them to your household, add to the plan.",
  },
  {
    icon: ChartLine,
    title: "Budget on autopilot",
    body: "Set a monthly cap. Watch it fill up honestly — groceries versus eat-outs, weekly trends, category splits.",
  },
  {
    icon: Trash2,
    title: "Waste insights",
    body: "One-tap \"How much of this got wasted?\" after each order. We spot patterns and shrink your next basket.",
  },
  {
    icon: GitFork,
    title: "Fork what works",
    body: "Every home cook is a food scientist. Fork templates from people cooking for a family your size, on a budget like yours.",
  },
];

function FeaturesGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-[var(--sw-border)] bg-[var(--sw-page)]"
    >
      <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sw-orange)]">
            Features
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight md:text-[36px]">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-3 text-[15px] text-[var(--sw-muted)]">
            No macros to log. No calorie targets. No streaks or leaderboards. Just
            the plan, the cart, and a quiet nudge when something feels off.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-[var(--sw-border)] bg-white p-6"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--sw-orange)]/10">
                <f.icon className="h-5 w-5 text-[var(--sw-orange)]" />
              </div>
              <h3 className="text-[15px] font-bold text-[var(--sw-charcoal)]">{f.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--sw-muted)]">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Numbers ─────────────────────────── */

function Numbers() {
  const stats: Array<{ k: string; v: string; icon: typeof Utensils }> = [
    { k: "Home recipes", v: "340+", icon: Utensils },
    { k: "Diet types", v: "6", icon: Leaf },
    { k: "Avg. monthly saving", v: "~₹1,200", icon: Coins },
  ];
  return (
    <section className="border-t border-[var(--sw-border)] bg-white">
      <div className="mx-auto max-w-[1160px] px-6 py-14">
        <div className="grid gap-6 md:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.k}
              className="flex items-center gap-4 rounded-xl border border-[var(--sw-border)] bg-white px-6 py-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--sw-orange)]/10">
                <s.icon className="h-5 w-5 text-[var(--sw-orange)]" />
              </div>
              <div>
                <p className="text-[24px] font-bold leading-none text-[var(--sw-charcoal)]">
                  {s.v}
                </p>
                <p className="mt-1 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--sw-muted)]">
                  {s.k}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Testimonials ─────────────────────────── */

const QUOTES = [
  {
    who: "Ananya, 29 · Bengaluru",
    goal: "Weight loss",
    q: "I stopped picking up biryani at 9pm because dinner was already decided. Lost 4kg in three months without even trying.",
  },
  {
    who: "Rahul & Priya, 34 · Pune",
    goal: "Family of four",
    q: "Sunday planning used to take an hour. Now it's 90 seconds and one Instamart order. That's it.",
  },
  {
    who: "Meera, 41 · Mumbai",
    goal: "Jain household",
    q: "Every recipe app assumes onion and garlic. PlateCart just… doesn't. Finally somewhere I don't have to translate every ingredient.",
  },
];

function Testimonials() {
  return (
    <section className="border-t border-[var(--sw-border)] bg-[var(--sw-page)]">
      <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sw-orange)]">
            Real kitchens
          </p>
          <h2 className="mt-3 text-[28px] font-bold tracking-tight md:text-[36px]">
            Built with home cooks, not chefs.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {QUOTES.map((qt) => (
            <figure
              key={qt.who}
              className="rounded-xl border border-[var(--sw-border)] bg-white p-6"
            >
              <Heart className="h-4 w-4 text-[var(--sw-orange)]" />
              <blockquote className="mt-3 text-[14px] leading-relaxed text-[var(--sw-charcoal)]">
                &ldquo;{qt.q}&rdquo;
              </blockquote>
              <figcaption className="mt-4 border-t border-[var(--sw-border)] pt-3">
                <p className="text-[12px] font-bold text-[var(--sw-charcoal)]">{qt.who}</p>
                <p className="text-[11px] text-[var(--sw-muted)]">{qt.goal}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Final CTA ─────────────────────────── */

function FinalCta() {
  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-[var(--sw-border)] bg-white"
    >
      <div className="mx-auto max-w-[1160px] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] rounded-2xl border border-[var(--sw-border)] bg-gradient-to-br from-[#FFF8F2] to-white p-8 text-center md:p-12">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sw-orange)]/25 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--sw-orange)]">
            Free during launch
          </span>
          <h2 className="mt-5 text-[28px] font-bold tracking-tight md:text-[36px]">
            Ready to save your Sunday?
          </h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[15px] text-[var(--sw-muted)]">
            Sign up in 30 seconds. Plan your first week. Watch the cart fill itself.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sw-orange)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sw-border)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)]"
            >
              Try the demo
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-[var(--sw-muted)]">
            No credit card. Cancel any time. We only ever email you when your cart is
            ready.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="border-t border-[var(--sw-border)] bg-white">
      <div className="mx-auto flex max-w-[1160px] flex-col items-start justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
        <p className="text-[12px] text-[var(--sw-muted)]">
          © 2026 PlateCart · Built for Indian home cooks
        </p>
        <nav aria-label="Legal" className="flex gap-5 text-[12px] text-[var(--sw-muted)]">
          <a href="#" className="hover:text-[var(--sw-charcoal)]">Terms</a>
          <a href="#" className="hover:text-[var(--sw-charcoal)]">Privacy</a>
          <a href="#" className="hover:text-[var(--sw-charcoal)]">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
