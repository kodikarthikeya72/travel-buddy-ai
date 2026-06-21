import { Router } from "express";
import { Trip } from "../models/Trip.js";

const router = Router();

// Public read-only access via share token. Only the trip content is returned —
// never userId or shareToken itself.
router.get("/trips/share/:token", async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ shareToken: req.params.token }).lean();
    if (!trip) return res.status(404).json({ error: { message: "Shared trip not found" } });
    const { userId, shareToken, __v, ...safe } = trip as Record<string, unknown>;
    void userId; void shareToken; void __v;
    res.json({ trip: safe });
  } catch (e) { next(e); }
});

export default router;