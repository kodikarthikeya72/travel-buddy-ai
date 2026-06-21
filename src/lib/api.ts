const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

const TOKEN_KEY = "atp_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error?.message || data?.message || res.statusText;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export type User = { _id: string; name: string; email: string };
export type Trip = {
  _id: string;
  userId: string;
  destination: string;
  days: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  travelMonth: string;
  travelStyle: "Solo" | "Couple" | "Family" | "Friends";
  itinerary: { day: number; activities: string[] }[];
  budgetEstimate: {
    flights: number;
    accommodation: number;
    food: number;
    activities: number;
    total: number;
  };
  hotels: { name: string; rating: string; priceRange: string }[];
  weather?: { tempHighC: number; tempLowC: number; precipitationMm: number };
  coords?: { lat: number; lng: number };
  shareToken?: string | null;
  createdAt: string;
};