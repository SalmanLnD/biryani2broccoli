export const MEALS = [
  { slot: "breakfast", label: "Breakfast", hint: "Morning plate" },
  { slot: "morning_snack", label: "Morning Snack", hint: "Mid-morning" },
  { slot: "lunch", label: "Lunch", hint: "Afternoon" },
  { slot: "evening_snack", label: "Evening Snack", hint: "Evening" },
  { slot: "dinner", label: "Dinner", hint: "Night" },
  { slot: "other", label: "Other", hint: "Anything else" },
];

export const UNITS = [
  "grams",
  "ounces",
  "piece",
  "bowl",
  "cup",
  "small",
  "medium",
  "large",
  "extra_large",
  "tablespoon",
  "teaspoon",
  "serving",
];

export const UNIT_LABEL = {
  grams: "grams",
  ounces: "ounces",
  piece: "pieces",
  bowl: "bowl",
  cup: "cup",
  small: "small",
  medium: "medium",
  large: "large",
  extra_large: "extra large",
  tablespoon: "tbsp",
  teaspoon: "tsp",
  serving: "serving",
};

export const ACTIVITY = [
  { id: "sedentary", label: "Sedentary", hint: "Desk work, little exercise" },
  { id: "light", label: "Lightly active", hint: "Walks or 1–3 sessions / week" },
  { id: "moderate", label: "Moderately active", hint: "3–5 sessions / week" },
  { id: "active", label: "Active", hint: "Daily training" },
  { id: "very_active", label: "Very active", hint: "Hard training, physical job" },
];

export const MUSCLES = ["all", "chest", "back", "shoulders", "arms", "legs", "cardio"];

export const EQUIPMENT = ["machine", "barbell", "dumbbell", "cable", "bodyweight", "smith_machine", "kettlebell", "band"];

export function todayKey() {
  const d = new Date();
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
}

export function startOfWeek(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toKey(d);
}

export function toKey(d) {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 10);
}

export function addDays(dateKey, n) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function formatDate(dateKey, opts) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, opts || { weekday: "short", day: "numeric", month: "short" });
}

export function formatNum(n, d = 0) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d });
}

export function scaleFood(food, quantity, unit) {
  const q = Number(quantity) || 0;
  let grams = q;
  if (unit === "ounces") grams = q * 28.3495;
  else if (unit !== "grams") grams = q * (food.servings?.[unit] || 1);
  const factor = grams / (food.baseAmountG || 100);
  const n = food.nutritionPer100g || {};
  const round = (v, p = 0) => Math.round((v || 0) * 10 ** p) / 10 ** p;
  return {
    grams: round(grams, 1),
    calories: round(n.calories * factor),
    protein: round(n.protein * factor, 1),
    carbs: round(n.carbs * factor, 1),
    fat: round(n.fat * factor, 1),
    fiber: round(n.fiber * factor, 1),
    sugar: round(n.sugar * factor, 1),
    sodium: round(n.sodium * factor),
  };
}
