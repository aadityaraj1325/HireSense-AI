const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const required = ["MONGO_URI", "JWT_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
    console.error('Missing required env vars:', missing.join(", "));
    process.exit(1);
}

module.exports = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    cookieName: process.env.COOKIE_NAME || "arr_token",
    clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173, http://localhost:5174")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    geminiApiKey: /^(your[-_]|change[-_]|replace[-_]|<)/i.test(process.env.GEMINI_API_KEY || "")
        ? ""
        : (process.env.GEMINI_API_KEY || ""),
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    geminiFallbackModels: (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash-lite")
        .split(",")
        .map((model) => model.trim())
        .filter(Boolean),
    geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 30_000,
    isProd: process.env.NODE_ENV === "production",
};