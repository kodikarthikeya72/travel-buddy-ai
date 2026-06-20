import { Router } from "express";
import { z } from "zod";
import { Trip } from "../models/Trip.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { generateItinerary, regenerateDay } from "../services/gemini.js";
import { getWeatherSummary } from "../services/weather.js";

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
    const weather = await getWeatherSummary(input.destination, input.travelMonth);
    const ai = await generateItinerary({ ...input, weather: weather ?? undefined });
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
      weather: weather ?? undefined,
    });
    res.json({ trip });
  } catch (e) { next(e); }
});

const updateItinerarySchema = z.object({
  itinerary: z.array(z.object({
    day: z.number().int().min(1),
    activities: z.array(z.string().min(1).max(400)).min(1).max(10),
  })),
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const body = updateItinerarySchema.parse(req.body);
    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { itinerary: body.itinerary } },
      { new: true },
    );
    if (!trip) return res.status(404).json({ error: { message: "Trip not found" } });
    res.json({ trip });
  } catch (e) { next(e); }
});

router.post("/:id/regenerate-day", async (req: AuthRequest, res, next) => {
  try {
    const { day } = z.object({ day: z.number().int().min(1) }).parse(req.body);
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.userId });
    if (!trip) return res.status(404).json({ error: { message: "Trip not found" } });
    const avoid = trip.itinerary.flatMap((d) => d.activities ?? []);
    const activities = await regenerateDay(
      {
        destination: trip.destination,
        days: trip.days,
        budgetType: trip.budgetType,
        interests: trip.interests,
        travelMonth: trip.travelMonth,
        travelStyle: trip.travelStyle,
      },
      day,
      avoid,
    );
    const idx = trip.itinerary.findIndex((d) => d.day === day);
    if (idx === -1) trip.itinerary.push({ day, activities });
    else trip.itinerary[idx].activities = activities;
    await trip.save();
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