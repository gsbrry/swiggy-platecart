"use client";

import { useState, useTransition } from "react";

import { updateProfile, updateSettings } from "@/lib/actions/profile";
import { DIET_LABEL, DIETS, type Diet } from "@/lib/labels";

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>;
}

export function ProfileForm({ initial }: { initial: { display_name: string; username: string; bio: string } }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateProfile(v);
          setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="display_name" className="label">Name</label>
          <input id="display_name" maxLength={60} value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} className="input" />
        </div>
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input id="username" maxLength={20} value={v.username} onChange={(e) => setV({ ...v, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="bio" className="label">About you <span className="font-normal text-ink-muted">(shown on your menus)</span></label>
        <textarea id="bio" rows={2} maxLength={280} value={v.bio} onChange={(e) => setV({ ...v, bio: e.target.value })} className="input py-2" />
      </div>
      <Status msg={msg} />
      <button className="btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

export function PreferencesForm({ initial }: { initial: { diet: Diet; exclusions: string[]; household_size: number } }) {
  const [diet, setDiet] = useState(initial.diet);
  const [household, setHousehold] = useState(initial.household_size);
  const [exclusions, setExclusions] = useState(initial.exclusions.join(", "));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateSettings({ diet, household_size: household, exclusions: exclusions.split(",") });
          setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pdiet" className="label">Diet</label>
          <select id="pdiet" value={diet} onChange={(e) => setDiet(e.target.value as Diet)} className="input">
            {DIETS.map((d) => (
              <option key={d} value={d}>{DIET_LABEL[d]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="household" className="label">People you cook for</label>
          <input id="household" type="number" min={1} max={12} value={household} onChange={(e) => setHousehold(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="exclusions" className="label">Never eat <span className="font-normal text-ink-muted">(comma separated)</span></label>
        <input id="exclusions" maxLength={300} value={exclusions} onChange={(e) => setExclusions(e.target.value)} className="input" placeholder="onion, garlic" />
      </div>
      <Status msg={msg} />
      <button className="btn-primary btn-sm" disabled={pending}>{pending ? "Saving…" : "Save preferences"}</button>
    </form>
  );
}
