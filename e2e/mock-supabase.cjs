// Minimal Supabase stand-in for UI tests: Auth getUser + the PostgREST/RPC calls Planetto makes.
// Fixture data comes from the seed (e2e/fixtures/seed.json, generated from supabase/seed/build_seed.py).
// Tokens are unsigned HS256 JWTs; supabase-js validates them by calling /auth/v1/user, answered here.
// A token whose sub is NEW_UID behaves like a brand-new user who hasn't finished onboarding.
const http = require("http");
const seed = require("./fixtures/seed.json");
const NEW_UID = "33333333-3333-4333-8333-333333333333";
const PORT = Number(process.env.MOCK_SUPABASE_PORT || 54321);
const UID = "11111111-1111-4111-8111-111111111111";
const today = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date()) + "T00:00:00Z");
const iso = (d) => d.toISOString().slice(0, 10);
const add = (n) => { const d = new Date(today); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const monday = (() => { const dow = today.getUTCDay(); return -((dow + 6) % 7); })();
const meals = ["breakfast", "lunch", "dinner"];

const dishes = seed.dishes.map(([name, mt, diet, min, tags, ing], i) => ({
  id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
  name, meal_types: mt, diet, cook_minutes: min, tags, owner_id: i % 9 === 0 ? UID : null, is_public: true, status: "active",
  fork_count: (i * 7) % 13, description: i % 9 === 0 ? "My mother's recipe, slightly less oil." : null,
  steps: "1. Wash and prep the vegetables.\n2. Temper spices in ghee.\n3. Cook until done and garnish with coriander.",
  forked_from: null,
  dish_ingredients: ing.split(";").map((p, k) => { const b = p.trim().split(" "); const unit = b.pop(); const q = Number(b.pop()); return { name: b.join(" "), quantity: q, unit, position: k }; }),
  owner: i % 9 === 0 ? { display_name: "Raphy Varghese", username: "raphy" } : null,
}));
const byName = Object.fromEntries(dishes.map((d) => [d.name, d]));
const week = seed.menus[0][5];
const slots = [];
week.forEach((row, di) => row.forEach((dish, mi) => {
  if (di === 4 && mi === 1) return; // a gap
  if (di === 6) return; // empty Sunday
  const d = dish === "EAT" ? null : byName[dish];
  slots.push({ date: add(monday + di), meal: meals[mi], is_eatout: dish === "EAT", dish: d && { id: d.id, name: d.name, diet: d.diet, cook_minutes: d.cook_minutes,
    dish_ingredients: d.dish_ingredients } });
}));
const menus = seed.menus.map(([title, desc, period, diet, tags, days], i) => ({
  id: `22222222-0000-4000-8000-${String(i).padStart(12, "0")}`, slug: `menuslug${i}x`, title, description: desc, period, days: days.length, diet, tags,
  visibility: "public", status: "active", rating_avg: [4.6, 4.8, 4.4, 4.1, 0, 3.9, 4.7, 4.2, 4.9, 4.5][i], rating_count: [23, 41, 12, 8, 0, 5, 19, 6, 31, 9][i],
  get_count: [140, 212, 64, 51, 3, 22, 88, 30, 175, 47][i], created_at: new Date().toISOString(),
  owner: i === 1 ? { display_name: "Meena Iyer" } : i === 6 ? { display_name: "Raphy Varghese" } : null, owner_id: i === 6 ? UID : null,
  items: days.flatMap((row, di) => row.map((dish, mi) => ({ id: `${i}-${di}-${mi}`, day_index: di, meal: meals[mi], is_eatout: dish === "EAT", dish_name: dish === "EAT" ? null : dish, dish_diet: dish === "EAT" ? null : byName[dish]?.diet, ingredients: [] }))),
}));
const profile = { id: UID, username: "raphy", display_name: "Raphy Varghese", bio: "Home cook in Kochi.", avatar_url: null };
const settings = { diet: "veg", exclusions: ["onion"], household_size: 3, onboarded: true, week_start: "mon", default_visibility: "link", weekday_max_minutes: 30 };
const newSettings = { diet: null, exclusions: [], household_size: 2, onboarded: false, week_start: "mon", default_visibility: "link", weekday_max_minutes: null };
function subOf(req) {
  const auth = req.headers.authorization || "";
  try { return JSON.parse(Buffer.from(auth.split(".")[1], "base64url").toString()).sub; } catch { return null; }
}
const ratings = [
  { id: "r1", stars: 5, review: "Made Sunday planning painless. The khichdi night is a family favourite now.", created_at: new Date(Date.now() - 864e5 * 3).toISOString(), user_id: "u2", author: { display_name: "Priya S" } },
  { id: "r2", stars: 4, review: "Good variety. I swapped the paneer for tofu twice.", created_at: new Date(Date.now() - 864e5 * 9).toISOString(), user_id: "u3", author: { display_name: "Arjun K" } },
];

function json(res, code, body, headers = {}) {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
}
function eqParam(u, key) { const v = u.searchParams.get(key); return v && v.startsWith("eq.") ? v.slice(3) : null; }

http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const single = (req.headers.accept || "").includes("vnd.pgrst.object");
  const send = (rows) => (single ? (rows.length ? json(res, 200, rows[0]) : json(res, 406, { code: "PGRST116", message: "no rows" })) : json(res, 200, rows, { "content-range": `0-${rows.length - 1}/${rows.length}` }));
  const p = u.pathname;
  const sub = subOf(req);
  if (p === "/auth/v1/user") return sub ? json(res, 200, { id: sub, aud: "authenticated", role: "authenticated", email: "raphy@example.com", user_metadata: { full_name: "Raphy Varghese" }, identities: [{ provider: "email" }, { provider: "google" }] }) : json(res, 401, { msg: "no" });
  if (p.startsWith("/rest/v1/rpc/")) {
    const fn = p.split("/").pop();
    let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
      const args = body ? JSON.parse(body) : {};
      if (fn === "am_i_admin") return json(res, 200, true);
      if (fn === "menu_by_slug") { const m = menus.find((x) => x.slug === args.p_slug); if (!m) return json(res, 200, null); const { items, owner, ...menu } = m; return json(res, 200, { menu, owner: owner ?? { display_name: "Planetto Kitchen", username: null }, is_owner: m.owner_id === UID, items }); }
      if (fn === "admin_reports") return json(res, 200, [{ id: "rp1", target_type: "menu", target_id: menus[5].id, reason: "Copied from my Instagram without credit", created_at: new Date().toISOString(), label: menus[5].title + " (/m/menuslug5x)", target_status: "active", report_count: 2 }]);
      return json(res, 200, null);
    });
    return;
  }
  if (!p.startsWith("/rest/v1/")) return json(res, 404, {});
  const table = p.split("/").pop();
  if (req.method !== "GET" && req.method !== "HEAD") return json(res, 201, null);
  const id = eqParam(u, "id");
  switch (table) {
    case "profiles": return send([sub === NEW_UID ? { ...profile, id: NEW_UID, username: null, display_name: "Asha Rao" } : profile]);
    case "user_settings": return send([sub === NEW_UID ? newSettings : settings]);
    case "plan_slots": {
      const gte = (u.searchParams.getAll("date").find((x) => x.startsWith("gte.")) || "gte.0000").slice(4);
      const lte = (u.searchParams.getAll("date").find((x) => x.startsWith("lte.")) || "lte.9999").slice(4);
      return send(slots.filter((s) => s.date >= gte && s.date <= lte));
    }
    case "dishes": {
      if (req.method === "HEAD") return json(res, 200, undefined, { "content-range": "0-4/5" });
      if (id) return send(dishes.filter((d) => d.id === id));
      let rows = dishes;
      if (u.searchParams.get("owner_id") === "is.null") rows = rows.filter((d) => !d.owner_id);
      if (eqParam(u, "owner_id")) rows = rows.filter((d) => d.owner_id === UID);
      if (eqParam(u, "diet")) rows = rows.filter((d) => d.diet === eqParam(u, "diet"));
      const name = u.searchParams.get("name"); if (name) { const q = name.replace(/^ilike\.|%|\*/g, "").toLowerCase(); rows = rows.filter((d) => d.name.toLowerCase().includes(q)); }
      return send(rows);
    }
    case "menus": {
      let rows = menus.map(({ items, ...m }) => m);
      if (eqParam(u, "period")) rows = rows.filter((m) => m.period === eqParam(u, "period"));
      if (eqParam(u, "owner_id")) rows = rows.filter((m) => m.owner_id === UID);
      if (eqParam(u, "diet")) rows = rows.filter((m) => m.diet === eqParam(u, "diet"));
      const cs = u.searchParams.get("tags"); // tags=cs.{a,b}
      if (cs) { const want = cs.replace(/^cs\.\{|\}$/g, "").split(",").map((t) => t.replace(/"/g, "")); rows = rows.filter((m) => want.every((t) => m.tags.includes(t))); }
      return send(rows);
    }
    case "menu_items": return send(menus.flatMap((m) => m.items.filter((it) => it.day_index === 0).map((it) => ({ ...it, menu_id: m.id }))));
    case "menu_ratings": return send(ratings);
    case "menu_acquisitions": {
      if (eqParam(u, "menu_id")) return send(eqParam(u, "menu_id") === menus[1].id ? [{ start_date: add(1) }] : []);
      return send([1, 8].map((i) => ({ start_date: add(1), menu: (({ items, ...m }) => m)(menus[i]) })));
    }
    default: return send([]);
  }
}).listen(PORT, () => console.log(`mock supabase on ${PORT}`));
