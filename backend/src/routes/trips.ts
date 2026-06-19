import { Router } from "express";
import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { generateItinerary } from "../services/gemini.js";

const router = Router();
router.use(requireAuth);

const generateSchema = z.object({
  destination: z.string().min(1).max(120),
  days: z.number().int().min(1).max(30),
  budgetType: z.enum(["Low", "Medium", "High"]),
  interests: z.array(z.string().max(40)).min(1).max(10),
  travelMonth: z.string().min(1).max(20),
  travelStyle: z.enum(["Solo", "Couple", "Family", "Friends"]),
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ trips });
  } catch (e) { next(e); }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ error: { message: "Trip not found" } });
    res.json({ trip });
  } catch (e) { next(e); }
});

router.post("/generate", async (req: AuthRequest, res, next) => {
  try {
    const input = generateSchema.parse(req.body);
    const ai = await generateItinerary(input);
    const trip = await Trip.create({
      userId: req.userId,
      destination: input.destination,
      days: input.days,
      budgetType: input.budgetType,
      interests: input.interests,
      travelMonth: input.travelMonth,
      travelStyle: input.travelStyle,
      itinerary: ai.itinerary,
      budgetEstimate: ai.budget,
      hotels: ai.hotels,
    });
    res.json({ trip });
  } catch (e) { next(e); }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const result = await Trip.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: { message: "Not found" } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;