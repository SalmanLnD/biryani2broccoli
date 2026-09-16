require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
require("dotenv").config();
const { connectDb } = require("./db");
const { Food, Exercise } = require("./models");
const { FOODS } = require("./foods");
const { EXERCISES } = require("./exercises");

async function seedCatalog() {
  const foodCount = await Food.countDocuments({ owner: null });
  if (foodCount === 0) {
    await Food.insertMany(FOODS);
    console.log(`Seeded ${FOODS.length} foods`);
  } else {
    for (const food of FOODS) {
      await Food.updateOne({ slug: food.slug, owner: null }, { $set: food }, { upsert: true });
    }
    console.log(`Updated ${FOODS.length} foods`);
  }
  const exCount = await Exercise.countDocuments();
  if (exCount === 0) {
    await Exercise.insertMany(EXERCISES);
    console.log(`Seeded ${EXERCISES.length} exercises`);
  } else {
    for (const ex of EXERCISES) {
      await Exercise.updateOne({ slug: ex.slug }, { $set: ex }, { upsert: true });
    }
    console.log(`Updated ${EXERCISES.length} exercises`);
  }
}

async function main() {
  await connectDb();
  await seedCatalog();
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedCatalog };
