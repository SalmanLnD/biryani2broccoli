require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const { connectDb } = require("./db");
const { createRouter } = require("./api");
const { seedCatalog } = require("./seed");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "biryani2broccoli" });
});

app.use("/api", createRouter());

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) next();
  });
});

async function start() {
  await connectDb();
  await seedCatalog();
  app.listen(PORT, "0.0.0.0", () => console.log(`B2B API on ${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
