// Open-Meteo geocoding + climate (no API key required).
// Returns avg high/low °C and precipitation mm for the destination + month.
const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export interface WeatherSummary {
  tempHighC: number;
  tempLowC: number;
  precipitationMm: number;
}

export async function getWeatherSummary(
  destination: string,
  travelMonth: string,
): Promise<WeatherSummary | null> {
  const month = MONTHS[travelMonth.trim().toLowerCase()];
  if (!month) return null;
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(destination)}`,
    ).then((r) => r.json() as Promise<{ results?: { latitude: number; longitude: number }[] }>);
    const loc = geo.results?.[0];
    if (!loc) return null;

    const year = new Date().getFullYear() - 1;
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${endDay}`;

    const w = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.latitude}&longitude=${loc.longitude}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`,
    ).then((r) => r.json() as Promise<{
      daily?: { temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[] };
    }>);

    const d = w.daily;
    if (!d) return null;
    const avg = (a: number[]) => a.reduce((s, n) => s + n, 0) / a.length;
    const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
    return {
      tempHighC: Math.round(avg(d.temperature_2m_max)),
      tempLowC: Math.round(avg(d.temperature_2m_min)),
      precipitationMm: Math.round(sum(d.precipitation_sum)),
    };
  } catch {
    return null;
  }
}