const ACTIVITY_FACTORS = {
  sedentary: { label: "Sedentary", hint: "Desk work, little exercise", factor: 1.2 },
  light: { label: "Lightly active", hint: "Walks or 1–3 workouts / week", factor: 1.375 },
  moderate: { label: "Moderately active", hint: "3–5 workouts / week", factor: 1.55 },
  active: { label: "Active", hint: "Daily training or physical job", factor: 1.725 },
  very_active: { label: "Very active", hint: "Hard training twice a day", factor: 1.9 },
};

const MIN_CALORIES = { female: 1200, male: 1500, other: 1300 };
const KCAL_PER_KG = 7700;

function round(n, d = 0) {
  const p = 10 ** d;
  return Math.round((Number(n) || 0) * p) / p;
}

function bmi(weightKg, heightCm) {
  const m = heightCm / 100;
  return round(weightKg / (m * m), 1);
}

function bmrMifflin({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return round(base + 5);
  if (sex === "female") return round(base - 161);
  return round(base - 78);
}

function tdeeFrom(bmrValue, activityLevel) {
  const factor = ACTIVITY_FACTORS[activityLevel]?.factor || 1.2;
  return round(bmrValue * factor);
}

function daysUntil(dateStr) {
  const end = new Date(dateStr);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((end - start) / 86400000));
}

function suggestedPlan(profile) {
  const { sex, age, heightCm, currentWeightKg, targetWeightKg, targetDate, activityLevel } = profile;
  const bmrValue = bmrMifflin({ sex, weightKg: currentWeightKg, heightCm, age });
  const tdee = tdeeFrom(bmrValue, activityLevel);
  const bmiValue = bmi(currentWeightKg, heightCm);
  const toLose = currentWeightKg - targetWeightKg;
  const days = daysUntil(targetDate);
  const weeks = Math.max(days / 7, 1);

  let note = "Targets are estimates from age, sex, height, weight and activity. Food labels and restaurant meals vary.";
  let calorieTarget = tdee;
  let weeklyLossCapKg = 0;

  if (toLose > 0.2) {
    const requestedWeekly = toLose / weeks;
    weeklyLossCapKg = round(Math.min(0.75, Math.max(0.25, currentWeightKg * 0.0075)), 2);
    const safeWeekly = Math.min(requestedWeekly, weeklyLossCapKg);
    const rawDeficit = (safeWeekly * KCAL_PER_KG) / 7;
    const cappedDeficit = Math.min(rawDeficit, tdee * 0.15, 650);
    const floor = MIN_CALORIES[sex] || MIN_CALORIES.other;
    calorieTarget = Math.max(floor, round(tdee - Math.max(200, cappedDeficit)));
    if (requestedWeekly > weeklyLossCapKg + 0.05) {
      note =
        "The date you chose implies a faster pace than is generally considered sustainable. Calories are capped around 0.25–0.75 kg per week. Consider a later target date.";
    }
  } else if (toLose < -0.2) {
    calorieTarget = round(tdee + 250);
    note = "Target is above current weight, so this plan uses a modest surplus. Strength training still helps.";
  }

  const protein = round(Math.min(2.0, Math.max(1.6, 1.8)) * currentWeightKg);
  const fat = round(Math.max(0.7 * currentWeightKg, (calorieTarget * 0.25) / 9));
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbKcal = Math.max(0, calorieTarget - proteinKcal - fatKcal);
  const carbs = round(carbKcal / 4);
  const fiber = round((calorieTarget / 1000) * 14);
  const sugarLimit = round((calorieTarget * 0.1) / 4);
  const sodiumLimit = 2300;

  return {
    bmi: bmiValue,
    bmr: bmrValue,
    tdee,
    calorieTarget,
    proteinTarget: protein,
    carbTarget: carbs,
    fatTarget: fat,
    fiberTarget: fiber,
    sugarLimit,
    sodiumLimit,
    weeklyBurnTarget: round(tdee * 0.12),
    estimated: true,
    note,
    weeklyLossCapKg,
    activityLabel: ACTIVITY_FACTORS[activityLevel]?.label || "Sedentary",
  };
}

function unitToGrams(food, quantity, unit) {
  const q = Number(quantity) || 0;
  const map = food.servings || {};
  if (unit === "grams" || unit === "g") return q;
  if (unit === "ounces" || unit === "oz") return q * 28.3495;
  const gramsPerUnit = map[unit];
  if (gramsPerUnit) return q * gramsPerUnit;
  return q;
}

function scaleNutrition(food, quantity, unit) {
  const grams = unitToGrams(food, quantity, unit);
  const factor = grams / (food.baseAmountG || 100);
  const n = food.nutritionPer100g;
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

function sumNutrition(items) {
  return items.reduce(
    (acc, item) => {
      acc.calories += item.calories || 0;
      acc.protein += item.protein || 0;
      acc.carbs += item.carbs || 0;
      acc.fat += item.fat || 0;
      acc.fiber += item.fiber || 0;
      acc.sugar += item.sugar || 0;
      acc.sodium += item.sodium || 0;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  );
}

function roundNutrition(n) {
  return {
    calories: round(n.calories),
    protein: round(n.protein, 1),
    carbs: round(n.carbs, 1),
    fat: round(n.fat, 1),
    fiber: round(n.fiber, 1),
    sugar: round(n.sugar, 1),
    sodium: round(n.sodium),
  };
}

function estimateExerciseKcal({ met, durationMin, weightKg, caloriesOverride }) {
  if (caloriesOverride) return round(caloriesOverride);
  return round((met || 4) * (weightKg || 70) * ((durationMin || 0) / 60));
}

function setVolume(set) {
  if (!set.weight || !set.reps) return 0;
  return Number(set.reps) * Number(set.weight);
}

function sessionStats(exercises) {
  let sets = 0;
  let reps = 0;
  let volume = 0;
  for (const ex of exercises) {
    for (const s of ex.sets || []) {
      if (!s.reps && !s.durationMin) continue;
      sets += 1;
      reps += Number(s.reps) || 0;
      volume += setVolume(s);
    }
  }
  return { sets, reps, volume: round(volume) };
}

function generateInsights({ consumed, targets, burned, meals }) {
  const insights = [];
  const remaining = round((targets.calorieTarget || 0) - (consumed.calories || 0));
  if ((consumed.protein || 0) < (targets.proteinTarget || 0) * 0.9) {
    insights.push("Protein is below today's target.");
  } else {
    insights.push("Protein is close to today's target.");
  }
  const mealCals = Object.entries(meals || {}).map(([k, v]) => [k, v.calories || 0]);
  mealCals.sort((a, b) => b[1] - a[1]);
  if (mealCals[0] && mealCals[0][1] > 0) {
    const label = mealCals[0][0].replace("_", " ");
    insights.push(`Most calories came from ${label}.`);
  }
  if (remaining > 80) {
    insights.push(`About ${remaining} kcal left before today's food maximum.`);
  } else if (remaining < -80) {
    insights.push("Intake is above today's food maximum.");
  } else {
    insights.push("Calories are near today's food maximum.");
  }
  if ((burned || 0) > 50) {
    insights.push(`Activity is about ${burned} kcal. That increases the estimated deficit; it does not raise the food maximum.`);
  }
  if ((consumed.fiber || 0) < (targets.fiberTarget || 0) * 0.7) {
    insights.push("Fiber is on the lower side — vegetables, dal, or fruit can help.");
  }
  return insights.slice(0, 5);
}

function localDateKey(date = new Date()) {
  const d = new Date(date);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

function startOfWeek(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return localDateKey(d);
}

function addDays(dateKey, n) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + n);
  return localDateKey(d);
}

function weekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

module.exports = {
  ACTIVITY_FACTORS,
  round,
  bmi,
  bmrMifflin,
  tdeeFrom,
  suggestedPlan,
  unitToGrams,
  scaleNutrition,
  sumNutrition,
  roundNutrition,
  estimateExerciseKcal,
  sessionStats,
  setVolume,
  generateInsights,
  localDateKey,
  startOfWeek,
  addDays,
  weekDates,
};
