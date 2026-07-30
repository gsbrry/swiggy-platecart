import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------- Enums ---------- */

export const goalEnum = pgEnum("goal", ["loss", "gain", "maintain"]);
export const dietTypeEnum = pgEnum("diet_type", [
  "veg",
  "nonveg",
  "vegan",
  "keto",
  "jain",
  "glutenfree",
]);
export const mealTypeEnum = pgEnum("meal_type", ["breakfast", "lunch", "dinner"]);
export const orderSourceEnum = pgEnum("order_source", ["instamart", "food"]);
export const wasteLevelEnum = pgEnum("waste_level", ["none", "some", "most"]);

/* ---------- Tables ---------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name"),
  goal: goalEnum("goal"),
  dietType: dietTypeEnum("diet_type"),
  // household_size 1..4+ enforced app-side
  householdSize: integer("household_size"),
  monthlyBudget: numeric("monthly_budget"),
  eatoutPerWeek: integer("eatout_per_week"),
  exclusions: text("exclusions").array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id),
  forkedFromId: uuid("forked_from_id"),
  dishName: text("dish_name").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
  isPublic: boolean("is_public").notNull().default(false),
  isPaid: boolean("is_paid").notNull().default(false),
  price: numeric("price").notNull().default("0"),
  forkCount: integer("fork_count").notNull().default(0),
  buyCount: integer("buy_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const templateIngredients = pgTable("template_ingredients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid("template_id")
    .notNull()
    .references(() => templates.id, { onDelete: "cascade" }),
  ingredientName: text("ingredient_name").notNull(),
  quantity: numeric("quantity"),
  unit: text("unit"),
  instamartSearchHint: text("instamart_search_hint"),
});

export const mealPlans = pgTable("meal_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  weekStart: date("week_start").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mealPlanSlots = pgTable("meal_plan_slots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  mealPlanId: uuid("meal_plan_id")
    .notNull()
    .references(() => mealPlans.id, { onDelete: "cascade" }),
  // day_of_week 1..7 enforced app-side
  dayOfWeek: integer("day_of_week").notNull(),
  mealType: mealTypeEnum("meal_type").notNull(),
  templateId: uuid("template_id").references(() => templates.id),
  isEatout: boolean("is_eatout").notNull().default(false),
});

export const ordersLog = pgTable("orders_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  orderedAt: timestamp("ordered_at", { withTimezone: true }).notNull().defaultNow(),
  totalAmount: numeric("total_amount"),
  source: orderSourceEnum("source").notNull(),
  templateIds: uuid("template_ids").array().notNull().default(sql`'{}'::uuid[]`),
});

export const wasteLog = pgTable("waste_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  ingredientName: text("ingredient_name").notNull(),
  wasteLevel: wasteLevelEnum("waste_level").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Relations ---------- */

export const usersRelations = relations(users, ({ many }) => ({
  templates: many(templates),
  mealPlans: many(mealPlans),
  orders: many(ordersLog),
  waste: many(wasteLog),
}));

export const templatesRelations = relations(templates, ({ one, many }) => ({
  creator: one(users, {
    fields: [templates.creatorId],
    references: [users.id],
  }),
  forkedFrom: one(templates, {
    fields: [templates.forkedFromId],
    references: [templates.id],
    relationName: "forked_from",
  }),
  ingredients: many(templateIngredients),
  slots: many(mealPlanSlots),
}));

export const templateIngredientsRelations = relations(templateIngredients, ({ one }) => ({
  template: one(templates, {
    fields: [templateIngredients.templateId],
    references: [templates.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  slots: many(mealPlanSlots),
}));

export const mealPlanSlotsRelations = relations(mealPlanSlots, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [mealPlanSlots.mealPlanId],
    references: [mealPlans.id],
  }),
  template: one(templates, {
    fields: [mealPlanSlots.templateId],
    references: [templates.id],
  }),
}));

export const ordersLogRelations = relations(ordersLog, ({ one }) => ({
  user: one(users, {
    fields: [ordersLog.userId],
    references: [users.id],
  }),
}));

export const wasteLogRelations = relations(wasteLog, ({ one }) => ({
  user: one(users, {
    fields: [wasteLog.userId],
    references: [users.id],
  }),
}));
