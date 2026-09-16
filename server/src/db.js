const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    return;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGODB_URI is required in production");
  }
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const mem = await MongoMemoryServer.create({
    instance: { launchTimeout: 120000 },
  });
  mongoose.set("strictQuery", true);
  await mongoose.connect(mem.getUri());
  console.log("MongoDB memory server connected");
}

module.exports = { connectDb };
