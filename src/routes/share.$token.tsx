import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api, type Trip } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Plane, Hotel, Utensils, Ticket, Wallet, Star, CloudSun } from "lucide-react";

export const Route = createFileRoute("/share/$token")({
  head: () => ({ meta: [{ title: "Shared trip — Wayfare" }] }),
  component: SharedTrip,
});

function SharedTrip() {
  const { token } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["shared", token],
    queryFn: () => api<{ trip: Trip }>(`/api/public/trips/share/${token}`).then((r) => r.trip),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5 text-primary" /> Wayfare
          </Link>
          <Button asChild size="sm" variant="outline"><Link to="/register">Plan your own</Link></Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center max-w-md mx-auto">
            <h2 className="font-semibold">Shared trip not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">The link may have been revoked.</p>
            <Button asChild className="mt-4"><Link to="/">Home</Link></Button>
          </div>
        )}
        {data && <SharedView t={data} />}
      </main>
    </div>
  );
}

function SharedView({ t }: { t: Trip }) {
  const budgetItems = [
    { label: "Flights", value: t.budgetEstimate.flights, icon: Plane },
    { label: "Accommodation", value: t.budgetEstimate.accommodation, icon: Hotel },
    { label: "Food", value: t.budgetEstimate.food, icon: Utensils },
    { label: "Activities", value: t.budgetEstimate.activities, icon: Ticket },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
            <MapPin className="h-7 w-7 text-primary" /> {t.destination}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> {t.days} days · {t.travelMonth} · {t.travelStyle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.interests.map((i) => <Badge key={i} variant="secondary">{i}</Badge>)}
        </div>
      </div>

      {t.weather && (
        <section className="mt-8 rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <CloudSun className="h-4 w-4" /> Weather insights for {t.travelMonth}
          </h2>
          <p className="mt-2 text-sm">
            Avg highs <strong>{t.weather.tempHighC}°C</strong>, lows <strong>{t.weather.tempLowC}°C</strong>,
            precipitation <strong>{t.weather.precipitationMm}mm</strong>.
          </p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Wallet className="h-5 w-5 text-accent" /> Budget</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {budgetItems.map((b) => (
            <div key={b.label} className="rounded-xl border bg-card p-4">
              <b.icon className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">{b.label}</p>
              <p className="text-lg font-semibold">${b.value.toLocaleString()}</p>
            </div>
          ))}
          <div className="rounded-xl border bg-primary p-4 text-primary-foreground">
            <p className="text-xs opacity-80">Total</p>
            <p className="text-2xl font-bold">${t.budgetEstimate.total.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Itinerary</h2>
        <div className="mt-4 space-y-4">
          {t.itinerary.map((d) => (
            <div key={d.day} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-lg">Day {d.day}</h3>
              <ul className="mt-3 space-y-2">
                {d.activities.map((a, i) => (
                  <li key={i} className="flex gap-2 items-start text-sm">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 mb-12">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Hotel className="h-5 w-5 text-accent" /> Hotel picks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {t.hotels.map((h, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold">{h.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {h.rating}
              </p>
              <p className="text-sm mt-2">{h.priceRange}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}