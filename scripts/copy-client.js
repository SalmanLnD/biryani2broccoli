const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "client", "dist");
const dest = path.join(__dirname, "..", "server", "public");

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Copied client/dist -> server/public");
