const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  calculateWalkingCalories,
  roundDisplayKcal,
  energyBalance,
} = require("./calc");

describe("calculateWalkingCalories", () => {
  it("estimates 94.32 kg / 176 cm / 5,144 steps at ~177 active kcal (~180 displayed)", () => {
    const result = calculateWalkingCalories({
      steps: 5144,
      weightKg: 94.32,
      heightCm: 176,
      sex: "male",
    });
    assert.equal(result.calculationMethod, "DISTANCE_ESTIMATE");
    assert.ok(Math.abs(result.distanceKm - 3.757) < 0.02);
    assert.ok(Math.abs(result.activeCalories - 177.2) < 1);
    assert.equal(roundDisplayKcal(result.activeCalories), 180);
  });

  it("estimates 96 kg / 176 cm / 10,000 steps in the 350–370 range", () => {
    const result = calculateWalkingCalories({
      steps: 10000,
      weightKg: 96,
      heightCm: 176,
      sex: "male",
    });
    assert.ok(Math.abs(result.distanceKm - 7.304) < 0.05);
    assert.ok(result.activeCalories >= 350 && result.activeCalories <= 370);
  });

  it("returns fewer calories for a lighter 70 kg user at the same steps", () => {
    const heavy = calculateWalkingCalories({ steps: 10000, weightKg: 96, heightCm: 176, sex: "male" });
    const light = calculateWalkingCalories({ steps: 10000, weightKg: 70, heightCm: 170, sex: "male" });
    assert.ok(light.activeCalories < heavy.activeCalories);
  });

  it("increases calories when steps increase", () => {
    const a = calculateWalkingCalories({ steps: 5000, weightKg: 90, heightCm: 176, sex: "male" });
    const b = calculateWalkingCalories({ steps: 10000, weightKg: 90, heightCm: 176, sex: "male" });
    assert.ok(b.activeCalories > a.activeCalories);
  });

  it("increases calories when body weight increases", () => {
    const a = calculateWalkingCalories({ steps: 8000, weightKg: 80, heightCm: 176, sex: "male" });
    const b = calculateWalkingCalories({ steps: 8000, weightKg: 95, heightCm: 176, sex: "male" });
    assert.ok(b.activeCalories > a.activeCalories);
  });

  it("changes estimated distance when height changes", () => {
    const a = calculateWalkingCalories({ steps: 5144, weightKg: 94.32, heightCm: 176, sex: "male" });
    const b = calculateWalkingCalories({ steps: 5144, weightKg: 94.32, heightCm: 190, sex: "male" });
    assert.ok(b.distanceKm > a.distanceKm);
  });

  it("uses MET when duration is available and does not count resting calories", () => {
    const result = calculateWalkingCalories({
      steps: 5144,
      weightKg: 94.32,
      heightCm: 176,
      sex: "male",
      durationMinutes: 45,
      intensity: "normal",
    });
    assert.equal(result.calculationMethod, "MET");
    assert.ok(result.activeCalories > 0);
    assert.ok(result.totalCalories > result.activeCalories);
    assert.ok(Math.abs(result.activeCalories - (result.totalCalories - result.restingCalories)) < 0.01);
  });

  it("never returns 0 when steps, height and weight are available without duration", () => {
    const result = calculateWalkingCalories({ steps: 2000, weightKg: 80, heightCm: 170, sex: "female" });
    assert.equal(result.calculationMethod, "DISTANCE_ESTIMATE");
    assert.ok(result.activeCalories > 0);
  });

  it("does not add walking calories on top of TDEE deficit", () => {
    const energy = energyBalance({
      method: "tdee",
      tdee: 2500,
      foodCalories: 2000,
      stepKcal: 177,
      exerciseKcal: 400,
    });
    assert.equal(energy.estimatedDeficit, 500);
    assert.equal(energy.walkActiveKcal, 177);
  });

  it("uses stored walking calories as already-active values in activity mode", () => {
    const energy = energyBalance({
      method: "activity",
      bmr: 1800,
      tdee: 2500,
      foodCalories: 2000,
      stepKcal: 177,
      exerciseKcal: 400,
    });
    assert.equal(energy.walkActiveKcal, 177);
    assert.equal(energy.estimatedDeficit, 737);
  });
});
