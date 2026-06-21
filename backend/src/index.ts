import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import { connectDB } from "./db.js";
import authRoutes from "./routes/auth.js";
import tripRoutes from "./routes/trips.js";
import publicRoutes from "./routes/public.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json({ limit: "100kb" }));
app.use(mongoSanitize());

app.get("/health", (_req, res) => res.json({ ok: true }));

const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });
const genLimiter = rateLimit({ windowMs: 60 * 60_000, max: 20 });

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/trips/generate", genLimiter);
app.use("/api/trips", tripRoutes);

app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Wayfare API on :${PORT}`));
});