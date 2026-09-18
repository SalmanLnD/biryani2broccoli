const ACTIVITY_FACTORS = {
  sedentary: { label: "Sedentary", hint: "Desk work, little exercise", factor: 1.2 },
  light: { label: "Lightly active", hint: "Walks or 1–3 workouts / week", factor: 1.375 },
  moderate: { label: "Moderately active", hint: "3–5 workouts / week", factor: 1.55 },
  active: { label: "Active", hint: "Daily training or physical job", factor: 1.725 },
  very_active: { label: "Very active", hint: "Hard training twice a day", factor: 1.9 },
};

const MIN_CALORIES = { female: 1200, male: 1500, other: 1300 };
const KCAL_PER_KG = 7700;
const WALKING_MET = 3.3;
const RESTING_MET = 1.0;
const REST_MET = 1.5;
const WORKOUT_MET = 5;
const STRENGTH_MET = { light: 3.5, moderate: 5.0, vigorous: 6.0 };
const CARDIO_INTENSITY_MET = { light: 4.0, moderate: 6.8, vigorous: 9.0 };

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

function sedentaryExpenditure(bmrValue) {
  return tdeeFrom(bmrValue, "sedentary");
}

function netActiveKcal(grossKcal, met = WORKOUT_MET) {
  const gross = Number(grossKcal) || 0;
  const m = Number(met) || WORKOUT_MET;
  if (m <= 1) return 0;
  return round(Math.max(0, gross * ((m - 1) / m)));
}

function normalizeIntensity(value) {
  const id = String(value || "").toLowerCase();
  if (id === "light" || id === "vigorous") return id;
  return "moderate";
}

function strengthMet(intensity) {
  return STRENGTH_MET[normalizeIntensity(intensity)] || STRENGTH_MET.moderate;
}

function walkingMetFromSpeed(kmh) {
  const s = Number(kmh) || 0;
  if (s <= 0) return 3.3;
  if (s < 4) return 2.8;
  if (s < 5) return 3.3;
  if (s < 5.6) return 3.8;
  if (s < 6.4) return 4.3;
  if (s < 7.2) return 5.0;
  return 6.3;
}

function runningMetFromSpeed(kmh) {
  const s = Number(kmh) || 0;
  if (s < 8) return walkingMetFromSpeed(s);
  if (s < 9.7) return 8.3;
  if (s < 11.3) return 9.8;
  if (s < 12.9) return 11.0;
  if (s < 14.5) return 11.8;
  if (s < 16.1) return 12.8;
  return 14.5;
}

function cyclingMetFromSpeed(kmh) {
  const s = Number(kmh) || 0;
  if (s <= 0) return 6.8;
  if (s < 16) return 4.0;
  if (s < 19) return 6.8;
  if (s < 22) return 8.0;
  if (s < 26) return 10.0;
  return 12.0;
}

function cardioMetFor({ set, name, intensity } = {}) {
  const speed = Number(set?.speedKmh) || 0;
  const n = String(name || "").toLowerCase();
  const level = normalizeIntensity(intensity);
  if (speed > 0) {
    if (/cycl|bike|spin/.test(n)) return cyclingMetFromSpeed(speed);
    if (/run|jog/.test(n) || (n.includes("treadmill") && speed >= 8)) return runningMetFromSpeed(speed);
    if (/walk/.test(n) || speed < 8) return walkingMetFromSpeed(speed);
    return runningMetFromSpeed(speed);
  }
  if (/walk/.test(n)) return ({ light: 2.8, moderate: 3.5, vigorous: 5.0 })[level];
  if (/run|jog/.test(n)) return ({ light: 8.0, moderate: 9.8, vigorous: 11.5 })[level];
  if (/cycl|bike|spin/.test(n)) return ({ light: 4.0, moderate: 6.8, vigorous: 10.0 })[level];
  return CARDIO_INTENSITY_MET[level] || CARDIO_INTENSITY_MET.moderate;
}

function calculateActiveCalories({ weightKg, durationMinutes, met } = {}) {
  const weight = Number(weightKg) || 0;
  const minutes = Number(durationMinutes) || 0;
  const m = Number(met) || 0;
  if (weight <= 0 || minutes <= 0 || m <= 0) {
    return {
      valid: false,
      weightKg: weight,
      durationMinutes: minutes,
      met: m,
      totalKcal: 0,
      restingKcal: 0,
      activeKcal: 0,
    };
  }
  const totalKcal = ((m * 3.5 * weight) / 200) * minutes;
  const restingKcal = ((RESTING_MET * 3.5 * weight) / 200) * minutes;
  const activeKcal = Math.max(0, totalKcal - restingKcal);
  return {
    valid: true,
    weightKg: weight,
    durationMinutes: minutes,
    met: m,
    totalKcal,
    restingKcal,
    activeKcal,
  };
}

function roundDisplayKcal(n, step = 10) {
  const size = Number(step) > 0 ? Number(step) : 10;
  return Math.round((Number(n) || 0) / size) * size;
}

function fallbackDurationMin(workout) {
  let mins = 0;
  for (const ex of workout?.exercises || []) {
    if (ex.kind === "cardio") {
      mins += (ex.sets || []).reduce((s, set) => s + (Number(set.durationMin) || 0), 0);
    } else {
      mins += (ex.sets || []).length * 3;
    }
  }
  return Math.max(0, mins);
}

function resolveWorkoutDuration(workout, { complete = false, enteredDuration } = {}) {
  const entered = Number(enteredDuration);
  if (entered > 0) return { durationMin: Math.round(entered), source: "entered", estimated: false };
  const stored = Number(workout?.durationMin);
  if (stored > 0) {
    return {
      durationMin: Math.round(stored),
      source: workout.durationSource || "entered",
      estimated: Boolean(workout.durationEstimated),
    };
  }
  if (workout?.startedAt) {
    const start = new Date(workout.startedAt);
    const end = workout.endedAt
      ? new Date(workout.endedAt)
      : workout.status === "completed"
        ? null
        : new Date();
    if (end) {
      const elapsed = Math.round((end - start) / 60000);
      if (elapsed >= 1 && elapsed <= 300) {
        return { durationMin: elapsed, source: "elapsed", estimated: false };
      }
    }
  }
  const fallback = fallbackDurationMin(workout);
  if (fallback > 0) return { durationMin: fallback, source: "estimated", estimated: true };
  return { durationMin: 0, source: "missing", estimated: true };
}

function estimateWorkoutBurn(workout, weightKg) {
  const intensity = normalizeIntensity(workout?.intensity);
  const durationInfo = resolveWorkoutDuration(workout, { complete: workout?.status === "completed" });
  const sessionMin = durationInfo.durationMin;
  let cardioMinutes = 0;
  let cardioActiveKcal = 0;
  let cardioTotalKcal = 0;
  let cardioRestingKcal = 0;
  for (const ex of workout?.exercises || []) {
    if (ex.kind !== "cardio") continue;
    for (const set of ex.sets || []) {
      const mins = Number(set.durationMin) || 0;
      if (mins <= 0) continue;
      const met = cardioMetFor({ set, name: ex.name, intensity });
      const burn = calculateActiveCalories({ weightKg, durationMinutes: mins, met });
      cardioMinutes += mins;
      cardioActiveKcal += burn.activeKcal;
      cardioTotalKcal += burn.totalKcal;
      cardioRestingKcal += burn.restingKcal;
      set.calories = round(burn.activeKcal);
    }
  }
  const hasStrength = (workout?.exercises || []).some((ex) => ex.kind !== "cardio");
  const remaining = Math.max(0, sessionMin - cardioMinutes);
  let otherActive = 0;
  let otherTotal = 0;
  let otherResting = 0;
  let otherMet = strengthMet(intensity);
  if (hasStrength) {
    const strengthMin = sessionMin > 0 ? remaining : 0;
    const burn = calculateActiveCalories({ weightKg, durationMinutes: strengthMin, met: otherMet });
    otherActive = burn.activeKcal;
    otherTotal = burn.totalKcal;
    otherResting = burn.restingKcal;
  } else if (remaining > 0) {
    otherMet = REST_MET;
    const burn = calculateActiveCalories({ weightKg, durationMinutes: remaining, met: REST_MET });
    otherActive = burn.activeKcal;
    otherTotal = burn.totalKcal;
    otherResting = burn.restingKcal;
  }
  const durationMin = sessionMin || cardioMinutes;
  const estimated = durationInfo.estimated || durationInfo.source === "missing";
  let note = "Estimated active calories based on body weight, workout duration and exercise intensity. Actual calorie burn varies by person.";
  if (durationInfo.source === "missing" || durationMin <= 0) {
    note = "Enter workout duration to estimate active calories. Without duration, a precise burn is not shown.";
  } else if (durationInfo.estimated) {
    note = "Duration was estimated from logged sets because start/end time was not available. Active calories are a rough estimate.";
  } else if (hasStrength) {
    note = "Rest and lifting time were not tracked separately, so the selected intensity was applied to the session duration. This is an estimate.";
  }
  return {
    intensity,
    durationMin,
    durationSource: durationInfo.source,
    estimated,
    cardioMinutes,
    cardioActiveKcal,
    met: hasStrength ? otherMet : (cardioMinutes ? null : otherMet),
    totalKcal: cardioTotalKcal + otherTotal,
    restingKcal: cardioRestingKcal + otherResting,
    activeKcal: cardioActiveKcal + otherActive,
    note,
  };
}

function summarizeWorkouts(workouts, weightKg) {
  const list = workouts || [];
  let durationMin = 0;
  let calories = 0;
  let cardioKcal = 0;
  for (const w of list) {
    const burn = estimateWorkoutBurn(w, weightKg);
    durationMin += burn.durationMin || 0;
    calories += burn.activeKcal;
    cardioKcal += burn.cardioActiveKcal || 0;
  }
  return {
    count: list.length,
    durationMin: round(durationMin),
    calories: round(calories),
    cardioKcal: round(cardioKcal),
  };
}

function goalTimeline(profile = {}) {
  const current = Number(profile.currentWeightKg) || 0;
  const target = Number(profile.targetWeightKg) || 0;
  const remainingKg = round(current - target, 2);
  const daysRemaining = daysUntil(profile.targetDate);
  const weeksRemaining = Math.max(daysRemaining / 7, 1);
  const requiredWeeklyLossKg = remainingKg > 0.2 ? round(remainingKg / weeksRemaining, 2) : 0;
  const requiredDailyDeficit = remainingKg > 0.2 ? round((requiredWeeklyLossKg * KCAL_PER_KG) / 7) : 0;
  return {
    currentWeightKg: round(current, 2),
    targetWeightKg: round(target, 2),
    remainingKg,
    targetDate: profile.targetDate || "",
    daysRemaining,
    weeksRemaining: round(weeksRemaining, 1),
    requiredWeeklyLossKg,
    requiredDailyDeficit,
    requiredWeeklyDeficit: requiredDailyDeficit * 7,
    activityLabel: ACTIVITY_FACTORS[profile.activityLevel]?.label || "",
  };
}

function energyBalance({
  method = "tdee",
  bmr = 0,
  tdee = 0,
  activityLevel = "light",
  foodCalories = 0,
  stepKcal = 0,
  exerciseKcal = 0,
  cardioKcal = 0,
} = {}) {
  const methodId = method === "activity" ? "activity" : "tdee";
  const food = Number(foodCalories) || 0;
  const walkGross = Number(stepKcal) || 0;
  const workoutActive = Math.max(0, Number(exerciseKcal) || 0);
  const walkActive = netActiveKcal(walkGross, WALKING_MET);
  const baselineKcal = sedentaryExpenditure(bmr);
  const activityLabel = ACTIVITY_FACTORS[activityLevel]?.label || "Lightly active";
  const activityFactor = ACTIVITY_FACTORS[activityLevel]?.factor || 1.375;

  let expenditure;
  let estimatedDeficit;
  let methodNote;
  if (methodId === "activity") {
    expenditure = round(baselineKcal + walkActive + workoutActive);
    estimatedDeficit = round(expenditure - food);
    methodNote = "Activity-based mode uses sedentary baseline plus estimated active calories from walking and workouts. Resting burn is not added again.";
  } else {
    expenditure = round(tdee);
    estimatedDeficit = round(expenditure - food);
    methodNote = "Your TDEE already accounts for your selected activity level. Activity calories shown below are tracked for reference and are not added again.";
  }

  return {
    method: methodId,
    bmr: round(bmr),
    tdee: round(tdee),
    activityLevel,
    activityLabel,
    activityFactor,
    foodCalories: round(food),
    stepKcal: round(walkGross),
    exerciseKcal: round(workoutActive),
    cardioKcal: round(cardioKcal),
    walkActiveKcal: walkActive,
    workoutActiveKcal: workoutActive,
    baselineKcal,
    expenditure,
    estimatedDeficit,
    surplus: estimatedDeficit < 0,
    methodNote,
  };
}

function weekEnergy(days = [], profile = {}) {
  const tdee = Number(profile.tdee) || 0;
  const calorieTarget = Number(profile.calorieTarget) || 0;
  const targetDailyDeficit = round(tdee - calorieTarget);
  const targetWeeklyDeficit = targetDailyDeficit * 7;
  const logged = (days || []).filter((d) => (d.consumed?.calories || 0) > 0);
  const actualDeficit = round(logged.reduce((s, d) => s + (Number(d.energy?.estimatedDeficit) || 0), 0));
  const loggedDays = logged.length;
  return {
    targetDailyDeficit,
    targetWeeklyDeficit,
    actualDeficit,
    avgDailyDeficit: loggedDays ? round(actualDeficit / loggedDays) : 0,
    loggedDays,
    progressPct: targetWeeklyDeficit
      ? Math.min(100, Math.max(0, round((actualDeficit / targetWeeklyDeficit) * 100)))
      : 0,
  };
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
  let tdee = tdeeFrom(bmrValue, activityLevel);
  if (profile.tdeeOverride) tdee = round(profile.tdeeOverride);
  const bmiValue = bmi(currentWeightKg, heightCm);
  const toLose = currentWeightKg - targetWeightKg;
  const days = daysUntil(targetDate);
  const weeks = Math.max(days / 7, 1);

  let note = "Targets are estimates from age, sex, height, weight and activity. Food labels and restaurant meals vary.";
  let calorieTarget = tdee;
  let weeklyLossCapKg = 0;

  if (toLose > 0.2) {
    const requestedWeekly = toLose / weeks;
    const neededDeficit = (requestedWeekly * KCAL_PER_KG) / 7;
    const floor = MIN_CALORIES[sex] || MIN_CALORIES.other;
    calorieTarget = Math.max(floor, round(tdee - neededDeficit));
    const actualDeficit = tdee - calorieTarget;
    const actualWeekly = actualDeficit > 0 ? round((actualDeficit * 7) / KCAL_PER_KG, 2) : 0;
    weeklyLossCapKg = actualWeekly;
    if (round(tdee - neededDeficit) < floor) {
      note = `The date implies a larger daily deficit than the ${floor} kcal floor allows. Calories are set at the floor (~${actualWeekly} kg per week). Consider a later target date.`;
    } else {
      note = `Calories follow your goal and date: about ${actualWeekly} kg per week (~${round(actualDeficit)} kcal/day below TDEE). Food labels and restaurant meals vary.`;
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
    ...goalTimeline({ currentWeightKg, targetWeightKg, targetDate, activityLevel }),
    plannedDailyDeficit: round(tdee - calorieTarget),
    plannedWeeklyDeficit: round(tdee - calorieTarget) * 7,
  };
}

function weekdayOf(dateKey) {
  return new Date(`${dateKey}T00:00:00`).getDay();
}

function daysBetween(fromKey, toKey) {
  return Math.max(1, Math.round((new Date(`${toKey}T00:00:00`) - new Date(`${fromKey}T00:00:00`)) / 86400000));
}

function isWeighInDay(dateKey) {
  const d = weekdayOf(dateKey);
  return d === 1 || d === 6;
}

function weighInWeekday(dateKey) {
  const d = weekdayOf(dateKey);
  if (d === 1) return "Monday";
  if (d === 6) return "Saturday";
  return "";
}

function weighInPrompt({ date, today, weekLogs = [], lastWeightKg } = {}) {
  const weekStart = startOfWeek(date);
  const monday = weekStart;
  const saturday = addDays(weekStart, 5);
  const has = (d) => (weekLogs || []).some((l) => l.date === d && Number(l.weightKg) > 0);
  const mondayKg = (weekLogs || []).find((l) => l.date === monday)?.weightKg;
  const saturdayKg = (weekLogs || []).find((l) => l.date === saturday)?.weightKg;
  const todayDay = weekdayOf(today || date);
  const viewingCurrentWeek = startOfWeek(today || date) === weekStart;
  let askDate = "";
  let weekday = "";
  if (!has(monday) && (date === monday || (viewingCurrentWeek && todayDay >= 1 && todayDay <= 5))) {
    askDate = monday;
    weekday = "Monday";
  } else if (!has(saturday) && (date === saturday || (viewingCurrentWeek && (todayDay === 6 || todayDay === 0)))) {
    askDate = saturday;
    weekday = "Saturday";
  }
  return {
    needed: Boolean(askDate),
    askDate,
    weekday,
    isWeighInDay: isWeighInDay(date),
    logged: has(date),
    lastWeightKg: lastWeightKg ? round(lastWeightKg, 2) : null,
    mondayLogged: has(monday),
    saturdayLogged: has(saturday),
    mondayKg: mondayKg ? round(mondayKg, 2) : null,
    saturdayKg: saturdayKg ? round(saturdayKg, 2) : null,
    weekChangeKg: mondayKg && saturdayKg ? round(saturdayKg - mondayKg, 2) : null,
  };
}

function weeklyWeightProgress(logs = []) {
  const list = [...(logs || [])].filter((l) => Number(l.weightKg) > 0).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const byWeek = {};
  for (const log of list) {
    const ws = startOfWeek(log.date);
    if (!byWeek[ws]) byWeek[ws] = { weekStart: ws, monday: null, saturday: null };
    const day = weekdayOf(log.date);
    if (day === 1) byWeek[ws].monday = log;
    if (day === 6) byWeek[ws].saturday = log;
  }
  const weekStarts = Object.keys(byWeek).sort();
  let prevSaturday = null;
  const weeks = weekStarts.map((ws) => {
    const w = byWeek[ws];
    const mondayKg = w.monday ? round(w.monday.weightKg, 2) : null;
    const saturdayKg = w.saturday ? round(w.saturday.weightKg, 2) : null;
    const weekChangeKg = mondayKg != null && saturdayKg != null ? round(saturdayKg - mondayKg, 2) : null;
    const vsLastSaturdayKg = prevSaturday != null && saturdayKg != null ? round(saturdayKg - prevSaturday, 2) : null;
    if (saturdayKg != null) prevSaturday = saturdayKg;
    return { weekStart: ws, mondayKg, saturdayKg, weekChangeKg, vsLastSaturdayKg };
  });
  return { weeks: weeks.slice(-8), latest: weeks[weeks.length - 1] || null };
}

function applyWeighInPlan(profile, { newWeightKg, prevWeightKg, daysBetween: gap, avgDailyIntake } = {}) {
  const base = suggestedPlan({ ...profile, currentWeightKg: newWeightKg });
  const canAdapt = prevWeightKg > 0 && gap >= 4 && gap <= 10 && avgDailyIntake > 800;
  if (!canAdapt) {
    return {
      ...base,
      adapted: false,
      tdeeSource: "weight",
      formulaTdee: base.tdee,
      note: `TDEE was recalculated from this weigh-in (${round(newWeightKg, 2)} kg). ${base.note}`,
    };
  }
  const kgLost = round(prevWeightKg - newWeightKg, 2);
  const observedTdee = round(avgDailyIntake + (kgLost * KCAL_PER_KG) / gap);
  const lo = round(base.tdee * 0.88);
  const hi = round(base.tdee * 1.12);
  const blended = round(base.tdee * 0.65 + observedTdee * 0.35);
  const tdee = Math.min(hi, Math.max(lo, blended));
  const adapted = suggestedPlan({ ...profile, currentWeightKg: newWeightKg, tdeeOverride: tdee });
  const lost = kgLost > 0;
  const changeText = `${Math.abs(kgLost)} kg ${lost ? "down" : "up"} over ${gap} days`;
  return {
    ...adapted,
    adapted: tdee !== base.tdee,
    tdeeSource: "weekly-weigh-in",
    formulaTdee: base.tdee,
    observedTdee,
    weeklyChangeKg: round(-kgLost, 2),
    note: `TDEE is now ${adapted.tdee} kcal from your weigh-in (${round(newWeightKg, 2)} kg) and recent change (${changeText}). Formula TDEE was ${base.tdee} kcal. ${adapted.note}`,
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

function estimateExerciseKcal({ met, durationMin, weightKg }) {
  const result = calculateActiveCalories({
    weightKg,
    durationMinutes: durationMin,
    met: met || WORKOUT_MET,
  });
  return round(result.activeKcal);
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

function generateInsights({ consumed, targets, meals, method }) {
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
  if (method === "activity") {
    insights.push("Deficit uses sedentary baseline plus estimated active calories, not a second copy of TDEE.");
  } else {
    insights.push("Deficit is TDEE minus food. Steps and workouts are logged separately.");
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
  sedentaryExpenditure,
  netActiveKcal,
  summarizeWorkouts,
  goalTimeline,
  energyBalance,
  weekEnergy,
  suggestedPlan,
  applyWeighInPlan,
  isWeighInDay,
  weighInWeekday,
  weighInPrompt,
  weeklyWeightProgress,
  daysBetween,
  unitToGrams,
  scaleNutrition,
  sumNutrition,
  roundNutrition,
  calculateActiveCalories,
  estimateWorkoutBurn,
  resolveWorkoutDuration,
  normalizeIntensity,
  strengthMet,
  roundDisplayKcal,
  estimateExerciseKcal,
  sessionStats,
  setVolume,
  generateInsights,
  localDateKey,
  startOfWeek,
  addDays,
  weekDates,
};
