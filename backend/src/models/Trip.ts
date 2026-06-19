import mongoose, { Schema } from "mongoose";

const tripSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true, min: 1, max: 30 },
  budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
  interests: { type: [String], default: [] },
  travelMonth: { type: String, required: true },
  travelStyle: { type: String, enum: ["Solo", "Couple", "Family", "Friends"], required: true },
  itinerary: [{ day: Number, activities: [String] }],
  budgetEstimate: {
    flights: Number,
    accommodation: Number,
    food: Number,
    activities: Number,
    total: Number,
  },
  hotels: [{ name: String, rating: String, priceRange: String }],
  createdAt: { type: Date, default: Date.now },
});

export const Trip = mongoose.model("Trip", tripSchema);