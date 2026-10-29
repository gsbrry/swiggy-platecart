"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check, Download, LogOut, Trash2, X, Tag } from "lucide-react";

import { ConfirmModal } from "./confirm-modal";
import {
  DIET_OPTIONS,
  EXCLUSION_OPTIONS,
  GOAL_OPTIONS,
  HH_OPTIONS,
  formatRupees,
  type Diet,
  type Goal,
  type Household,
} from "./constants";

type Props = {
  initialName: string;
  initialGoal: Goal | null;
  initialDiet: Diet | null;
  initialHousehold: number | null;
  initialBudget: number;
  initialEatout: number;
  initialExclusions: string[];
  isMock: boolean;
};

type PrefsState = {
  goal: Goal | null;
  diet: Diet | null;
  household: Household | null;
  budget: number;
  eatout: number;
  exclusions: string[];
};

type NotificationsState = {
  restock: boolean;
  waste: boolean;
  publicTemplates: boolean;
};

function coerceHh(n: number | null): Household | null {
  if (n === null) return null;
  if (n >= 4) return 4;
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

function sameArr(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

export function SettingsForm(props: Props) {
  const initialPrefs = useMemo<PrefsState>(
    () => ({
      goal: props.initialGoal,
      diet: props.initialDiet,
      household: coerceHh(props.initialHousehold),
      budget: props.initialBudget,
      eatout: props.initialEatout,
      exclusions: props.initialExclusions,
    }),
    [props],
  );

  const [prefs, setPrefs] = useState<PrefsState>(initialPrefs);
  const [savedPrefs, setSavedPrefs] = useState<PrefsState>(initialPrefs);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [notifications, setNotifications] = useState<NotificationsState>({
    restock: true,
    waste: true,
    publicTemplates: false,
  });
  const [savedNotifications, setSavedNotifications] = useState<NotificationsState>({
    restock: true,
    waste: true,
    publicTemplates: false,
  });

  const [toast, setToast] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const prefsDirty =
    prefs.goal !== savedPrefs.goal ||
    prefs.diet !== savedPrefs.diet ||
    prefs.household !== savedPrefs.household ||
    prefs.budget !== savedPrefs.budget ||
    prefs.eatout !== savedPrefs.eatout ||
    !sameArr(prefs.exclusions, savedPrefs.exclusions);

  const notificationsDirty =
    notifications.restock !== savedNotifications.restock ||
    notifications.waste !== savedNotifications.waste ||
    notifications.publicTemplates !== savedNotifications.publicTemplates;

  const savePrefs = useCallback(async () => {
    const payload = {
      goal: prefs.goal,
      diet_type: prefs.diet,
      household_size: prefs.household,
      monthly_budget: prefs.budget,
      eatout_per_week: prefs.eatout,
      exclusions: prefs.exclusions,
    };
    if (props.isMock) {
      // eslint-disable-next-line no-console
      console.log("[settings] mock PATCH /api/user/profile", payload);
      setSavedPrefs(prefs);
      showToast("Saved");
      return;
    }
    setSavingPrefs(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSavedPrefs(prefs);
        showToast("Saved");
      } else {
        showToast("Could not save");
      }
    } catch {
      showToast("Could not save");
    } finally {
      setSavingPrefs(false);
    }
  }, [prefs, props.isMock, showToast]);

  const saveNotifications = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[settings] save notifications", notifications);
    setSavedNotifications(notifications);
    showToast("Saved");
  }, [notifications, showToast]);

  const onSignOut = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[settings] sign out");
    showToast("Signed out (mock)");
  }, [showToast]);

  const onDownload = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[settings] download my data");
    showToast("Data export requested");
  }, [showToast]);

  const onConfirmDelete = useCallback(() => {
    // eslint-disable-next-line no-console
    console.log("[settings] delete account confirmed");
    setDeleteOpen(false);
    showToast("Account deletion requested");
  }, [showToast]);

  return (
    <div className="mx-auto max-w-[760px] px-6 py-8">
      <header className="mb-6">
        <h1 className="text-[24px] font-bold tracking-tight text-[var(--sw-charcoal)]">Settings</h1>
        <p className="mt-1 text-[13px] text-[var(--sw-muted)]">
          Manage your profile, meal preferences, notifications and account.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        <ProfileCard
          name={props.initialName}
          email="raphy@example.com"
          onSignOut={onSignOut}
        />

        <PreferencesCard
          prefs={prefs}
          setPrefs={setPrefs}
          dirty={prefsDirty}
          saving={savingPrefs}
          onSave={savePrefs}
        />

        <NotificationsCard
          state={notifications}
          setState={setNotifications}
          dirty={notificationsDirty}
          onSave={saveNotifications}
        />

        <PrivacyCard onDownload={onDownload} onDelete={() => setDeleteOpen(true)} />

        <AboutCard />
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-[300] -translate-x-1/2 rounded-lg bg-[var(--sw-charcoal)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg"
        >
          {toast}
        </div>
      )}

      {deleteOpen && (
        <ConfirmModal
          title="Delete account?"
          description="This will permanently delete your profile, templates and meal history. This action cannot be undone."
          confirmLabel="Delete account"
          onClose={() => setDeleteOpen(false)}
          onConfirm={onConfirmDelete}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card shell
// ─────────────────────────────────────────────────────────────

function Card({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-xl glass p-5">
      <div className="mb-4">
        <h2 className="text-[15px] font-bold text-[var(--sw-charcoal)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--sw-muted)]">{description}</p>
        )}
      </div>
      <div>{children}</div>
      {footer && <div className="mt-4 flex justify-end">{footer}</div>}
    </section>
  );
}

function SaveButton({
  dirty,
  saving,
  onClick,
}: {
  dirty: boolean;
  saving?: boolean;
  onClick: () => void;
}) {
  const disabled = !dirty || Boolean(saving);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-[13px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
        disabled
          ? "cursor-not-allowed border-[1.5px] border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-muted)]"
          : "bg-appetite text-white hover:opacity-90"
      }`}
    >
      {saving ? "Saving…" : "Save changes"}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────

function ProfileCard({
  name,
  email,
  onSignOut,
}: {
  name: string;
  email: string;
  onSignOut: () => void;
}) {
  return (
    <Card title="Profile" description="Basic account information.">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="settings-name"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--sw-muted)]"
          >
            Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            readOnly
            aria-readonly="true"
            className="w-full cursor-not-allowed rounded-lg border border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2 text-[13px] text-[var(--sw-charcoal)]"
          />
        </div>
        <div>
          <label
            htmlFor="settings-email"
            className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[var(--sw-muted)]"
          >
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            placeholder={email}
            readOnly
            aria-readonly="true"
            className="w-full cursor-not-allowed rounded-lg border border-[var(--sw-border)] bg-[var(--sw-page)] px-3 py-2 text-[13px] text-[var(--sw-muted)]"
          />
        </div>
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3.5 py-2 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// Preferences
// ─────────────────────────────────────────────────────────────

function PreferencesCard({
  prefs,
  setPrefs,
  dirty,
  saving,
  onSave,
}: {
  prefs: PrefsState;
  setPrefs: (updater: (p: PrefsState) => PrefsState) => void;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Card
      title="Meal preferences"
      description="These drive your grocery list, template filtering and budget tracking."
      footer={<SaveButton dirty={dirty} saving={saving} onClick={onSave} />}
    >
      <SubBlock label="Health goal">
        <div role="radiogroup" aria-label="Health goal" className="grid grid-cols-3 gap-2">
          {GOAL_OPTIONS.map((opt) => {
            const isSel = prefs.goal === opt.id;
            const Icon = opt.icon;
            return (
              <RadioTile
                key={opt.id}
                selected={isSel}
                onSelect={() => setPrefs((p) => ({ ...p, goal: opt.id }))}
                ariaLabel={opt.title}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-muted)]"}`}
                    strokeWidth={1.75}
                  />
                  <div className="text-[12.5px] font-bold text-[var(--sw-charcoal)]">
                    {opt.title}
                  </div>
                </div>
                <div className="mt-0.5 text-[10.5px] text-[var(--sw-muted)]">{opt.desc}</div>
              </RadioTile>
            );
          })}
        </div>
      </SubBlock>

      <SubBlock label="Diet type">
        <div role="radiogroup" aria-label="Diet type" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DIET_OPTIONS.map((opt) => {
            const isSel = prefs.diet === opt.id;
            const Icon = opt.icon;
            return (
              <RadioTile
                key={opt.id}
                selected={isSel}
                onSelect={() => setPrefs((p) => ({ ...p, diet: opt.id }))}
                ariaLabel={opt.title}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-muted)]"}`}
                    strokeWidth={1.75}
                  />
                  <div className="text-[12.5px] font-bold text-[var(--sw-charcoal)]">
                    {opt.title}
                  </div>
                </div>
                <div className="mt-0.5 text-[10.5px] text-[var(--sw-muted)]">{opt.desc}</div>
              </RadioTile>
            );
          })}
        </div>
      </SubBlock>

      <SubBlock label="Household size">
        <div role="radiogroup" aria-label="Household size" className="flex gap-2">
          {HH_OPTIONS.map((opt) => {
            const isSel = prefs.household === opt.id;
            const Icon = opt.icon;
            return (
              <RadioTile
                key={opt.id}
                selected={isSel}
                onSelect={() => setPrefs((p) => ({ ...p, household: opt.id }))}
                ariaLabel={opt.label}
                className="flex-1"
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-muted)]"}`}
                    strokeWidth={1.75}
                  />
                  <span
                    className={`text-[15px] font-bold ${
                      isSel ? "text-[var(--sw-orange)]" : "text-[var(--sw-charcoal)]"
                    }`}
                  >
                    {opt.display}
                  </span>
                </div>
                <div className="mt-0.5 text-center text-[10.5px] text-[var(--sw-muted)]">
                  {opt.label}
                </div>
              </RadioTile>
            );
          })}
        </div>
      </SubBlock>

      <SubBlock label="Monthly budget">
        <div className="flex items-center gap-3">
          <input
            id="settings-budget"
            type="range"
            min={1000}
            max={20000}
            step={500}
            value={prefs.budget}
            onChange={(e) => setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))}
            aria-label="Monthly budget"
            aria-valuemin={1000}
            aria-valuemax={20000}
            aria-valuenow={prefs.budget}
            className="h-1 flex-1 accent-[var(--sw-orange)]"
          />
          <div
            aria-live="polite"
            className="min-w-[75px] text-right text-[15px] font-bold text-[var(--sw-orange)]"
          >
            {formatRupees(prefs.budget)}
          </div>
        </div>
        <label htmlFor="settings-budget" className="sr-only">
          Monthly budget in rupees
        </label>
      </SubBlock>

      <SubBlock label="Eat-outs per week">
        <div className="flex items-center gap-3">
          <input
            id="settings-eatout"
            type="range"
            min={0}
            max={7}
            step={1}
            value={prefs.eatout}
            onChange={(e) => setPrefs((p) => ({ ...p, eatout: Number(e.target.value) }))}
            aria-label="Eat-outs per week"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={prefs.eatout}
            className="h-1 flex-1 accent-[var(--sw-orange)]"
          />
          <div
            aria-live="polite"
            className="min-w-[75px] text-right text-[15px] font-bold text-[var(--sw-orange)]"
          >
            {prefs.eatout}/week
          </div>
        </div>
        <label htmlFor="settings-eatout" className="sr-only">
          Eat-outs per week
        </label>
      </SubBlock>

      <SubBlock label="Ingredient exclusions">
        <div className="flex flex-wrap gap-[7px]">
          {EXCLUSION_OPTIONS.map((opt) => {
            const isSel = prefs.exclusions.includes(opt.id);
            return (
              <ChipToggle
                key={opt.id}
                selected={isSel}
                label={opt.label}
                onToggle={() =>
                  setPrefs((p) => ({
                    ...p,
                    exclusions: isSel
                      ? p.exclusions.filter((x) => x !== opt.id)
                      : [...p.exclusions, opt.id],
                  }))
                }
              />
            );
          })}
        </div>
        <div className="mt-2 text-[11px] text-[var(--sw-muted)]">
          {prefs.exclusions.length === 0
            ? "No exclusions — showing all recipes"
            : `${prefs.exclusions.length} exclusion${prefs.exclusions.length > 1 ? "s" : ""} selected`}
        </div>
      </SubBlock>
    </Card>
  );
}

function SubBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--sw-muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function RadioTile({
  selected,
  onSelect,
  ariaLabel,
  children,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onSelect();
    }
  };
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`cursor-pointer rounded-lg border-[1.5px] p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
        selected
          ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)]"
          : "border-[var(--sw-border)] bg-white/70 backdrop-blur-md hover:border-[#C0C0C4] hover:bg-[#FAFAFA]"
      } ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ChipToggle({
  selected,
  label,
  onToggle,
}: {
  selected: boolean;
  label: string;
  onToggle: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle();
    }
  };
  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      className={`flex cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3 py-[6px] text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
        selected
          ? "border-[var(--sw-orange)] bg-[var(--sw-orange-tint)] text-[var(--sw-orange)]"
          : "border-[var(--sw-border)] bg-[var(--sw-page)] text-[var(--sw-charcoal)] hover:border-[#C0C0C4] hover:bg-[#EAEAEE]"
      }`}
    >
      {selected ? (
        <X className="h-3.5 w-3.5 text-[var(--sw-orange)]" strokeWidth={1.75} />
      ) : (
        <Tag className="h-3.5 w-3.5 text-[var(--sw-muted)]" strokeWidth={1.75} />
      )}
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────────────────────

function NotificationsCard({
  state,
  setState,
  dirty,
  onSave,
}: {
  state: NotificationsState;
  setState: (updater: (s: NotificationsState) => NotificationsState) => void;
  dirty: boolean;
  onSave: () => void;
}) {
  const rows: Array<{ key: keyof NotificationsState; title: string; desc: string }> = [
    {
      key: "restock",
      title: "Restock reminders",
      desc: "Nudge me when my 3-day cycle is nearly out.",
    },
    {
      key: "waste",
      title: "Weekly waste digest",
      desc: "Sunday email summarising ingredients you didn't use.",
    },
    {
      key: "publicTemplates",
      title: "New public template alerts",
      desc: "Notify me when new community templates match my diet.",
    },
  ];
  return (
    <Card
      title="Notifications"
      description="Choose which reminders you'd like to receive."
      footer={<SaveButton dirty={dirty} onClick={onSave} />}
    >
      <ul className="divide-y divide-[var(--sw-border)]">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="pr-4">
              <div className="text-[13px] font-semibold text-[var(--sw-charcoal)]">{r.title}</div>
              <div className="text-[11.5px] text-[var(--sw-muted)]">{r.desc}</div>
            </div>
            <Toggle
              checked={state[r.key]}
              label={r.title}
              onChange={() => setState((s) => ({ ...s, [r.key]: !s[r.key] }))}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange();
    }
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      onKeyDown={onKeyDown}
      className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2 ${
        checked ? "bg-appetite" : "bg-[var(--sw-border)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white/70 backdrop-blur-md shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Privacy
// ─────────────────────────────────────────────────────────────

function PrivacyCard({
  onDownload,
  onDelete,
}: {
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <Card title="Privacy" description="Export your data or delete your account.">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[var(--sw-border)] bg-white/70 backdrop-blur-md px-3.5 py-2 text-[13px] font-semibold text-[var(--sw-charcoal)] transition hover:bg-[var(--sw-page)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] focus-visible:ring-offset-2"
        >
          <Download className="h-4 w-4" />
          Download my data
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-[#F5C5C5] bg-white/70 backdrop-blur-md px-3.5 py-2 text-[13px] font-semibold text-[#DC2626] transition hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] focus-visible:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete account
        </button>
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// About
// ─────────────────────────────────────────────────────────────

function AboutCard() {
  return (
    <Card title="About">
      <dl className="grid grid-cols-2 gap-y-2 text-[13px]">
        <dt className="text-[var(--sw-muted)]">App</dt>
        <dd className="font-semibold text-[var(--sw-charcoal)]">PlateCart</dd>
        <dt className="text-[var(--sw-muted)]">Version</dt>
        <dd className="font-semibold text-[var(--sw-charcoal)]">0.1.0</dd>
        <dt className="text-[var(--sw-muted)]">Build</dt>
        <dd className="font-semibold text-[var(--sw-charcoal)]">
          <span className="inline-flex items-center gap-1">
            <Check className="h-3 w-3 text-[var(--sw-green)]" />
            Mock preview
          </span>
        </dd>
      </dl>
      <div className="mt-4 flex gap-4 text-[12.5px]">
        <a
          href="#"
          className="text-[var(--sw-orange)] underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] rounded"
        >
          Terms of service
        </a>
        <a
          href="#"
          className="text-[var(--sw-orange)] underline underline-offset-2 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sw-orange)] rounded"
        >
          Privacy policy
        </a>
      </div>
    </Card>
  );
}
