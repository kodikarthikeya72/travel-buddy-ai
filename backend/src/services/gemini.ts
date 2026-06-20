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
  weather?: { tempHighC: number; tempLowC: number; precipitationMm: number };
}

export async function generateItinerary(input: TripInput): Promise<GeneratedTrip> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 500 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const weatherNote = input.weather
    ? `\nWeather context for ${input.travelMonth}: avg high ${input.weather.tempHighC}°C, avg low ${input.weather.tempLowC}°C, ${input.weather.precipitationMm}mm precipitation. Tailor outdoor vs indoor activities accordingly and add brief weather-aware tips.`
    : "";

  const prompt = `Generate a travel itinerary for:

Destination: ${input.destination}
Days: ${input.days}
Budget: ${input.budgetType}
Interests: ${input.interests.join(", ")}
Travel Month: ${input.travelMonth}
Travel Style: ${input.travelStyle}${weatherNote}

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

export async function regenerateDay(
  input: TripInput,
  dayNumber: number,
  avoid: string[],
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GEMINI_API_KEY is not set"), { status: 500 });
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  const prompt = `Suggest a fresh single-day itinerary (3-5 concise activities) for day ${dayNumber} of a ${input.days}-day trip to ${input.destination} in ${input.travelMonth}. Style: ${input.travelStyle}. Budget: ${input.budgetType}. Interests: ${input.interests.join(", ")}.
Avoid repeating these activities: ${avoid.join(" | ") || "(none)"}.
Return ONLY valid JSON: { "activities": ["...", "..."] }`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as { activities: unknown };
  const arr = z.array(z.string()).parse(parsed.activities);
  return arr;
}