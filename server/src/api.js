const express = require("express");
const bcrypt = require("bcryptjs");
const { auth, signToken } = require("./auth");
const {
  User,
  Food,
  Meal,
  Exercise,
  Workout,
  WeightLog,
  StepLog,
} = require("./models");
const {
  suggestedPlan,
  scaleNutrition,
  sumNutrition,
  roundNutrition,
  estimateExerciseKcal,
  sessionStats,
  generateInsights,
  localDateKey,
  startOfWeek,
  addDays,
  weekDates,
  round,
  energyBalance,
  summarizeWorkouts,
  goalTimeline,
  weekEnergy,
  applyWeighInPlan,
  weighInWeekday,
  weighInPrompt,
  weeklyWeightProgress,
  daysBetween,
} = require("./calc");

const MEAL_SLOTS = ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "other"];
const MEAL_LABELS = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  evening_snack: "Evening Snack",
  dinner: "Dinner",
  other: "Other",
};

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profile: user.profile,
  };
}

function stepCalories(steps, weightKg) {
  const n = Math.max(0, Number(steps) || 0);
  const w = Number(weightKg) || 70;
  return round(n * 0.04 * (w / 70));
}

function compactName(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function matchExercise(name, catalog) {
  const raw = String(name || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const compact = compactName(raw);
  return (
    catalog.find((e) => e.name.toLowerCase() === lower) ||
    catalog.find((e) => compactName(e.name) === compact || e.slug === compact) ||
    catalog.find((e) => e.name.toLowerCase().includes(lower) || lower.includes(e.name.toLowerCase()))
  );
}

async function applyWorkoutStats(workout, user, { complete = false, durationMin } = {}) {
  const stats = sessionStats(workout.exercises);
  let kcal = 0;
  const weightKg = user.profile?.currentWeightKg || 70;
  for (const block of workout.exercises) {
    const catalog = block.exercise ? await Exercise.findById(block.exercise) : null;
    if (block.kind === "cardio") {
      for (const s of block.sets) {
        s.calories = estimateExerciseKcal({
          met: catalog?.met,
          durationMin: s.durationMin,
          weightKg,
          caloriesOverride: s.calories,
        });
        kcal += s.calories || 0;
      }
    } else {
      const minutes = Math.max(4, (block.sets?.length || 0) * 3);
      kcal += estimateExerciseKcal({ met: catalog?.met || 5, durationMin: minutes, weightKg }) / Math.max(1, workout.exercises.length);
    }
  }
  workout.calories = round(kcal);
  if (complete) {
    workout.status = "completed";
    workout.endedAt = workout.endedAt || new Date();
    if (durationMin) workout.durationMin = durationMin;
    else if (workout.startedAt) {
      workout.durationMin = Math.max(1, Math.round((workout.endedAt - workout.startedAt) / 60000));
    }
    const previous = await Workout.find({
      user: user._id,
      status: "completed",
      _id: { $ne: workout._id },
    }).sort({ date: -1 });
    const prs = [];
    for (const block of workout.exercises) {
      const maxW = Math.max(0, ...(block.sets || []).map((s) => Number(s.weight) || 0));
      const pastMax = Math.max(
        0,
        ...previous.flatMap((w) =>
          w.exercises
            .filter((e) => block.exercise && String(e.exercise) === String(block.exercise))
            .flatMap((e) => e.sets.map((s) => Number(s.weight) || 0))
        )
      );
      if (maxW > 0 && maxW > pastMax) prs.push(`Heavier ${block.name}: ${maxW}${block.sets[0]?.unit || "kg"}`);
    }
    workout.personalRecords = prs;
  }
  return stats;
}

async function ensureMeals(userId, date) {
  const existing = await Meal.find({ user: userId, date });
  const have = new Set(existing.map((m) => m.slot));
  const created = [];
  for (const slot of MEAL_SLOTS) {
    if (!have.has(slot)) {
      created.push({ user: userId, date, slot, items: [] });
    }
  }
  if (created.length) await Meal.insertMany(created);
  return Meal.find({ user: userId, date }).sort({ slot: 1 });
}

async function seedDemoBreakfast(user) {
  const date = localDateKey();
  await ensureMeals(user._id, date);
  const biryani = await Food.findOne({ slug: "chicken-biryani" });
  const lollipop = await Food.findOne({ slug: "chicken-lollipop" });
  if (!biryani || !lollipop) return;
  const meal = await Meal.findOne({ user: user._id, date, slot: "breakfast" });
  if (meal.items.length) return;
  const a = scaleNutrition(biryani, 250, "grams");
  const b = scaleNutrition(lollipop, 2, "piece");
  meal.items.push(
    {
      food: biryani._id,
      foodName: biryani.name,
      quantity: 250,
      unit: "grams",
      estimated: true,
      ...a,
      loggedAt: new Date(new Date().setHours(8, 30, 0, 0)),
    },
    {
      food: lollipop._id,
      foodName: lollipop.name,
      quantity: 2,
      unit: "piece",
      estimated: true,
      ...b,
      loggedAt: new Date(new Date().setHours(8, 35, 0, 0)),
    }
  );
  await meal.save();
}

async function dayPayload(user, date) {
  const meals = await ensureMeals(user._id, date);
  const workouts = await Workout.find({ user: user._id, date, status: "completed" });
  const steps = await StepLog.findOne({ user: user._id, date });
  const weight = await WeightLog.findOne({ user: user._id, date });
  const mealMap = {};
  for (const slot of MEAL_SLOTS) {
    const meal = meals.find((m) => m.slot === slot) || { items: [] };
    const totals = roundNutrition(sumNutrition(meal.items));
    mealMap[slot] = {
      slot,
      label: MEAL_LABELS[slot],
      items: meal.items,
      totals,
      id: meal._id,
    };
  }
  const consumed = roundNutrition(sumNutrition(meals.flatMap((m) => m.items)));
  const workout = summarizeWorkouts(workouts);
  const exerciseKcal = workout.calories;
  const stepKcal = steps?.calories || 0;
  const activeKcal = round(exerciseKcal + stepKcal);
  const targets = {
    calorieTarget: user.profile?.calorieTarget || 0,
    proteinTarget: user.profile?.proteinTarget || 0,
    carbTarget: user.profile?.carbTarget || 0,
    fatTarget: user.profile?.fatTarget || 0,
    fiberTarget: user.profile?.fiberTarget || 0,
    sugarLimit: user.profile?.sugarLimit || 0,
    sodiumLimit: user.profile?.sodiumLimit || 2300,
  };
  const tdee = user.profile?.tdee || targets.calorieTarget || 0;
  const energy = energyBalance({
    method: user.profile?.calorieMethod,
    bmr: user.profile?.bmr || 0,
    tdee,
    activityLevel: user.profile?.activityLevel || "light",
    foodCalories: consumed.calories || 0,
    stepKcal,
    exerciseKcal,
    cardioKcal: workout.cardioKcal,
  });
  const remaining = round((targets.calorieTarget || 0) - (consumed.calories || 0));
  const insights = generateInsights({
    consumed,
    targets,
    meals: Object.fromEntries(Object.entries(mealMap).map(([k, v]) => [k, v.totals])),
    method: energy.method,
  });
  const weekStart = startOfWeek(date);
  const weekLogs = await WeightLog.find({
    user: user._id,
    date: { $gte: weekStart, $lte: addDays(weekStart, 6) },
  });
  const lastLog = await WeightLog.findOne({ user: user._id, date: { $lte: date } }).sort({ date: -1 });
  const weighIn = weighInPrompt({
    date,
    today: localDateKey(),
    weekLogs,
    lastWeightKg: lastLog?.weightKg || user.profile?.currentWeightKg,
  });
  const goal = {
    ...goalTimeline(user.profile || {}),
    plannedDailyDeficit: round(tdee - (targets.calorieTarget || 0)),
    plannedWeeklyDeficit: round(tdee - (targets.calorieTarget || 0)) * 7,
  };
  return {
    date,
    meals: mealMap,
    consumed,
    targets,
    exerciseKcal,
    stepKcal,
    activeKcal,
    netCalories: round(-energy.estimatedDeficit),
    remaining,
    calorieBudget: targets.calorieTarget || 0,
    tdee,
    bmr: energy.bmr,
    calorieMethod: energy.method,
    activityLabel: energy.activityLabel,
    estimatedDeficit: energy.estimatedDeficit,
    energy,
    workout,
    goal,
    percent: targets.calorieTarget ? round((consumed.calories / targets.calorieTarget) * 100) : 0,
    workouts,
    steps: steps || { steps: 0, calories: 0, date },
    weight,
    weighIn,
    insights,
    estimated: true,
  };
}

function createRouter() {
  const r = express.Router();

  r.post("/auth/register", async (req, res) => {
    try {
      const { name, email, password, profile } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required." });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password should be at least 6 characters." });
      }
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ error: "An account with this email already exists." });

      const plan = suggestedPlan({
        name,
        sex: profile.sex,
        age: Number(profile.age),
        heightCm: Number(profile.heightCm),
        currentWeightKg: Number(profile.currentWeightKg),
        targetWeightKg: Number(profile.targetWeightKg),
        targetDate: profile.targetDate,
        activityLevel: profile.activityLevel,
      });

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 10),
        profile: {
          age: Number(profile.age),
          sex: profile.sex,
          heightCm: Number(profile.heightCm),
          currentWeightKg: Number(profile.currentWeightKg),
          startWeightKg: Number(profile.currentWeightKg),
          targetWeightKg: Number(profile.targetWeightKg),
          targetDate: profile.targetDate,
          activityLevel: profile.activityLevel || "light",
          calorieMethod: profile.calorieMethod === "activity" ? "activity" : "tdee",
          stepTarget: Number(profile.stepTarget) || 8000,
          calorieTarget: plan.calorieTarget,
          proteinTarget: plan.proteinTarget,
          carbTarget: plan.carbTarget,
          fatTarget: plan.fatTarget,
          fiberTarget: plan.fiberTarget,
          sugarLimit: plan.sugarLimit,
          sodiumLimit: plan.sodiumLimit,
          weeklyBurnTarget: plan.weeklyBurnTarget,
          bmi: plan.bmi,
          bmr: plan.bmr,
          tdee: plan.tdee,
          estimatesNote: plan.note,
        },
      });

      await WeightLog.create({
        user: user._id,
        date: localDateKey(),
        weightKg: Number(profile.currentWeightKg),
        note: "Starting weight",
      });
      await seedDemoBreakfast(user);

      res.json({ token: signToken(user), user: publicUser(user), plan });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not create account." });
    }
  });

  r.post("/auth/demo", async (req, res) => {
    try {
      const email = `demo-${Date.now()}@biryani2broccoli.app`;
      const d = new Date();
      d.setDate(d.getDate() + 90);
      const profile = {
        age: 28,
        sex: "male",
        heightCm: 172,
        currentWeightKg: 78,
        targetWeightKg: 70,
        targetDate: d.toISOString().slice(0, 10),
        activityLevel: "light",
        stepTarget: 8000,
      };
      const plan = suggestedPlan(profile);
      const user = await User.create({
        name: "Demo",
        email,
        passwordHash: await bcrypt.hash(`demo-${Date.now()}`, 10),
        profile: {
          ...profile,
          calorieMethod: "tdee",
          startWeightKg: profile.currentWeightKg,
          calorieTarget: plan.calorieTarget,
          proteinTarget: plan.proteinTarget,
          carbTarget: plan.carbTarget,
          fatTarget: plan.fatTarget,
          fiberTarget: plan.fiberTarget,
          sugarLimit: plan.sugarLimit,
          sodiumLimit: plan.sodiumLimit,
          weeklyBurnTarget: plan.weeklyBurnTarget,
          bmi: plan.bmi,
          bmr: plan.bmr,
          tdee: plan.tdee,
          estimatesNote: plan.note,
        },
      });
      await WeightLog.create({
        user: user._id,
        date: localDateKey(),
        weightKg: profile.currentWeightKg,
        note: "Starting weight",
      });
      await seedDemoBreakfast(user);
      res.json({ token: signToken(user), user: publicUser(user), plan });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Could not start demo." });
    }
  });

  r.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ error: "Email or password is incorrect." });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Email or password is incorrect." });
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  r.post("/auth/preview", (req, res) => {
    try {
      const plan = suggestedPlan(req.body);
      res.json({ plan, estimated: true });
    } catch {
      res.status(400).json({ error: "Check the profile values and try again." });
    }
  });

  r.get("/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

  r.put("/profile", auth, async (req, res) => {
    const p = { ...req.user.profile.toObject(), ...req.body };
    const plan = suggestedPlan({
      sex: p.sex,
      age: Number(p.age),
      heightCm: Number(p.heightCm),
      currentWeightKg: Number(p.currentWeightKg),
      targetWeightKg: Number(p.targetWeightKg),
      targetDate: p.targetDate,
      activityLevel: p.activityLevel,
    });
    req.user.name = req.body.name || req.user.name;
    req.user.profile = {
      ...p,
      calorieMethod: p.calorieMethod === "activity" ? "activity" : "tdee",
      calorieTarget: plan.calorieTarget,
      proteinTarget: plan.proteinTarget,
      carbTarget: plan.carbTarget,
      fatTarget: plan.fatTarget,
      fiberTarget: plan.fiberTarget,
      sugarLimit: plan.sugarLimit,
      sodiumLimit: plan.sodiumLimit,
      weeklyBurnTarget: plan.weeklyBurnTarget,
      bmi: plan.bmi,
      bmr: plan.bmr,
      tdee: plan.tdee,
      estimatesNote: plan.note,
      startWeightKg: req.user.profile.startWeightKg || p.currentWeightKg,
    };
    await req.user.save();
    res.json({ user: publicUser(req.user), plan });
  });

  r.get("/foods", auth, async (req, res) => {
    const q = (req.query.q || "").trim();
    const category = req.query.category;
    const filter = {
      $or: [{ owner: null }, { owner: req.user._id }],
    };
    if (category && category !== "all") filter.category = category;
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const foods = await Food.find(filter).sort({ name: 1 }).limit(200);
    res.json({ foods });
  });

  r.post("/foods", auth, async (req, res) => {
    const { name, nutritionPer100g, servings, category, defaultUnit, defaultQuantity } = req.body;
    if (!name) return res.status(400).json({ error: "Food name is required." });
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${req.user._id.toString().slice(-6)}`;
    const food = await Food.create({
      slug,
      name,
      category: category || "other",
      cuisine: "custom",
      estimated: true,
      owner: req.user._id,
      baseAmountG: 100,
      nutritionPer100g: nutritionPer100g || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 },
      servings: servings || { grams: 1, ounces: 28.35, piece: 50, bowl: 200, chutney_bowl: 100, cup: 150, serving: 150, small: 80, medium: 120, large: 180, extra_large: 240, tablespoon: 15, teaspoon: 5 },
      defaultUnit: defaultUnit || "grams",
      defaultQuantity: defaultQuantity || 100,
    });
    res.json({ food });
  });

  r.post("/foods/scale", auth, async (req, res) => {
    const { foodId, quantity, unit } = req.body;
    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ error: "Food not found." });
    res.json({ nutrition: scaleNutrition(food, quantity, unit), estimated: true });
  });

  r.get("/day/:date", auth, async (req, res) => {
    res.json(await dayPayload(req.user, req.params.date));
  });

  r.post("/meals/:slot/items", auth, async (req, res) => {
    const date = req.body.date || localDateKey();
    const slot = req.params.slot;
    if (!MEAL_SLOTS.includes(slot)) return res.status(400).json({ error: "Unknown meal." });
    await ensureMeals(req.user._id, date);
    const food = await Food.findById(req.body.foodId);
    if (!food) return res.status(404).json({ error: "Food not found." });
    const nutrition = scaleNutrition(food, req.body.quantity, req.body.unit);
    const meal = await Meal.findOne({ user: req.user._id, date, slot });
    meal.items.push({
      food: food._id,
      foodName: food.name,
      quantity: Number(req.body.quantity),
      unit: req.body.unit,
      estimated: true,
      loggedAt: req.body.loggedAt || new Date(),
      ...nutrition,
    });
    await meal.save();
    res.json(await dayPayload(req.user, date));
  });

  r.put("/meals/:slot/items/:itemId", auth, async (req, res) => {
    const { date, quantity, unit, foodId } = req.body;
    const meal = await Meal.findOne({ user: req.user._id, date, slot: req.params.slot });
    if (!meal) return res.status(404).json({ error: "Meal not found." });
    const item = meal.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found." });
    const food = await Food.findById(foodId || item.food);
    const nutrition = scaleNutrition(food, quantity, unit);
    item.quantity = Number(quantity);
    item.unit = unit;
    item.foodName = food.name;
    Object.assign(item, nutrition);
    await meal.save();
    res.json(await dayPayload(req.user, date));
  });

  r.delete("/meals/:slot/items/:itemId", auth, async (req, res) => {
    const date = req.query.date || req.body.date;
    const meal = await Meal.findOne({ user: req.user._id, date, slot: req.params.slot });
    if (!meal) return res.status(404).json({ error: "Meal not found." });
    meal.items.id(req.params.itemId)?.deleteOne();
    await meal.save();
    res.json(await dayPayload(req.user, date));
  });

  r.post("/meals/:slot/items/:itemId/duplicate", auth, async (req, res) => {
    const date = req.body.date;
    const meal = await Meal.findOne({ user: req.user._id, date, slot: req.params.slot });
    if (!meal) return res.status(404).json({ error: "Meal not found." });
    const item = meal.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: "Item not found." });
    const copy = item.toObject();
    delete copy._id;
    copy.loggedAt = new Date();
    meal.items.push(copy);
    await meal.save();
    res.json(await dayPayload(req.user, date));
  });

  r.get("/exercises", auth, async (req, res) => {
    const q = (req.query.q || "").trim();
    const muscle = req.query.muscle;
    const filter = {};
    if (muscle && muscle !== "all") filter.muscleGroup = muscle;
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const exercises = await Exercise.find(filter).sort({ muscleGroup: 1, name: 1 });
    res.json({ exercises });
  });

  r.get("/exercises/:id", auth, async (req, res) => {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ error: "Exercise not found." });
    const history = await Workout.find({
      user: req.user._id,
      "exercises.exercise": exercise._id,
      status: "completed",
    })
      .sort({ date: -1 })
      .limit(8);
    res.json({ exercise, history });
  });

  r.get("/workouts", auth, async (req, res) => {
    const date = req.query.date;
    const filter = { user: req.user._id };
    if (date) filter.date = date;
    const workouts = await Workout.find(filter).sort({ startedAt: -1 });
    res.json({ workouts });
  });

  r.post("/workouts", auth, async (req, res) => {
    const date = req.body.date || localDateKey();
    const workout = await Workout.create({
      user: req.user._id,
      date,
      title: req.body.title || "Workout",
      startedAt: new Date(),
      status: "in_progress",
      exercises: [],
    });
    res.json({ workout });
  });

  r.post("/workouts/bulk", auth, async (req, res) => {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (!rows.length) return res.status(400).json({ error: "Add at least one exercise row." });
    if (rows.length > 200) return res.status(400).json({ error: "Upload up to 200 rows at a time." });

    const catalog = await Exercise.find();
    const groups = new Map();
    const errors = [];

    rows.forEach((raw, index) => {
      const line = index + 2;
      const exerciseName = String(raw.exercise || raw.name || "").trim();
      if (!exerciseName) {
        errors.push({ line, error: "Exercise name is required." });
        return;
      }
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(raw.date || ""))
        ? String(raw.date)
        : req.body.date || localDateKey();
      const title = String(raw.workout || raw.title || "Gym session").trim() || "Gym session";
      const catalogEx = matchExercise(exerciseName, catalog);
      const modeRaw = String(raw.mode || raw.kind || catalogEx?.kind || "strength").toLowerCase();
      const kind = modeRaw.includes("cardio") ? "cardio" : "strength";
      const equipment = String(raw.equipment || catalogEx?.equipment?.[0] || (kind === "cardio" ? "machine" : "barbell"));
      const unit = String(raw.unit || "kg").toLowerCase() === "lb" ? "lb" : "kg";
      const setCount = Math.max(1, Math.min(20, Math.round(Number(raw.sets) || (kind === "cardio" ? 1 : 3))));
      let sets;
      if (kind === "cardio") {
        const one = {
          durationMin: Number(raw.duration_min || raw.duration) || 20,
          distanceKm: Number(raw.distance_km || raw.distance) || 0,
          speedKmh: Number(raw.speed_kmh || raw.speed) || 0,
          incline: Number(raw.incline) || 0,
        };
        sets = Array.from({ length: setCount }, () => ({ ...one }));
      } else {
        const one = {
          reps: Math.max(1, Math.round(Number(raw.reps) || 10)),
          weight: Math.max(0, Number(raw.weight) || 0),
          unit,
        };
        sets = Array.from({ length: setCount }, () => ({ ...one }));
      }
      const key = `${date}||${title}`;
      if (!groups.has(key)) groups.set(key, { date, title, notes: String(raw.notes || ""), exercises: [] });
      const group = groups.get(key);
      if (raw.notes) group.notes = [group.notes, String(raw.notes)].filter(Boolean).join(" ");
      const blockName = catalogEx?.name || exerciseName;
      const existing = group.exercises.find((e) => e.name.toLowerCase() === blockName.toLowerCase() && e.kind === kind);
      const block = {
        exercise: catalogEx?._id || null,
        name: blockName,
        muscleGroup: catalogEx?.muscleGroup || "other",
        equipmentUsed: equipment,
        kind,
        sets,
        matched: Boolean(catalogEx),
      };
      if (existing) existing.sets.push(...sets);
      else group.exercises.push(block);
    });

    if (!groups.size) {
      return res.status(400).json({ error: "No valid rows to import.", errors });
    }

    const created = [];
    for (const group of groups.values()) {
      let durationMin = 0;
      for (const block of group.exercises) {
        if (block.kind === "cardio") durationMin += block.sets.reduce((s, x) => s + (Number(x.durationMin) || 0), 0);
        else durationMin += (block.sets.length || 0) * 3;
      }
      durationMin = Math.max(1, round(durationMin));
      const startedAt = new Date(`${group.date}T08:00:00`);
      const endedAt = new Date(startedAt.getTime() + durationMin * 60000);
      const workout = new Workout({
        user: req.user._id,
        date: group.date,
        title: group.title,
        notes: group.notes,
        startedAt,
        endedAt,
        durationMin,
        status: "in_progress",
        exercises: group.exercises.map(({ matched, ...block }) => block),
      });
      const stats = await applyWorkoutStats(workout, req.user, { complete: true, durationMin });
      await workout.save();
      created.push({
        id: workout._id,
        title: workout.title,
        date: workout.date,
        exercises: workout.exercises.length,
        calories: workout.calories,
        durationMin: workout.durationMin,
        unmatched: group.exercises.filter((e) => !e.matched).map((e) => e.name),
        stats,
      });
    }

    const day = await dayPayload(req.user, req.body.date || localDateKey());
    res.json({ workouts: created, errors, imported: created.length, day });
  });

  r.post("/workouts/:id/exercises", auth, async (req, res) => {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ error: "Workout not found." });
    const exercise = await Exercise.findById(req.body.exerciseId);
    if (!exercise) return res.status(404).json({ error: "Exercise not found." });
    workout.exercises.push({
      exercise: exercise._id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipmentUsed: req.body.equipmentUsed || exercise.equipment[0],
      kind: exercise.kind,
      sets: exercise.kind === "cardio" ? [{ durationMin: 20, calories: 0 }] : [{ reps: 10, weight: 20, unit: "kg" }],
    });
    await workout.save();
    res.json({ workout });
  });

  r.put("/workouts/:id", auth, async (req, res) => {
    const workout = await Workout.findOne({ _id: req.params.id, user: req.user._id });
    if (!workout) return res.status(404).json({ error: "Workout not found." });
    if (req.body.title) workout.title = req.body.title;
    if (req.body.exercises) workout.exercises = req.body.exercises;
    if (req.body.notes !== undefined) workout.notes = req.body.notes;

    const stats = await applyWorkoutStats(workout, req.user, {
      complete: req.body.status === "completed",
      durationMin: req.body.durationMin,
    });
    if (req.body.status === "completed") workout._stats = stats;
    await workout.save();
    res.json({ workout, stats });
  });

  r.delete("/workouts/:id", auth, async (req, res) => {
    await Workout.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ ok: true });
  });

  r.put("/steps/:date", auth, async (req, res) => {
    try {
      const date = String(req.params.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Choose a valid day." });
      }
      const steps = Math.max(0, Math.min(100000, Math.round(Number(req.body.steps) || 0)));
      const calories = stepCalories(steps, req.user.profile?.currentWeightKg);
      const log = await StepLog.findOneAndUpdate(
        { user: req.user._id, date },
        { $set: { user: req.user._id, date, steps, calories } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const day = await dayPayload(req.user, date);
      res.json({ steps: log, day });
    } catch (err) {
      res.status(400).json({ error: err.message || "Could not save steps." });
    }
  });

  r.get("/weight", auth, async (req, res) => {
    const logs = await WeightLog.find({ user: req.user._id }).sort({ date: 1 });
    res.json({ logs });
  });

  r.put("/weight/:date", auth, async (req, res) => {
    const weightKg = Number(req.body.weightKg);
    if (!weightKg || weightKg < 30 || weightKg > 250) {
      return res.status(400).json({ error: "Enter a weight between 30 and 250 kg." });
    }
    const date = req.params.date;
    const prev = await WeightLog.findOne({ user: req.user._id, date: { $lt: date } }).sort({ date: -1 });
    let avgDailyIntake = 0;
    let gap = 0;
    if (prev?.weightKg) {
      gap = daysBetween(prev.date, date);
      const meals = await Meal.find({ user: req.user._id, date: { $gt: prev.date, $lte: date } });
      const foodCalories = meals.reduce(
        (s, m) => s + (m.items || []).reduce((a, item) => a + (Number(item.calories) || 0), 0),
        0
      );
      const loggedDays = new Set(meals.filter((m) => (m.items || []).length).map((m) => m.date)).size;
      avgDailyIntake = loggedDays ? round(foodCalories / loggedDays) : 0;
    }
    const weekday = weighInWeekday(date);
    const note = req.body.note || (weekday ? `${weekday} weigh-in` : "");
    const log = await WeightLog.findOneAndUpdate(
      { user: req.user._id, date },
      { weightKg, note },
      { upsert: true, new: true }
    );
    req.user.profile.currentWeightKg = weightKg;
    const plan = applyWeighInPlan(req.user.profile.toObject(), {
      newWeightKg: weightKg,
      prevWeightKg: prev?.weightKg,
      daysBetween: gap,
      avgDailyIntake,
    });
    req.user.profile.bmi = plan.bmi;
    req.user.profile.bmr = plan.bmr;
    req.user.profile.tdee = plan.tdee;
    req.user.profile.calorieTarget = plan.calorieTarget;
    req.user.profile.proteinTarget = plan.proteinTarget;
    req.user.profile.carbTarget = plan.carbTarget;
    req.user.profile.fatTarget = plan.fatTarget;
    req.user.profile.fiberTarget = plan.fiberTarget;
    req.user.profile.sugarLimit = plan.sugarLimit;
    req.user.profile.sodiumLimit = plan.sodiumLimit;
    req.user.profile.weeklyBurnTarget = plan.weeklyBurnTarget;
    req.user.profile.estimatesNote = plan.note;
    if (!req.user.profile.calorieMethod) req.user.profile.calorieMethod = "tdee";
    await req.user.save();
    const logs = await WeightLog.find({ user: req.user._id }).sort({ date: 1 });
    res.json({
      log,
      user: publicUser(req.user),
      plan,
      weightProgress: weeklyWeightProgress(logs),
    });
  });

  r.get("/week/:weekStart", auth, async (req, res) => {
    const dates = weekDates(req.params.weekStart);
    const days = [];
    for (const date of dates) days.push(await dayPayload(req.user, date));
    const consumed = roundNutrition(sumNutrition(days.map((d) => d.consumed)));
    const weeklyTarget = (req.user.profile?.calorieTarget || 0) * 7;
    const daysWithin = days.filter((d) => {
      if (!d.consumed.calories) return false;
      const t = d.targets.calorieTarget || 1;
      return Math.abs(d.consumed.calories - t) / t <= 0.1 || d.consumed.calories <= t;
    }).length;
    const loggedDays = days.filter((d) => d.consumed.calories > 0).length;
    const burnActual = days.reduce((s, d) => s + d.activeKcal, 0);
    const workoutsDone = days.filter((d) => d.workouts.length).length;
    const energyWeek = weekEnergy(days, req.user.profile || {});
    const totalSteps = days.reduce((s, d) => s + (Number(d.steps?.steps) || 0), 0);
    const workoutCount = days.reduce((s, d) => s + (d.workout?.count || 0), 0);
    const totalWorkoutDuration = days.reduce((s, d) => s + (d.workout?.durationMin || 0), 0);
    res.json({
      weekStart: req.params.weekStart,
      dates,
      days,
      weekly: {
        caloriesTarget: weeklyTarget,
        caloriesConsumed: consumed.calories,
        avgCalories: loggedDays ? round(consumed.calories / loggedDays) : 0,
        protein: consumed.protein,
        avgProtein: loggedDays ? round(consumed.protein / loggedDays, 1) : 0,
        carbs: consumed.carbs,
        fat: consumed.fat,
        fiber: consumed.fiber,
        daysWithinTarget: daysWithin,
        loggedDays,
        burnTarget: (req.user.profile?.weeklyBurnTarget || 0),
        burnActual: round(burnActual),
        burnDiff: round(burnActual - (req.user.profile?.weeklyBurnTarget || 0)),
        workoutsDone,
        calorieMethod: req.user.profile?.calorieMethod === "activity" ? "activity" : "tdee",
        targetDailyDeficit: energyWeek.targetDailyDeficit,
        targetWeeklyDeficit: energyWeek.targetWeeklyDeficit,
        actualDeficit: energyWeek.actualDeficit,
        avgDailyDeficit: energyWeek.avgDailyDeficit,
        deficitProgressPct: energyWeek.progressPct,
        totalSteps,
        avgSteps: round(totalSteps / 7),
        workoutCount,
        avgWorkoutDuration: workoutCount ? round(totalWorkoutDuration / workoutCount) : 0,
        totalWorkoutDuration,
        methodNote: days[0]?.energy?.methodNote,
      },
      estimated: true,
    });
  });

  r.get("/journey", auth, async (req, res) => {
    const logs = await WeightLog.find({ user: req.user._id }).sort({ date: 1 });
    const p = req.user.profile;
    const start = p.startWeightKg || logs[0]?.weightKg || p.currentWeightKg;
    const current = p.currentWeightKg;
    const target = p.targetWeightKg;
    const lost = round((start || 0) - (current || 0), 1);
    const span = Math.max(0.1, (start || 0) - (target || 0));
    const progress = span > 0 ? Math.min(100, Math.max(0, round(((start - current) / span) * 100))) : 0;
    const timeline = goalTimeline(p || {});
    const plannedDailyDeficit = round((p.tdee || 0) - (p.calorieTarget || 0));
    res.json({
      startWeight: start,
      currentWeight: current,
      targetWeight: target,
      totalLost: lost,
      remaining: timeline.remainingKg,
      targetDate: p.targetDate,
      progress,
      logs,
      activityLabel: timeline.activityLabel,
      calorieMethod: p.calorieMethod === "activity" ? "activity" : "tdee",
      tdee: p.tdee,
      bmr: p.bmr,
      requiredWeeklyLossKg: timeline.requiredWeeklyLossKg,
      requiredDailyDeficit: timeline.requiredDailyDeficit,
      requiredWeeklyDeficit: timeline.requiredWeeklyDeficit,
      weeksRemaining: timeline.weeksRemaining,
      daysRemaining: timeline.daysRemaining,
      plannedDailyDeficit,
      plannedWeeklyDeficit: plannedDailyDeficit * 7,
      targetsAreEstimates: true,
      weightProgress: weeklyWeightProgress(logs),
      estimatesNote: p.estimatesNote,
    });
  });

  r.get("/timeline/:date", auth, async (req, res) => {
    const day = await dayPayload(req.user, req.params.date);
    const events = [];
    for (const meal of Object.values(day.meals)) {
      for (const item of meal.items) {
        events.push({
          type: "food",
          at: item.loggedAt,
          slot: meal.slot,
          label: meal.label,
          title: item.foodName,
          detail: `${item.quantity} ${item.unit}`,
          calories: item.calories,
        });
      }
    }
    for (const w of day.workouts) {
      events.push({
        type: "workout",
        at: w.startedAt,
        label: "Workout",
        title: w.title,
        detail: (w.exercises || []).map((e) => e.name).join(", "),
        calories: w.calories,
        durationMin: w.durationMin,
      });
    }
    events.sort((a, b) => new Date(a.at) - new Date(b.at));
    res.json({ date: req.params.date, events, day });
  });

  r.get("/nutrients/:date", auth, async (req, res) => {
    const day = await dayPayload(req.user, req.params.date);
    const weekStart = startOfWeek(req.params.date);
    const dates = weekDates(weekStart);
    const weekDays = [];
    for (const d of dates) weekDays.push(await dayPayload(req.user, d));
    const avg = roundNutrition({
      calories: weekDays.reduce((s, d) => s + d.consumed.calories, 0) / 7,
      protein: weekDays.reduce((s, d) => s + d.consumed.protein, 0) / 7,
      carbs: weekDays.reduce((s, d) => s + d.consumed.carbs, 0) / 7,
      fat: weekDays.reduce((s, d) => s + d.consumed.fat, 0) / 7,
      fiber: weekDays.reduce((s, d) => s + d.consumed.fiber, 0) / 7,
      sugar: weekDays.reduce((s, d) => s + d.consumed.sugar, 0) / 7,
      sodium: weekDays.reduce((s, d) => s + d.consumed.sodium, 0) / 7,
    });
    const byMeal = {};
    for (const [slot, meal] of Object.entries(day.meals)) {
      byMeal[slot] = meal.totals;
    }
    res.json({ date: req.params.date, daily: day.consumed, targets: day.targets, weeklyAverage: avg, byMeal, estimated: true });
  });

  return r;
}

module.exports = { createRouter, seedDemoBreakfast, MEAL_SLOTS, MEAL_LABELS };
