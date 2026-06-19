import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const itinerarySchema = z.object({
  itinerary: z.array(z.object({
    day: z.number(),
    activities: z.array(z.string()),
  })),
  budget: z.object({
    flights: z.number(),
    accommodation: z.number(),
    food: z.number(),
    activities: z.number(),
    total: z.number(),
  }),
  hotels: z.array(z.object({
    name: z.string(),
    rating: z.string(),
    priceRange: z.string(),
  })),
});

export type GeneratedTrip = z.infer<typeof itinerarySchema>;

export interface TripInput {
  destination: string;
  days: number;
  budgetType: string;
  interests: string[];
  travelMonth: string;
  travelStyle: string;
}

export async function generateItinerary(input: TripInput): Promise<GeneratedTrip> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `Generate a travel itinerary for:

Destination: ${input.destination}
Days: ${input.days}
Budget: ${input.budgetType}
Interests: ${input.interests.join(", ")}
Travel Month: ${input.travelMonth}
Travel Style: ${input.travelStyle}

Return ONLY valid JSON with this exact shape:
{
  "itinerary": [{ "day": 1, "activities": ["..."] }],
  "budget": { "flights": 0, "accommodation": 0, "food": 0, "activities": 0, "total": 0 },
  "hotels": [{ "name": "", "rating": "", "priceRange": "" }]
}

The itinerary must contain exactly ${input.days} day objects. Each day must contain 3-5 concise activities. Budget values are in USD per person for the whole trip. Provide 3 hotel suggestions.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw Object.assign(new Error("AI returned invalid JSON"), { status: 502 }); }
  return itinerarySchema.parse(parsed);
}