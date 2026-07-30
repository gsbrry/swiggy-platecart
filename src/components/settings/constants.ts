import {
  Flame,
  Heart,
  Home,
  Leaf,
  Moon,
  Shield,
  Sprout,
  TrendingDown,
  User,
  Users,
  Utensils,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type Goal = "loss" | "gain" | "maintain";
export type Diet = "veg" | "nonveg" | "vegan" | "keto" | "jain" | "glutenfree";
export type Household = 1 | 2 | 3 | 4;

export const GOAL_OPTIONS: Array<{ id: Goal; icon: LucideIcon; title: string; desc: string }> = [
  { id: "loss", icon: TrendingDown, title: "Lose Weight", desc: "Calorie-controlled" },
  { id: "gain", icon: Zap, title: "Gain Muscle", desc: "High-protein" },
  { id: "maintain", icon: Heart, title: "Stay Healthy", desc: "Balanced" },
];

export const DIET_OPTIONS: Array<{ id: Diet; icon: LucideIcon; title: string; desc: string }> = [
  { id: "veg", icon: Leaf, title: "Vegetarian", desc: "No meat · Eggs OK" },
  { id: "nonveg", icon: Utensils, title: "Non-Vegetarian", desc: "All proteins" },
  { id: "vegan", icon: Sprout, title: "Vegan", desc: "No animal products" },
  { id: "keto", icon: Flame, title: "Keto / Low-Carb", desc: "High fat, low carbs" },
  { id: "jain", icon: Moon, title: "Jain", desc: "No root vegetables" },
  { id: "glutenfree", icon: Shield, title: "Gluten-Free", desc: "No wheat, barley, rye" },
];

export const HH_OPTIONS: Array<{ id: Household; icon: LucideIcon; label: string; display: string }> = [
  { id: 1, icon: User, label: "Just me", display: "1" },
  { id: 2, icon: Users, label: "Two people", display: "2" },
  { id: 3, icon: Users, label: "Three people", display: "3" },
  { id: 4, icon: Home, label: "Family", display: "4+" },
];

export const EXCLUSION_OPTIONS: Array<{ id: string; label: string }> = [
  { id: "onion", label: "Onion & Garlic" },
  { id: "nuts", label: "Nuts" },
  { id: "dairy", label: "Dairy" },
  { id: "eggs", label: "Eggs" },
  { id: "fish", label: "Fish & Seafood" },
  { id: "pork", label: "Pork" },
  { id: "beef", label: "Beef" },
  { id: "gluten", label: "Gluten / Wheat" },
  { id: "mushroom", label: "Mushrooms" },
  { id: "soy", label: "Soy" },
];

export function formatRupees(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}
