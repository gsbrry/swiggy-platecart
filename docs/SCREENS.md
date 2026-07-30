# Screens

Ten Phase 1 screens. Each page under `src/app/` is a stub Server Component that
lists the APIs it will call. The Vercel team can start building any of them in
parallel.

## Screen → route → APIs

| # | Screen | Route | APIs called |
|---|--------|-------|-------------|
| 1 | Dashboard | `/` | `GET /api/user/profile`, `GET /api/meal-plans/current`, `GET /api/budget/summary`, `GET /api/waste/patterns` |
| 2 | Onboarding (5-step) | `/onboarding` | `PATCH /api/user/profile` |
| 3 | Weekly meal plan | `/meal-plan` | `GET /api/meal-plans/current`, `PATCH /api/meal-plans/[id]/slots`, `GET /api/templates`, `POST /api/templates/[id]/fork`, `POST /api/cart/build` |
| 4 | Template browser | `/templates` | `GET /api/templates` |
| 5 | Template detail | `/templates/[id]` | `GET /api/templates/[id]`, `POST /api/templates/[id]/fork` |
| 6 | Create template | `/templates/new` | `POST /api/templates` |
| 7 | My templates | `/my-templates` | `GET /api/templates?creator_id=me` |
| 8 | Cart preview | `/cart` | `POST /api/cart/build`, `POST /api/cart/add-to-instamart` |
| 9 | Budget tracker | `/budget` | `GET /api/budget/summary` |
| 10 | Settings | `/settings` | `GET /api/user/profile`, `PATCH /api/user/profile` |

## Source mockups in `/docs/screens`

Note: only four of the ten screens have committed HTML mockups today; screens
5–10 need mockups before UI work starts.

| Mockup file | Maps to screen |
|-------------|----------------|
| `Screen_01_dashboard.html` | 1. Dashboard |
| `Screen_02_onboarding.html`, `S02_v2.html` | 2. Onboarding (v2 is the latest iteration) |
| `Screen_03_meal_plan.html` | 3. Weekly meal plan |
| `Screen_04_template_browser.html` | 4. Template browser |
| `s05.html` | 5. Template detail (draft) |
| `s06.html`, `s06v2_stable.html` | 6. Create template (v2_stable is the latest) |
| _(missing)_ | 7. My templates |
| _(missing)_ | 8. Cart preview |
| _(missing)_ | 9. Budget tracker |
| _(missing)_ | 10. Settings |
