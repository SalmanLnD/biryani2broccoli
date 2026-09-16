const jwt = require("jsonwebtoken");
const { User } = require("./models");

function signToken(user) {
  return jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "30d",
  });
}

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ error: "Account not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}

module.exports = { signToken, auth };
