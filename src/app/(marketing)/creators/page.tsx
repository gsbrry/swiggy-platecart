import Link from "next/link";
import { Check, Link2, Star, Store, Users } from "lucide-react";

export const metadata = {
  title: "For home cooks",
  description: "Publish your day, week or month of meals on Planetto. Others copy it into their plan and rate it.",
};

const STEPS: [string, string][] = [
  ["Plan a week you're proud of", "Use your own dishes and recipes. Add ingredients so people get a shopping list."],
  ["Tap Share or publish", "Choose a day or the whole week, give it a title, a short description and up to three tags."],
  ["Pick who can see it", "Keep it private, share a link with your followers, or list it in the Market for everyone."],
  ["Watch it travel", "See how many people used it and what they rated it. Update your profile so they can find more."],
];

const RULES = [
  "Share your own plans, or credit the cook whose recipe you used.",
  "No medical promises. A menu is an idea, not a diet prescription.",
  "No links, phone numbers or ads inside menus or reviews.",
  "Be kind in reviews. Reports are checked within 48 hours.",
];

export default function CreatorsPage() {
  return (
    <>
      <section className="mx-auto max-w-app px-4 pb-16 pt-12 sm:px-6 lg:pt-20">
        <p className="text-sm font-semibold text-ink-orange">For home cooks, nutritionists and coaches</p>
        <h1 className="mt-3 max-w-3xl text-balance text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
          Your week of meals, <span className="text-accent">in other people&apos;s kitchens.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-muted">
          You already send meal plans as images on WhatsApp and Instagram. On Planetto, people can copy your plan straight into their calendar, get the shopping list, and tell you how it went.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up" className="btn-primary h-[52px] px-7 text-base">Start publishing, free</Link>
          <Link href="/market" className="btn-secondary h-[52px] px-7 text-base">See the Market</Link>
        </div>
      </section>

      <section aria-labelledby="why" className="border-y border-hairline bg-white/60">
        <div className="mx-auto grid max-w-app gap-10 px-4 py-16 sm:px-6 lg:grid-cols-3">
          <h2 id="why" className="sr-only">Why publish on Planetto</h2>
          {(
            [
              [Link2, "One link, not ten screenshots", "Your menu page shows every day, works on any phone and previews nicely in WhatsApp."],
              [Users, "People actually cook it", "“Use this menu” drops your plan into their week with the ingredients ready to buy."],
              [Star, "Honest ratings", "Only people who used your menu can rate it, once each. No fake five stars."],
            ] as const
          ).map(([Icon, title, body]) => (
            <div key={title}>
              <Icon aria-hidden className="h-7 w-7 text-ink-orange" />
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="how" className="mx-auto max-w-app px-4 py-20 sm:px-6">
        <h2 id="how" className="text-[32px] font-semibold leading-tight sm:text-[40px]">How publishing works</h2>
        <ol className="mt-10 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[image:var(--action)] font-bold text-white">{i + 1}</span>
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1.5 max-w-md text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="money" className="mx-auto max-w-app px-4 pb-20 sm:px-6">
        <div className="glass grid gap-8 p-8 sm:p-10 lg:grid-cols-2">
          <div>
            <Store aria-hidden className="h-8 w-8 text-ink-orange" />
            <h2 id="money" className="mt-4 text-[28px] font-semibold leading-tight">Can I charge for my menus?</h2>
            <p className="mt-3 text-ink-muted">
              Not yet. Every menu is free while we grow the community. Paid menus are on our roadmap for cooks whose menus people use and rate highly. We&apos;ll announce the terms before anything changes, and menus you&apos;ve already published stay free unless you choose otherwise.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Community rules</h3>
            <ul className="mt-3 space-y-2.5">
              {RULES.map((r) => (
                <li key={r} className="flex items-start gap-2.5">
                  <Check aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <Link href="/terms" className="mt-4 inline-block font-medium text-ink-orange underline">Read the full terms</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-app px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start gap-6 border-t border-hairline pt-12 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">Got a week your friends keep asking about?</h2>
          <Link href="/sign-up" className="btn-primary h-[52px] shrink-0 px-8 text-base">Publish it</Link>
        </div>
      </section>
    </>
  );
}
