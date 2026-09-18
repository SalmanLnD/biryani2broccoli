const mongoose = require("mongoose");

const NutritionSchema = new mongoose.Schema(
  {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    sugar: { type: Number, default: 0 },
    sodium: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProfileSchema = new mongoose.Schema(
  {
    age: Number,
    sex: { type: String, enum: ["male", "female", "other"] },
    heightCm: Number,
    currentWeightKg: Number,
    startWeightKg: Number,
    targetWeightKg: Number,
    targetDate: String,
    activityLevel: { type: String, default: "light" },
    calorieMethod: { type: String, enum: ["tdee", "activity"], default: "tdee" },
    stepTarget: { type: Number, default: 8000 },
    calorieTarget: Number,
    proteinTarget: Number,
    carbTarget: Number,
    fatTarget: Number,
    fiberTarget: Number,
    sugarLimit: Number,
    sodiumLimit: Number,
    weeklyBurnTarget: Number,
    bmi: Number,
    bmr: Number,
    tdee: Number,
    estimatesNote: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    profile: ProfileSchema,
  },
  { timestamps: true }
);

const FoodSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String,
    category: String,
    cuisine: String,
    estimated: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    baseAmountG: { type: Number, default: 100 },
    nutritionPer100g: NutritionSchema,
    servings: { type: mongoose.Schema.Types.Mixed, default: {} },
    defaultUnit: { type: String, default: "grams" },
    defaultQuantity: { type: Number, default: 100 },
  },
  { timestamps: true }
);

const MealItemSchema = new mongoose.Schema(
  {
    food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    foodName: String,
    quantity: Number,
    unit: String,
    grams: Number,
    estimated: { type: Boolean, default: true },
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MealSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    slot: {
      type: String,
      enum: ["breakfast", "morning_snack", "lunch", "evening_snack", "dinner", "other"],
      required: true,
    },
    items: [MealItemSchema],
  },
  { timestamps: true }
);
MealSchema.index({ user: 1, date: 1, slot: 1 }, { unique: true });

const ExerciseSchema = new mongoose.Schema(
  {
    slug: { type: String, unique: true },
    name: String,
    muscleGroup: String,
    equipment: [String],
    difficulty: String,
    kind: { type: String, enum: ["strength", "cardio"], default: "strength" },
    met: Number,
    instructions: [String],
    pose: String,
    usesWeight: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const WorkoutSetSchema = new mongoose.Schema(
  {
    reps: Number,
    weight: Number,
    unit: { type: String, enum: ["kg", "lb"], default: "kg" },
    durationMin: Number,
    distanceKm: Number,
    speedKmh: Number,
    incline: Number,
    calories: Number,
  },
  { _id: true }
);

const WorkoutExerciseSchema = new mongoose.Schema({
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: "Exercise" },
  name: String,
  muscleGroup: String,
  equipmentUsed: String,
  kind: String,
  sets: [WorkoutSetSchema],
});

const WorkoutSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: String,
    title: String,
    startedAt: Date,
    endedAt: Date,
    durationMin: Number,
    durationSource: String,
    durationEstimated: { type: Boolean, default: false },
    intensity: { type: String, enum: ["light", "moderate", "vigorous"], default: "moderate" },
    calories: Number,
    notes: String,
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    exercises: [WorkoutExerciseSchema],
    personalRecords: [String],
  },
  { timestamps: true }
);

const WeightLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: String,
    weightKg: Number,
    note: String,
  },
  { timestamps: true }
);
WeightLogSchema.index({ user: 1, date: 1 }, { unique: true });

const StepLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: String,
  steps: { type: Number, default: 0 },
  calories: { type: Number, default: 0 },
});
StepLogSchema.index({ user: 1, date: 1 }, { unique: true });

const DailySummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  date: String,
  consumed: NutritionSchema,
  targets: mongoose.Schema.Types.Mixed,
  exerciseKcal: Number,
  stepKcal: Number,
  activeKcal: Number,
  netCalories: Number,
  insights: [String],
});

const WeeklySummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  weekStart: String,
  caloriesTarget: Number,
  caloriesConsumed: Number,
  avgCalories: Number,
  protein: Number,
  avgProtein: Number,
  carbs: Number,
  fat: Number,
  fiber: Number,
  daysWithinTarget: Number,
  burnTarget: Number,
  burnActual: Number,
});

module.exports = {
  User: mongoose.model("User", UserSchema),
  Food: mongoose.model("Food", FoodSchema),
  Meal: mongoose.model("Meal", MealSchema),
  Exercise: mongoose.model("Exercise", ExerciseSchema),
  Workout: mongoose.model("Workout", WorkoutSchema),
  WeightLog: mongoose.model("WeightLog", WeightLogSchema),
  StepLog: mongoose.model("StepLog", StepLogSchema),
  DailySummary: mongoose.model("DailySummary", DailySummarySchema),
  WeeklySummary: mongoose.model("WeeklySummary", WeeklySummarySchema),
};
