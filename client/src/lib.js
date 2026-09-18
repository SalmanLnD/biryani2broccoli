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
  "chutney_bowl",
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
  chutney_bowl: "chutney bowl",
  cup: "cup",
  small: "small",
  medium: "medium",
  large: "large",
  extra_large: "extra large",
  tablespoon: "tbsp",
  teaspoon: "tsp",
  serving: "serving",
};

export const TIPS = {
  tdee: "TDEE is an estimate of how many calories you typically burn in a day. It is BMR multiplied by your selected activity level.",
  bmr: "BMR is an estimate of calories your body uses at rest. TDEE then adds typical daily activity on top of that.",
  deficit: "Estimated deficit is maintenance calories minus food eaten. A positive number means you ate less than maintenance. It is an estimate, not a guarantee of fat loss.",
  activity: "Steps, walking, and workout active calories are tracked for reference. They are not added on top of TDEE in the recommended calculation.",
  doubleCount: "Adding walking or workout calories on top of TDEE would count typical activity twice, because TDEE already includes your activity level.",
  method: "TDEE-based calculation is simpler and helps prevent double-counting activity when your activity level is already included in TDEE.",
  activeCalories: "Estimated active calories based on your body weight, workout duration and exercise intensity. Actual calorie burn varies by person.",
  walkingCalories: "Estimated active calories from walking based on your steps, body weight, height and walking intensity. Actual calorie burn varies by pace and individual.",
  goal: "These numbers are targets from your current weight, goal weight, and date. They are not guaranteed outcomes.",
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

export function formatActiveKcal(n, step = 10) {
  const rounded = Math.round((Number(n) || 0) / step) * step;
  return `~${formatNum(rounded)}`;
}

export function calculateWalkingCalories({
  steps = 0,
  weightKg,
  heightCm,
  sex,
  durationMinutes,
  intensity,
  speedKmh,
} = {}) {
  const n = Math.max(0, Number(steps) || 0);
  const weight = Number(weightKg) || 0;
  const minutes = Number(durationMinutes) || 0;
  const heightM = (Number(heightCm) || 0) / 100;
  const sexId = String(sex || "").toLowerCase();
  const factor = sexId === "male" ? 0.415 : sexId === "female" ? 0.413 : 0.414;
  let strideM = heightM > 0 ? heightM * factor : 0;
  let strideEstimated = false;
  if (n > 0 && strideM <= 0) {
    strideM = 0.762;
    strideEstimated = true;
  }
  const distanceKm = n > 0 && strideM > 0 ? (n * strideM) / 1000 : 0;
  const mets = { slow: 2.8, light: 2.8, normal: 3.3, moderate: 3.3, brisk: 4.3, very_brisk: 5.0, vigorous: 5.0 };
  const speed = Number(speedKmh) || (minutes > 0 && distanceKm > 0 ? distanceKm / (minutes / 60) : 0);

  if (minutes > 0 && weight > 0) {
    let met = mets[String(intensity || "normal").toLowerCase().replace(/\s+/g, "_")] || 3.3;
    if (speed > 0) {
      if (speed < 4) met = 2.8;
      else if (speed < 5) met = 3.3;
      else if (speed < 6.4) met = 4.3;
      else met = 5.0;
    }
    const total = ((met * 3.5 * weight) / 200) * minutes;
    const resting = ((1 * 3.5 * weight) / 200) * minutes;
    return { steps: n, distanceKm, activeCalories: Math.max(0, total - resting), calculationMethod: "MET" };
  }

  if (n > 0 && weight > 0 && distanceKm > 0 && Number(heightCm) > 0) {
    return { steps: n, distanceKm, activeCalories: 0.5 * weight * distanceKm, calculationMethod: "DISTANCE_ESTIMATE" };
  }

  const fbHeight = Number(heightCm) > 0 ? Number(heightCm) : 170;
  const fbWeight = weight > 0 ? weight : 70;
  const fbStride = (fbHeight / 100) * factor || 0.7038;
  const fbDistance = n > 0 ? (n * fbStride) / 1000 : 0;
  return {
    steps: n,
    distanceKm: fbDistance,
    activeCalories: n > 0 ? 0.5 * fbWeight * fbDistance : 0,
    calculationMethod: strideEstimated || !(Number(heightCm) > 0) || !(weight > 0) ? "FALLBACK" : "DISTANCE_ESTIMATE",
  };
}

export function formatSetScheme(sets = [], kind = "strength", equipmentUsed = "") {
  if (kind === "cardio") {
    const mins = sets.reduce((s, x) => s + (Number(x.durationMin) || 0), 0);
    const km = sets.reduce((s, x) => s + (Number(x.distanceKm) || 0), 0);
    if (mins && km) return `${mins} min · ${km} km`;
    if (mins) return `${mins} min`;
    if (km) return `${km} km`;
    return "";
  }
  const groups = [];
  for (const s of sets) {
    const weight = Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    const unit = s.unit || "kg";
    const last = groups[groups.length - 1];
    if (last && last.weight === weight && last.reps === reps && last.unit === unit) last.sets += 1;
    else groups.push({ weight, reps, unit, sets: 1 });
  }
  if (!groups.length) return "";
  const bodyweight = equipmentUsed === "bodyweight";
  return groups
    .map((g) => {
      const load = bodyweight && !g.weight ? "BW" : `${g.weight}${g.unit}`;
      return `${load} x ${g.reps} x ${g.sets}`;
    })
    .join(" · ");
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
