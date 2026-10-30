// Generated from the Supabase schema (supabase/migrations). Regenerate after schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type DietType = "veg" | "egg" | "nonveg" | "vegan" | "jain";
type MealType = "breakfast" | "lunch" | "dinner";
type MenuPeriod = "day" | "week" | "month";
type MenuVisibility = "private" | "link" | "public";
type ContentStatus = "active" | "hidden";
type ReportTarget = "menu" | "rating" | "dish";

type Table<Row, Required extends keyof Row, Rel = []> = {
  Row: Row;
  Insert: Partial<Row> & Pick<Row, Required>;
  Update: Partial<Row>;
  Relationships: Rel;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      admins: Table<{ user_id: string }, "user_id">;
      dish_ingredients: Table<
        {
          dish_id: string;
          id: string;
          name: string;
          position: number;
          quantity: number | null;
          unit: string | null;
        },
        "dish_id" | "name",
        [
          {
            foreignKeyName: "dish_ingredients_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ]
      >;
      dishes: Table<
        {
          cook_minutes: number | null;
          created_at: string;
          description: string | null;
          diet: DietType;
          fork_count: number;
          forked_from: string | null;
          id: string;
          is_public: boolean;
          meal_types: MealType[];
          name: string;
          owner_id: string | null;
          status: ContentStatus;
          steps: string | null;
          tags: string[];
          updated_at: string;
        },
        "name",
        [
          {
            foreignKeyName: "dishes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      menu_acquisitions: Table<
        { created_at: string; menu_id: string; start_date: string; user_id: string },
        "menu_id" | "start_date" | "user_id",
        [
          {
            foreignKeyName: "menu_acquisitions_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ]
      >;
      menu_items: Table<
        {
          day_index: number;
          dish_diet: DietType | null;
          dish_name: string | null;
          id: string;
          ingredients: Json;
          is_eatout: boolean;
          meal: MealType;
          menu_id: string;
          source_dish_id: string | null;
        },
        "day_index" | "meal" | "menu_id",
        [
          {
            foreignKeyName: "menu_items_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ]
      >;
      menu_ratings: Table<
        {
          created_at: string;
          id: string;
          menu_id: string;
          review: string | null;
          stars: number;
          status: ContentStatus;
          updated_at: string;
          user_id: string;
        },
        "menu_id" | "stars" | "user_id",
        [
          {
            foreignKeyName: "menu_ratings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_ratings_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ]
      >;
      menus: Table<
        {
          created_at: string;
          days: number;
          description: string | null;
          diet: DietType;
          get_count: number;
          id: string;
          owner_id: string | null;
          period: MenuPeriod;
          rating_avg: number;
          rating_count: number;
          slug: string;
          status: ContentStatus;
          tags: string[];
          title: string;
          updated_at: string;
          visibility: MenuVisibility;
        },
        "days" | "period" | "title",
        [
          {
            foreignKeyName: "menus_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ]
      >;
      plan_slots: Table<
        {
          date: string;
          dish_id: string | null;
          id: string;
          is_eatout: boolean;
          meal: MealType;
          note: string | null;
          updated_at: string;
          user_id: string;
        },
        "date" | "meal" | "user_id",
        [
          {
            foreignKeyName: "plan_slots_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
        ]
      >;
      profiles: Table<
        {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
          username: string | null;
        },
        "id"
      >;
      reports: Table<
        {
          created_at: string;
          id: string;
          reason: string;
          reporter_id: string;
          resolved: boolean;
          target_id: string;
          target_type: ReportTarget;
        },
        "reason" | "reporter_id" | "target_id" | "target_type"
      >;
      user_settings: Table<
        {
          diet: DietType | null;
          exclusions: string[];
          household_size: number;
          onboarded: boolean;
          updated_at: string;
          user_id: string;
          week_start: "mon" | "sun";
          default_visibility: MenuVisibility;
          weekday_max_minutes: number | null;
        },
        "user_id"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_set_status: {
        Args: { p_id: string; p_status: ContentStatus; p_type: ReportTarget };
        Returns: undefined;
      };
      create_menu_from_plan: {
        Args: {
          p_description: string;
          p_diet: DietType;
          p_period: MenuPeriod;
          p_start: string;
          p_tags: string[];
          p_title: string;
          p_visibility: MenuVisibility;
        };
        Returns: string;
      };
      admin_reports: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          target_type: ReportTarget;
          target_id: string;
          reason: string;
          created_at: string;
          label: string | null;
          target_status: ContentStatus | null;
          report_count: number;
        }[];
      };
      am_i_admin: { Args: Record<string, never>; Returns: boolean };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      fork_dish: { Args: { p_dish: string }; Returns: string };
      get_menu: { Args: { p_mode?: string; p_slug: string; p_start: string }; Returns: number };
      menu_by_slug: { Args: { p_slug: string }; Returns: Json };
      save_dish: { Args: { p_id: string | null; p_dish: Json; p_ingredients: Json }; Returns: string };
    };
    Enums: {
      content_status: ContentStatus;
      diet_type: DietType;
      meal_type: MealType;
      menu_period: MenuPeriod;
      menu_visibility: MenuVisibility;
      report_target: ReportTarget;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
